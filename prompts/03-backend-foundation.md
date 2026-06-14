# Prompt 03 — Backend Foundation

**Tahap:** NestJS bootstrap, shared infrastructure, global middleware  
**Prerequisite:** Prompt 02 selesai, database running dengan seed data  
**Output:** NestJS app berjalan dengan semua shared infrastructure siap

> **Status: ⚠️ SEBAGIAN SELESAI**  
> Bootstrap NestJS (`main.ts`, `app.module.ts`), global guard, filter, audit interceptor, decorators, storage service ada. **Yang belum:** `logging.interceptor.ts`, `transform.interceptor.ts`, `parse-uuid.pipe.ts`, `pagination-query.pipe.ts`, `public.decorator.ts`, `api-paginated-response.decorator.ts`, `audit.service.ts`, `notification.service.ts`, `api-response.helper.ts`, `password.util.ts`, `jwt.util.ts`, config module (folder config kosong), health service detail.

---

## PROMPT 03-A — NestJS Bootstrap & Global Setup

> ✅ **SELESAI** — `main.ts` dengan helmet, compression, CORS, ValidationPipe, GlobalExceptionFilter, RequestId interceptor, Swagger, rate limiting, health endpoint, prefix `api/v1` tersedia. `app.module.ts` dengan semua modul ada.

```
Setup NestJS application bootstrap untuk Maritime Fleet ERP.
Baca docs/ai-rules/02-architecture.md untuk arsitektur yang benar.
Baca docs/ai-rules/06-api-design.md section 6.7 untuk Swagger setup.
Baca docs/ai-rules/03-tech-stack.md untuk packages yang boleh digunakan.

File: apps/api/src/main.ts

Implementasikan bootstrap() function dengan:

1. NestFactory.create(AppModule) dengan logger Winston

2. Global Middleware Stack (urutan ini PENTING):
   app.use(helmet())                    ← Security headers
   app.use(compression())               ← Gzip compression
   app.enableCors(corsOptions)          ← CORS config
   app.use(json({ limit: "10mb" }))     ← Body parser limit

3. Global Pipes:
   new ValidationPipe({
     whitelist: true,                   ← Strip unknown properties
     forbidNonWhitelisted: true,        ← Error jika ada unknown property
     transform: true,                   ← Auto-transform types
     transformOptions: { enableImplicitConversion: true }
   })

4. Global Filters:
   GlobalExceptionFilter                ← Dari docs/ai-rules/13-error-handling.md

5. Global Interceptors:
   - RequestIdInterceptor               ← Inject X-Request-ID ke setiap request
   - LoggingInterceptor                 ← Log setiap request/response
   - TransformInterceptor               ← Wrap response dalam ApiResponse<T> format

6. Swagger Setup (docs/ai-rules/06-api-design.md):
   - Title: Maritime Fleet ERP API
   - Version: 1.0
   - Bearer auth
   - Semua tags dari file rules
   - Tersedia di /api/docs (development only)

7. Rate Limiting:
   ThrottlerModule dengan config dari 06-api-design.md section 6.8

8. Health Check endpoint:
   GET /health → { status: "ok", timestamp, uptime, version }

9. API prefix: /api/v1
   app.setGlobalPrefix("api/v1", { exclude: ["health"] })

10. Graceful shutdown:
    app.enableShutdownHooks()
    Listen di PORT dari env (default 4000)

File: apps/api/src/app.module.ts
Imports yang harus ada:
- ConfigModule.forRoot({ isGlobal: true, validationSchema: Joi schema })
- ThrottlerModule
- DatabaseModule (global)
- EventEmitterModule.forRoot()
- ScheduleModule.forRoot()
- WinstonModule (logging)
- CacheModule (Redis)
- Semua context modules (Fleet, Crew, Voyage, dll — bisa empty dulu)

Joi validation schema untuk env vars:
NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, JWT_ACCESS_EXPIRES,
JWT_REFRESH_EXPIRES, REDIS_URL (semua wajib kecuali yang optional)
```

---

## PROMPT 03-B — Shared Infrastructure

> ⚠️ **SEBAGIAN** — Tersedia: `jwt-auth.guard.ts`, `rbac.guard.ts`, `company-isolation.guard.ts`, `audit.interceptor.ts`, `global-exception.filter.ts`, `current-user.decorator.ts`, `permissions.decorator.ts`, `audit.decorator.ts`, `winston.config.ts`, `storage.service.ts`.  
> **Belum ada:** `logging.interceptor.ts`, `transform.interceptor.ts`, `optional-auth.guard.ts`, `parse-uuid.pipe.ts`, `pagination-query.pipe.ts`, `public.decorator.ts`, `api-paginated-response.decorator.ts`, `audit.service.ts`, `notification.service.ts`, `api-response.helper.ts`, `password.util.ts`, `jwt.util.ts`.

