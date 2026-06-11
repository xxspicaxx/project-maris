import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuditAction } from "@prisma/client";
import { Observable, tap } from "rxjs";
import { PrismaService } from "../database/prisma.service";
import { AUDIT_KEY, AuditConfig } from "../decorators/audit.decorator";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

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
        next: async (response: any) => {
          try {
            const resourceId = this.extractResourceId(request, response);
            if (!resourceId) return;

            const newValues = response?.data ? this.sanitize(response.data) : undefined;
            const oldValues = auditConfig.captureOld ? request["_oldValues"] : undefined;

            await this.prisma.auditLog.create({
              data: {
                companyId: user.companyId,
                userId: user.userId,
                action: this.mapMethodToAction(request.method),
                resource: auditConfig.resource,
                resourceId,
                oldValues: oldValues ? (oldValues as any) : undefined,
                newValues: newValues ? (newValues as any) : undefined,
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

  private extractResourceId(request: any, response: any): string | undefined {
    // First try from URL params
    const paramId =
      request.params?.vesselId ||
      request.params?.seafarerId ||
      request.params?.voyageId ||
      request.params?.companyId ||
      request.params?.userId ||
      request.params?.certificateId ||
      request.params?.documentId ||
      request.params?.id;

    if (paramId) return paramId;

    // Then try from response data
    if (response?.data?.id) return response.data.id;
    if (response?.data?.vesselId) return response.data.vesselId;

    return undefined;
  }

  private sanitize(data: unknown): unknown {
    if (!data || typeof data !== "object") return data;

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
      delete sanitized[field];
    }

    return sanitized;
  }
}
