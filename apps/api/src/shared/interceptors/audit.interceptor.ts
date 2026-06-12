import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from "@nestjs/common";
import { type Reflector } from "@nestjs/core";
import { AuditAction, type Prisma } from "@prisma/client";
import { type Request } from "express";
import { type Observable, tap } from "rxjs";
import { type PrismaService } from "../database/prisma.service";
import { AUDIT_KEY, type AuditConfig } from "../decorators/audit.decorator";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: { companyId: string; userId: string } }).user;

    // Skip for GET requests or if no user
    if (request.method === "GET" || !user) {
      return next.handle();
    }

    const auditConfig = this.reflector.get<AuditConfig>(AUDIT_KEY, context.getHandler());

    // Only audit endpoints with @Audit() decorator
    if (!auditConfig) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (response: unknown) => {
          try {
            const resourceId = this.extractResourceId(request, response);
            if (!resourceId) {
              return;
            }

            const responseObj = response as { data?: unknown } | null | undefined;
            const newValues = responseObj?.data ? this.sanitize(responseObj.data) : undefined;
            const customReq = request as Request & { _oldValues?: unknown };
            const oldValues = auditConfig.captureOld ? customReq._oldValues : undefined;

            await this.prisma.auditLog.create({
              data: {
                companyId: user.companyId,
                userId: user.userId,
                action: this.mapMethodToAction(request.method),
                resource: auditConfig.resource,
                resourceId,
                oldValues: oldValues ? (oldValues as Prisma.InputJsonValue) : undefined,
                newValues: newValues ? (newValues as Prisma.InputJsonValue) : undefined,
                ipAddress: request.ip,
                userAgent: request.headers["user-agent"] as string,
                requestId: request.headers["x-request-id"] as string,
              },
            });
          } catch (error) {
            this.logger.warn("Failed to create audit log:", error);
          }
        },
        error: () => {
          // Do not audit failed requests
        },
      }),
    );
  }

  private mapMethodToAction(method: string): AuditAction {
    const map: Record<string, AuditAction> = {
      POST: AuditAction.CREATE,
      PATCH: AuditAction.UPDATE,
      PUT: AuditAction.UPDATE,
      DELETE: AuditAction.DELETE,
    };
    return map[method] ?? AuditAction.UPDATE;
  }

  private extractResourceId(request: Request, response: unknown): string | undefined {
    // First try from URL params
    const params = request.params || {};
    const paramId =
      params.vesselId ||
      params.seafarerId ||
      params.voyageId ||
      params.companyId ||
      params.userId ||
      params.certificateId ||
      params.documentId ||
      params.id;

    if (paramId) {
      return paramId;
    }

    // Then try from response data
    const responseObj = response as
      | { data?: { id?: string; vesselId?: string } }
      | null
      | undefined;
    if (responseObj?.data?.id) {
      return responseObj.data.id;
    }
    if (responseObj?.data?.vesselId) {
      return responseObj.data.vesselId;
    }

    return undefined;
  }

  private sanitize(data: unknown): unknown {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sanitized = { ...(data as Record<string, unknown>) };
    const sensitiveFields = [
      "passwordHash",
      "password",
      "bankAccount",
      "token",
      "accessToken",
      "refreshToken",
    ];

    for (const field of sensitiveFields) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete sanitized[field];
    }

    return sanitized;
  }
}
