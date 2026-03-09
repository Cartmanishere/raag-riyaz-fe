export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
}

export interface AuthActor {
  user_id: string;
  email: string;
  org_id: string;
  role: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  actor: AuthActor;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  actor: AuthActor;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface LogoutResponse {
  revoked: boolean;
}

export interface AuthMeResponse {
  actor: AuthActor;
}

export interface ApiError {
  code?: string;
  message: string;
  statusCode: number;
}

export interface HealthStatus {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
}