```
Buat semua shared infrastructure yang akan digunakan oleh semua modules.
Lokasi: apps/api/src/shared/
Baca docs/ai-rules/02-architecture.md untuk layer boundaries.

BUAT STRUKTUR LENGKAP:

1. shared/database/
   - prisma.service.ts         ← Sudah dibuat di Prompt 02-B
   - database.module.ts        ← Global module, export PrismaService
   - base.repository.ts        ← Sudah dibuat di Prompt 02-D

2. shared/guards/
   - jwt-auth.guard.ts
     Extends AuthGuard("jwt")
     Throw AUTH_TOKEN_MISSING jika tidak ada token
     Throw AUTH_TOKEN_EXPIRED jika token expired
     Throw AUTH_TOKEN_INVALID untuk error lainnya

   - rbac.guard.ts
     Implements CanActivate
     Ambil required permissions dari @Permissions() decorator
     Cek user.permissions array dari JWT
     Untuk vessel-scoped: cek user.vesselIds jika ada vesselId di params
     Throw AUTH_PERMISSION_DENIED jika tidak punya permission

   - optional-auth.guard.ts
     Sama seperti jwt-auth tapi tidak throw jika tidak ada token
     (untuk endpoint semi-public)

3. shared/interceptors/
   - request-id.interceptor.ts
     Generate UUID jika X-Request-ID tidak ada di header
     Set ke request dan response header

   - logging.interceptor.ts
     Log setiap request: method, url, userId, companyId, requestId
     Log setiap response: statusCode, duration, requestId
     Gunakan Winston logger

   - transform.interceptor.ts
     Wrap semua response dalam format ApiResponse<T>:
     { success: true, data: ..., message: "...", timestamp: ..., requestId: ... }
     Ambil message dari response.message jika ada, atau default per method:
     POST → "Data berhasil dibuat"
     PATCH → "Data berhasil diperbarui"
     DELETE → "Data berhasil dihapus"
     GET → "Data berhasil diambil"

   - audit.interceptor.ts
     Baca docs/ai-rules/09-audit-trail.md untuk implementasi lengkap
     Trigger hanya untuk POST, PATCH, PUT, DELETE
     Ambil AuditConfig dari @Audit() decorator
     Simpan ke AuditLog via AuditService setelah response sukses

4. shared/filters/
   - global-exception.filter.ts
     Implementasi lengkap dari docs/ai-rules/13-error-handling.md section 13.5
     Handle: DomainException, BadRequestException, HttpException, Unknown Error
     Format response selalu ApiErrorResponse
     Log 5xx errors ke Winston

5. shared/pipes/
   - parse-uuid.pipe.ts
     Validate dan parse UUID dari params
     Throw VALIDATION_INVALID_FORMAT jika bukan UUID format

   - pagination-query.pipe.ts
     Parse dan validate page, limit, sortBy, sortOrder dari query
     Apply defaults: page=1, limit=20
     Clamp limit: min 1, max 100

6. shared/decorators/
   - current-user.decorator.ts    ← Extract RequestUser dari request
   - permissions.decorator.ts     ← @Permissions("vessel:create")
   - audit.decorator.ts           ← @Audit({ resource: "vessel", captureOld: true })
   - api-paginated-response.decorator.ts ← Composite Swagger decorator
   - public.decorator.ts          ← Mark endpoint sebagai public (skip auth)

7. shared/services/
   - audit.service.ts
     log(data: CreateAuditLogDto): Promise<void>
     getHistory(resource, resourceId, companyId): Promise<AuditLog[]>

   - notification.service.ts (stub dulu — Phase 2)
     sendEmail(): Promise<void>  ← Log ke console untuk sekarang

8. shared/utils/
   - api-response.helper.ts
     ApiResponseHelper.success(data, message, statusCode?)
     ApiResponseHelper.paginated(data, meta, message)
     ApiResponseHelper.created(data, message)

   - password.util.ts
     hashPassword(plain: string): Promise<string>    ← bcrypt, 12 rounds
     verifyPassword(plain, hash): Promise<boolean>

   - jwt.util.ts
     generateAccessToken(payload): string
     generateRefreshToken(): string                  ← crypto.randomUUID()
     verifyToken(token, secret): JwtPayload | null

Setelah selesai, pastikan:
- Semua exports dari shared/index.ts
- DatabaseModule di-import di AppModule sebagai global
- AuditService di-register di SharedModule
```

---

## PROMPT 03-C — Config Module

> ❌ **BELUM SELESAI** — Folder `apps/api/src/config/` kosong. Config classes (`AppConfig`, `DatabaseConfig`, `JwtConfig`, `RedisConfig`, `StorageConfig`, `MailConfig`) belum dibuat.

