import { Request } from "express";
import { v4 as uuid } from "uuid";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  message: string;
  meta?: PaginationMeta;
  timestamp: string;
  requestId: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationErrorItem[];
  };
  timestamp: string;
  requestId: string;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

export class ApiResponseHelper {
  static success<T>(
    data: T,
    message: string,
    request?: Request,
    statusCode?: number,
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.getRequestId(request),
    };
  }

  static paginated<T>(
    data: T[],
    meta: PaginationMeta,
    message: string,
    request?: Request,
  ): ApiResponse<T[]> {
    return {
      success: true,
      data,
      message,
      meta,
      timestamp: new Date().toISOString(),
      requestId: this.getRequestId(request),
    };
  }

  static created<T>(data: T, message: string, request?: Request): ApiResponse<T> {
    return this.success(data, message, request, 201);
  }

  static error(
    code: string,
    message: string,
    request?: Request,
    details?: ValidationErrorItem[],
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      requestId: this.getRequestId(request),
    };
  }

  static paginationMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  private static getRequestId(request?: Request): string {
    return (request?.headers?.["x-request-id"] as string) || uuid();
  }
}
