import { type PaginationMeta } from "./pagination.types";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: {
    field: string;
    message: string;
  }[];
}

export type ApiError = ApiErrorResponse;
