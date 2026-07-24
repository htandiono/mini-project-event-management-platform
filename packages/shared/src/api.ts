export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: ApiErrorDetail[];
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
