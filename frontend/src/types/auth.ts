export type UserRole = 
  | "ADMIN"
  | "BUSINESS_ANALYST"
  | "PRODUCT_OWNER"
  | "DEVELOPER"
  | "QA_TESTER"
  | "STAKEHOLDER";

export interface UserPreference {
  theme: "dark" | "light" | "system";
  accent_color: string;
  language: string;
  timezone: string;
  date_format: string;
  time_format: "12h" | "24h";
  sidebar_state: "expanded" | "collapsed";
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string | null;
  bio: string | null;
  profile_picture: string | null;
  organization: string | null;
  organization_name: string;
  preferences: UserPreference;
  created_at: string;
}

export interface UserSession {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  browser: string | null;
  device: string | null;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, any>;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors: Record<string, string[]>;
  status?: number;
}
