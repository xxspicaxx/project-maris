# 09 — Audit Trail

> **AI Instruction:** Audit trail adalah requirement enterprise non-negosiable. Setiap perubahan data utama harus tercatat. Implementasikan via NestJS Interceptor — jangan manual di setiap service.

---

## 9.1 Prinsip Audit Trail

**Apa yang harus di-audit:**
- Semua operasi CREATE, UPDATE, DELETE pada data utama
- Login / Logout (berhasil maupun gagal)
- Export data
- Perubahan permission / role
- Approval / rejection workflow
- Upload / delete dokumen

**Apa yang TIDAK perlu di-audit:**
- GET requests (read-only)
- Health check endpoints
- Pagination / filter queries

---

## 9.2 Audit Interceptor (Global)

```typescript
// shared/interceptors/audit.interceptor.ts

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user: RequestUser = request.user;

    // Ambil metadata dari controller
    const auditConfig = this.reflector.get<AuditConfig>(
      AUDIT_KEY,
      context.getHandler()
    );

    if (!auditConfig || request.method === "GET") {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.auditService.log({
          companyId: user?.companyId,
          userId: user?.userId,
          action: this.mapMethodToAction(request.method),
          resource: auditConfig.resource,
          resourceId: this.extractResourceId(request, response),
          oldValues: auditConfig.captureOld ? request["_oldValues"] : undefined,
          newValues: this.sanitize(response?.data),
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"],
          requestId: request.headers["x-request-id"] as string,
        });
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

  private sanitize(data: unknown): unknown {
    // Hapus field sensitif dari audit log
    const sensitiveFields = ["passwordHash", "bankAccount", "token"];
    return this.removeSensitiveFields(data, sensitiveFields);
  }
}
```

---

## 9.3 Audit Decorator

```typescript
// shared/decorators/audit.decorator.ts

export interface AuditConfig {
  resource: string;    // Nama resource ("vessel", "seafarer", "certificate")
  captureOld?: boolean; // Apakah capture state sebelum update
}

export const AUDIT_KEY = "audit";
export const Audit = (config: AuditConfig) =>
  SetMetadata(AUDIT_KEY, config);

// Penggunaan di controller
@Patch(":vesselId")
@Permissions("vessel:update")
@Audit({ resource: "vessel", captureOld: true })
async updateVessel(
  @Param("vesselId") vesselId: string,
  @Body() dto: UpdateVesselDto,
  @CurrentUser() user: RequestUser,
) { ... }
```

---

## 9.4 Capture "Old Values" untuk Update

Untuk endpoint UPDATE, kita perlu capture state sebelum perubahan:

```typescript
// shared/middleware/capture-old-values.middleware.ts

@Injectable()
export class CaptureOldValuesMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.method !== "PATCH" && req.method !== "PUT") {
      return next();
    }

    // Extract resource type dan ID dari URL
    const resourceId = req.params.id || req.params.vesselId ||
                       req.params.seafarerId || req.params.voyageId;

    if (resourceId) {
      req["_oldValues"] = await this.fetchCurrentState(req.path, resourceId);
    }

    next();
  }
}
```

---

## 9.5 Audit Service

```typescript
// shared/services/audit.service.ts

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: CreateAuditLogDto): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        oldValues: data.oldValues as Prisma.JsonObject,
        newValues: data.newValues as Prisma.JsonObject,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestId: data.requestId,
      },
    });
  }

  async getHistory(
    resource: string,
    resourceId: string,
    companyId: string
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { resource, resourceId, companyId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
```

---

## 9.6 Login / Auth Audit

```typescript
// Audit login events (berhasil dan gagal)

async function auditLoginAttempt(
  email: string,
  success: boolean,
  ipAddress: string,
  reason?: string
): Promise<void> {
  await this.auditService.log({
    userId: success ? userId : undefined,
    action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
    resource: "auth",
    resourceId: email,
    newValues: { success, reason, timestamp: new Date().toISOString() },
    ipAddress,
  });
}
```

---

## 9.7 Audit API Endpoints

```typescript
// Endpoint untuk melihat audit history suatu resource
GET /api/v1/audit/vessel/:vesselId
GET /api/v1/audit/seafarer/:seafarerId
GET /api/v1/audit/voyage/:voyageId

// Query params
?from=2024-01-01&to=2024-12-31
?action=UPDATE
?userId=xxx

// Response
{
  "data": [
    {
      "id": "...",
      "action": "UPDATE",
      "resource": "vessel",
      "resourceId": "...",
      "oldValues": { "status": "ACTIVE" },
      "newValues": { "status": "DRYDOCK" },
      "changedBy": {
        "id": "...",
        "name": "John Doe",
        "email": "john@company.com"
      },
      "ipAddress": "192.168.1.1",
      "createdAt": "2024-01-15T08:30:00Z"
    }
  ]
}
```

---

## 9.8 Retention & Archiving

| Jenis Log | Retensi | Archiving |
|---|---|---|
| Audit log biasa | 2 tahun | Cold storage setelah 1 tahun |
| Login/auth log | 1 tahun | Cold storage setelah 6 bulan |
| Certificate changes | 5 tahun | Tidak diarchive (compliance) |
| Financial records | 7 tahun | Cold storage setelah 3 tahun |

---

## 9.9 Resource yang Wajib Di-audit

| Resource | CREATE | UPDATE | DELETE | Notes |
|---|---|---|---|---|
| `vessel` | ✅ | ✅ | ✅ | Termasuk status change |
| `seafarer` | ✅ | ✅ | ✅ | |
| `crew_assignment` | ✅ | ✅ | ✅ | Sign-on/off |
| `vessel_certificate` | ✅ | ✅ | ✅ | Compliance critical |
| `seafarer_certificate` | ✅ | ✅ | ✅ | Compliance critical |
| `voyage` | ✅ | ✅ | ✅ | |
| `document` | ✅ | — | ✅ | Upload & delete |
| `user` | ✅ | ✅ | ✅ | Termasuk role change |
| `incident` | ✅ | ✅ | — | ISM requirement |
| `work_order` | ✅ | ✅ | ✅ | Status changes |

---

*Audit log adalah immutable — tidak ada endpoint untuk edit atau delete audit log.*
