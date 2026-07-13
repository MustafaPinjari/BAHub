import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./UIComponents";

interface ApiErrorFallbackProps {
  error?: {
    message?: string;
    errors?: Record<string, string[]>;
    status?: number;
  };
  onRetry?: () => void;
  context?: string;
}

export const ApiErrorFallback: React.FC<ApiErrorFallbackProps> = ({
  error,
  onRetry,
  context = "operation"
}) => {
  const isNetworkError = !error?.status;
  const isServerError = error?.status && error.status >= 500;
  const isClientError = error?.status && error.status >= 400 && error.status < 500;

  const getErrorMessage = () => {
    if (isNetworkError) {
      return "Unable to connect to the server. Please check your internet connection.";
    }
    if (isServerError) {
      return "Server error occurred. Our team has been notified.";
    }
    if (isClientError) {
      return error?.message || "Request failed. Please check your input.";
    }
    return "An unexpected error occurred.";
  };

  const getErrorDetails = () => {
    if (error?.errors && Object.keys(error.errors).length > 0) {
      return Object.entries(error.errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
        .join("\n");
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2">
        {context.charAt(0).toUpperCase() + context.slice(1)} Failed
      </h3>
      
      <p className="text-sm text-gray-400 max-w-md mb-6">
        {getErrorMessage()}
      </p>

      {getErrorDetails() && (
        <div className="bg-black/50 border border-white/10 rounded-lg p-4 mb-6 max-w-md">
          <p className="text-xs text-gray-500 font-mono text-left whitespace-pre-wrap">
            {getErrorDetails()}
          </p>
        </div>
      )}

      {onRetry && (
        <Button
          onClick={onRetry}
          className="flex items-center gap-2"
          size="sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      )}
    </div>
  );
};
