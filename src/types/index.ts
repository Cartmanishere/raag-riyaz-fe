// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Common error shape
export interface ApiError {
  message: string;
  statusCode: number;
}

// Health check
export interface HealthStatus {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
}