```
Buat configuration management yang type-safe untuk NestJS.
Baca docs/ai-rules/03-tech-stack.md section 3.8 untuk env vars yang diperlukan.

File: apps/api/src/config/

1. app.config.ts
   @Injectable()
   export class AppConfig {
     get nodeEnv(): string
     get port(): number
     get apiUrl(): string
     get isDevelopment(): boolean
     get isProduction(): boolean
   }

2. database.config.ts
   export class DatabaseConfig {
     get databaseUrl(): string
   }

3. jwt.config.ts
   export class JwtConfig {
     get secret(): string
     get accessTokenExpires(): string   ← "15m"
     get refreshTokenExpires(): string  ← "7d"
   }

4. redis.config.ts
   export class RedisConfig {
     get url(): string
     get host(): string
     get port(): number
   }

5. storage.config.ts
   export class StorageConfig {
     get endpoint(): string
     get port(): number
     get accessKey(): string
     get secretKey(): string
     get bucket(): string
     get publicUrl(): string
   }

6. mail.config.ts
   export class MailConfig {
     get host(): string
     get port(): number
     get user(): string
     get pass(): string
     get from(): string

Semua config class di-register di ConfigurationModule (global)
dan bisa di-inject langsung ke service manapun.

Buat juga: apps/api/src/config/configuration.ts
Factory function yang dipanggil ConfigModule.forRoot():
export default () => ({
  app: { ... },
  database: { ... },
  jwt: { ... },
  redis: { ... },
  storage: { ... },
  mail: { ... },
})
```

---

## PROMPT 03-D — Storage & File Service

> ✅ **SELESAI** — `storage.service.ts` (MinIO) dan `storage.module.ts` ada di `apps/api/src/shared/storage/`.

```
Buat file storage service menggunakan MinIO (S3-compatible).
Baca docs/ai-rules/07-database-schema.md untuk document model.

File: apps/api/src/shared/storage/

1. storage.service.ts
   Inject MinIO client (minio npm package)

   Methods:
   uploadFile(file: Express.Multer.File, folder: string): Promise<UploadResult>
     - Generate unique filename: {folder}/{yyyy-mm}/{uuid}.{ext}
     - Upload ke MinIO bucket
     - Return: { fileUrl, fileName, fileSize, mimeType }

   deleteFile(fileUrl: string): Promise<void>

   getSignedUrl(fileUrl: string, expiresIn?: number): Promise<string>
     - Untuk private documents, generate presigned URL (default 1 jam)

   validateFileType(mimeType: string, allowedTypes: string[]): void
     - Throw DOCUMENT_TYPE_NOT_ALLOWED jika tidak valid

   validateFileSize(size: number, maxSizeMB: number): void
     - Throw DOCUMENT_SIZE_EXCEEDED jika melebihi limit

2. file-upload.interceptor.ts
   Multer interceptor untuk handle multipart/form-data
   Config:
   - Max file size: 10MB
   - Allowed types: PDF, JPG, PNG, DOCX
   - Storage: memory (buffer) — upload ke MinIO dari service

3. storage.module.ts
   Global module, export StorageService

Gunakan di document upload endpoint:
@Post("upload")
@UseInterceptors(FileUploadInterceptor)
async upload(@UploadedFile() file: Express.Multer.File) {
  return this.storageService.uploadFile(file, "documents");
}
```

---

## PROMPT 03-E — Health & Monitoring

> ⚠️ **SEBAGIAN** — `health.controller.ts` di-register di `app.module.ts`, endpoint `GET /health` tersedia. **Belum ada:** `health.service.ts` dengan `checkDatabase()`, `checkRedis()`, `checkStorage()`. Saat ini hanya single endpoint sederhana.

```
Buat health check endpoint yang komprehensif.

File: apps/api/src/health/

1. health.controller.ts
   GET /health → public endpoint (tidak perlu auth)

   Response:
   {
     "status": "ok" | "degraded" | "down",
     "timestamp": "ISO 8601",
     "uptime": 12345,          // seconds
     "version": "1.0.0",
     "environment": "development",
     "services": {
       "database": { "status": "ok", "responseTime": 5 },
       "redis": { "status": "ok", "responseTime": 2 },
       "storage": { "status": "ok" }
     }
   }

2. health.service.ts
   checkDatabase(): Promise<ServiceHealth>
     - Simple query: prisma.$queryRaw`SELECT 1`
     - Catat response time

   checkRedis(): Promise<ServiceHealth>
     - redis.ping()

   checkStorage(): Promise<ServiceHealth>
     - minio.bucketExists(bucketName)

3. Tambahkan ke main.ts:
   - GET /health → HealthController
   - GET /api/v1/health/detailed → sama tapi butuh auth (untuk monitoring tools)

Setelah selesai, test:
curl http://localhost:4000/health
→ harus return status: "ok" dengan semua services healthy
```

---

## Checklist Selesai Prompt 03

```bash
# API berjalan
curl http://localhost:4000/health
# → { "status": "ok", "services": { "database": "ok", "redis": "ok", "storage": "ok" } }

# Swagger tersedia
# Buka http://localhost:4000/api/docs
# → Harus ada UI Swagger dengan semua tags

# Global middleware berfungsi
curl -X POST http://localhost:4000/api/v1/vessels
# → 401 Unauthorized (JWT guard aktif)
# → Response punya X-Request-ID header

# Validation berfungsi
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'
# → 400 dengan VALIDATION_ERROR code

# Winston logging
# Lihat console output — harus ada structured logs setiap request
```

**Jangan lanjut ke Prompt 04 sebelum health check 100% green.**
