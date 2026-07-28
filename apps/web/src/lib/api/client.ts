import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from "axios";
import type { ApiErrorDetail } from "@eventure/shared";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ApiErrorDetail[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      success: false,
      message: error.message || "Network Error or Server Unreachable",
      errors: [],
    } satisfies ApiErrorResponse);
  },
);

export async function fetchApi<T>(
  endpoint: string,
  options?: Parameters<typeof apiClient.request>[0],
): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>({
    url: endpoint,
    ...options,
  });
  return response.data.data;
}
