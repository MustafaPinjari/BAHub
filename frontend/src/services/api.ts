import axios, { AxiosError, type AxiosRequestConfig } from "axios";

// Access environment backend base url or fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent infinite loops on token refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach JWT Access Token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Manage Token Expiration and Refresh
api.interceptors.response.use(
  (response) => {
    // Return standard success structure
    // If backend returns { success: true, data: ... }, we pass that through
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      return Promise.reject({
        success: false,
        message: "Network error. Please check if backend server is running.",
        errors: { network: ["Unable to connect to the server."] },
      });
    }

    const { status, data } = error.response;

    // Standardize the response error structure from backend
    const apiError = data as {
      success?: boolean;
      message?: string;
      errors?: Record<string, string[]>;
    };

    // If 401 and not already retrying, attempt token refresh
    if (status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the request was the login or refresh request itself
      if (
        originalRequest.url?.includes("/auth/login/") ||
        originalRequest.url?.includes("/auth/token/refresh/")
      ) {
        return Promise.reject(apiError);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        // No refresh token available, logout user
        localStorage.clear();
        window.location.href = "/login?expired=true";
        return Promise.reject(apiError);
      }

      try {
        // Obtain new access token
        const refreshResponse = await axios.post<{
          success: boolean;
          data: { access: string; refresh?: string };
        }>(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = refreshResponse.data.data.access;
        localStorage.setItem("accessToken", newAccessToken);
        
        if (refreshResponse.data.data.refresh) {
          localStorage.setItem("refreshToken", refreshResponse.data.data.refresh);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;
        
        // Refresh token is expired or invalid
        localStorage.clear();
        window.location.href = "/login?expired=true";
        return Promise.reject({
          success: false,
          message: "Session expired. Please log in again.",
          errors: { session: ["Your session has expired."] },
        });
      }
    }

    // Return structured reject with backend validation error format
    return Promise.reject({
      success: false,
      message: apiError.message || "An unexpected error occurred.",
      errors: apiError.errors || { general: [error.message] },
      status,
    });
  }
);
