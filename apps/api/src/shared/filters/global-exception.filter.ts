import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { type Request, type Response } from "express";

import { DomainException } from "../exceptions/base.exception";

interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers["x-request-id"] as string) || "unknown";

    const errorResponse = this.buildErrorResponse(exception);

    // Log all 5xx errors
    if (errorResponse.status >= 500) {
      this.logger.error(
        {
          exception:
            exception instanceof Error
              ? { message: exception.message, stack: exception.stack }
              : exception,
          requestId,
          path: request.url,
          method: request.method,
          userId: (request as Request & { user?: { userId: string } }).user?.userId,
        },
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(errorResponse.status).json({
      success: false,
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
        details: errorResponse.details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  private buildErrorResponse(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: ValidationErrorItem[];
  } {
    // Domain exceptions (business rule violations)
    if (exception instanceof DomainException) {
      return {
        status: exception.httpStatus,
        code: exception.code,
        message: exception.message,
      };
    }

    // NestJS validation pipe errors
    if (exception instanceof BadRequestException) {
      const response = exception.getResponse() as string | { message?: string | string[] };
      const message =
        typeof response === "object" && response !== null && response.message
          ? response.message
          : (response as string);
      return {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Data yang dikirim tidak valid",
        details: this.formatValidationErrors(message),
      };
    }

    // NestJS HTTP exceptions (401, 403, 404, etc.)
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        code: this.mapHttpStatusToCode(exception.getStatus()),
        message: exception.message,
      };
    }

    // Unknown errors (500)
    return {
      status: 500,
      code: "SYSTEM_INTERNAL_ERROR",
      message: "Terjadi kesalahan sistem, silakan hubungi administrator",
    };
  }

  private formatValidationErrors(messages: string | string[]): ValidationErrorItem[] {
    if (typeof messages === "string") {
      return [{ field: "unknown", message: messages }];
    }
    return messages.map((msg) => {
      // Class-validator format: "field|message" or just "message"
      const parts = msg.split("|");
      return {
        field: parts[0] ?? "unknown",
        message: parts[1] ?? msg,
      };
    });
  }

  private mapHttpStatusToCode(status: number): string {
    const map: Record<number, string> = {
      400: "VALIDATION_ERROR",
      401: "AUTH_TOKEN_MISSING",
      403: "AUTH_PERMISSION_DENIED",
      404: "SYSTEM_NOT_FOUND",
      409: "SYSTEM_CONFLICT",
      422: "SYSTEM_UNPROCESSABLE",
      429: "SYSTEM_RATE_LIMIT_EXCEEDED",
      500: "SYSTEM_INTERNAL_ERROR",
      503: "SYSTEM_MAINTENANCE",
    };
    return map[status] ?? "SYSTEM_INTERNAL_ERROR";
  }
}
