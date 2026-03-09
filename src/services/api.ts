import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError, ApiErrorPayload, AuthResponse } from "@/types";
import {
  clearSessionSnapshot,
  getSessionSnapshot,
  mapAuthResponseToSession,
  setSessionSnapshot,
} from "@/services/auth-session";

const apiClient: AxiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://stg-raag-riyaz-api.kanha.dev",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface RequestOptions extends AxiosRequestConfig {
  skipAuthRefresh?: boolean;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

let refreshPromise: Promise<string> | null = null;

function normalizeApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const statusCode = axiosError.response?.status ?? 500;
  const errorPayload = axiosError.response?.data?.error;
  const message =
    errorPayload?.message ??
    axiosError.response?.data?.message ??
    axiosError.message ??
    "An error occurred";

  return {
    code: errorPayload?.code,
    message,
    statusCode,
  };
}

function isAuthLifecycleRequest(url?: string) {
  return ["/auth/login", "/auth/refresh", "/auth/logout"].some(
    (path) => url?.endsWith(path)
  );
}

async function refreshAccessToken() {
  const currentSession = getSessionSnapshot();
  if (!currentSession?.refreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await axios.post<AuthResponse>(
    "/auth/refresh",
    { refresh_token: currentSession.refreshToken },
    {
      baseURL: apiClient.defaults.baseURL,
      timeout: apiClient.defaults.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const nextSession = mapAuthResponseToSession(response.data);
  setSessionSnapshot(nextSession);
  return nextSession.accessToken;
}

apiClient.interceptors.request.use(
  (config) => {
    const session = getSessionSnapshot();

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const requestConfig = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      requestConfig &&
      !requestConfig._retry &&
      !requestConfig.skipAuthRefresh &&
      !isAuthLifecycleRequest(requestConfig.url)
    ) {
      try {
        requestConfig._retry = true;
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });

        const accessToken = await refreshPromise;
        requestConfig.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(requestConfig);
      } catch (refreshError) {
        clearSessionSnapshot();
        return Promise.reject(normalizeApiError(refreshError));
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

export const get = async <T>(url: string, config?: RequestOptions): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

export const post = async <T>(
  url: string,
  data: unknown,
  config?: RequestOptions
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

export const put = async <T>(
  url: string,
  data: unknown,
  config?: RequestOptions
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

export const del = async <T>(url: string, config?: RequestOptions): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

export default apiClient;
