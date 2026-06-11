# 13 — Error Handling

> **AI Instruction:** Tidak ada silent error. Tidak ada generic "Something went wrong". Setiap error punya kode unik, pesan yang jelas dalam Bahasa Indonesia, dan HTTP status yang tepat. Error harus berjenjang dari domain ke presentation layer.

---

## 13.1 Error Architecture

```
Domain Layer
  └── DomainException (business rule violations)
       ├── VesselNotFoundException
       ├── DuplicateImoNumberException
       ├── ComplianceBlockException
       └── InvalidCertificateDateException

Application Layer
  └── ApplicationException (use case failures)
       ├── UnauthorizedOperationException
       ├── InsufficientPermissionsException
       └── ResourceConflictException

Infrastructure Layer
  └── InfrastructureException (technical failures)
       ├── DatabaseConnectionException
       ├── FileStorageException
       └── ExternalServiceException

Presentation Layer
  └── HttpException (mapped from above)
       └── GlobalExceptionFilter (maps all → ApiErrorResponse)
```

---

## 13.2 Error Code System

### Format Error Code
```
{DOMAIN}_{RESOURCE}_{ERROR_TYPE}

Contoh:
FLEET_VESSEL_NOT_FOUND
CREW_CERTIFICATE_EXPIRED
VOYAGE_MANNING_INSUFFICIENT
AUTH_TOKEN_EXPIRED
VALIDATION_FIELD_INVALID
```

### HTTP Status Mapping

| HTTP Status | Kapan Digunakan |
|---|---|
| `200` | Success GET/PATCH |
| `201` | Success POST (resource created) |
| `204` | Success DELETE (no content) |
| `400` | Bad Request — data tidak valid |
| `401` | Unauthorized — belum login / token expired |
| `403` | Forbidden — tidak punya permission |
| `404` | Not Found — resource tidak ada |
| `409` | Conflict — duplikat data |
| `422` | Unprocessable Entity — business rule violation |
| `429` | Too Many Requests — rate limit |
| `500` | Internal Server Error — bug tak terduga |
| `503` | Service Unavailable — maintenance / down |

---

## 13.3 Error Code Registry

### Authentication & Authorization (AUTH_*)

| Code | HTTP | Pesan Indonesia |
|---|---|---|
| `AUTH_TOKEN_MISSING` | 401 | Token autentikasi tidak ditemukan |
| `AUTH_TOKEN_INVALID` | 401 | Token autentikasi tidak valid |
| `AUTH_TOKEN_EXPIRED` | 401 | Sesi telah berakhir, silakan login kembali |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh token tidak valid |
| `AUTH_CREDENTIALS_INVALID` | 401 | Email atau password salah |
| `AUTH_ACCOUNT_DISABLED` | 403 | Akun Anda telah dinonaktifkan |
| `AUTH_PERMISSION_DENIED` | 403 | Anda tidak memiliki izin untuk melakukan aksi ini |
| `AUTH_VESSEL_ACCESS_DENIED` | 403 | Anda tidak memiliki akses ke kapal ini |
| `AUTH_COMPANY_ACCESS_DENIED` | 403 | Anda tidak memiliki akses ke perusahaan ini |

### Validation (VALIDATION_*)

| Code | HTTP | Pesan Indonesia |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Data yang dikirim tidak valid |
| `VALIDATION_REQUIRED_FIELD` | 400 | Field {field} wajib diisi |
| `VALIDATION_INVALID_FORMAT` | 400 | Format {field} tidak valid |
| `VALIDATION_INVALID_IMO` | 400 | Nomor IMO harus terdiri dari 7 digit angka |
| `VALIDATION_INVALID_DATE_RANGE` | 400 | Tanggal selesai harus setelah tanggal mulai |
| `VALIDATION_FUTURE_DATE_REQUIRED` | 400 | {field} harus tanggal di masa depan |

### Fleet / Vessel (FLEET_*)

| Code | HTTP | Pesan Indonesia |
|---|---|---|
| `FLEET_VESSEL_NOT_FOUND` | 404 | Kapal tidak ditemukan |
| `FLEET_VESSEL_DUPLICATE_IMO` | 409 | Nomor IMO sudah terdaftar di sistem |
| `FLEET_VESSEL_ALREADY_ACTIVE` | 409 | Kapal sudah dalam status aktif |
| `FLEET_VESSEL_IN_VOYAGE` | 422 | Kapal sedang dalam pelayaran aktif |
| `FLEET_CERT_NOT_FOUND` | 404 | Sertifikat kapal tidak ditemukan |
| `FLEET_CERT_ALREADY_VALID` | 409 | Sertifikat dengan tipe ini sudah ada dan masih valid |

### Crew (CREW_*)

| Code | HTTP | Pesan Indonesia |
|---|---|---|
| `CREW_SEAFARER_NOT_FOUND` | 404 | Data pelaut tidak ditemukan |
| `CREW_ALREADY_ON_BOARD` | 409 | Pelaut sedang berada di atas kapal lain |
| `CREW_CERT_EXPIRED` | 422 | Sertifikat {certType} pelaut telah kadaluarsa |
| `CREW_CERT_MISSING` | 422 | Sertifikat {certType} wajib untuk jabatan {rank} |
| `CREW_SIGN_ON_CERT_INVALID` | 422 | Pelaut tidak dapat naik kapal: ada sertifikat tidak valid |
| `CREW_CONTRACT_OVERLAP` | 409 | Sudah ada kontrak aktif untuk periode ini |
| `CREW_RANK_MISMATCH` | 422 | Jabatan tidak sesuai dengan sertifikat yang dimiliki |

### Voyage (VOYAGE_*)

| Code | HTTP | Pesan Indonesia |
|---|---|---|
| `VOYAGE_NOT_FOUND` | 404 | Data pelayaran tidak ditemukan |
| `VOYAGE_ALREADY_COMPLETED` | 409 | Pelayaran sudah selesai dan tidak dapat diubah |
| `VOYAGE_MANNING_INSUFFICIENT` | 422 | Jumlah kru di bawah minimum safe manning |
| `VOYAGE_VESSEL_NOT_COMPLIANT` | 422 | Kapal tidak dapat berangkat: ada sertifikat tidak valid |
| `VOYAGE_DOC_EXPIRED` | 422 | Perusahaan tidak dapat mengoperasikan kapal: DOC telah kadaluarsa |
| `VOYAGE_SMC_EXPIRED` | 422 | Kapal tidak dapat beroperasi: SMC telah kadaluarsa |
| `VOYAGE_VESSEL_DETAINED` | 422 | Kapal sedang ditahan oleh PSC dan tidak dapat beroperasi |

### Technical / PMS (TECHNICAL_*)

| Code | HTTP | Pesan Indonesia |
|---|---|---|
| `TECHNICAL_JOB_NOT_FOUND` | 404 | Work order tidak ditemukan |
| `TECHNICAL_JOB_ALREADY_COMPLETED` | 409 | Work order sudah selesai |
| `TECHNICAL_DEFECT_NOT_FOUND` | 404 | Data defect tidak ditemukan |
| `TECHNICAL_OVERDUE_APPROVAL_REQUIRED` | 422 | Pekerjaan overdue memerlukan persetujuan superintendent |

### Document (DOCUMENT_*)

| Code | HTTP | Pesan Indonesia |
|---|---|---|
| `DOCUMENT_NOT_FOUND` | 404 | Dokumen tidak ditemukan |
| `DOCUMENT_UPLOAD_FAILED` | 500 | Gagal mengunggah dokumen, silakan coba lagi |
| `DOCUMENT_TYPE_NOT_ALLOWED` | 400 | Tipe file tidak diizinkan. Gunakan: PDF, JPG, PNG |
| `DOCUMENT_SIZE_EXCEEDED` | 400 | Ukuran file melebihi batas maksimal (10 MB) |

### Company / IAM (IAM_*)

| Code | HTTP | Pesan Indonesia |
|---|---|---|
| `IAM_USER_NOT_FOUND` | 404 | Pengguna tidak ditemukan |
| `IAM_USER_EMAIL_EXISTS` | 409 | Email sudah terdaftar |
| `IAM_ROLE_NOT_FOUND` | 404 | Role tidak ditemukan |
| `IAM_CANNOT_DELETE_SYSTEM_ROLE` | 422 | Role sistem tidak dapat dihapus |
| `IAM_COMPANY_NOT_FOUND` | 404 | Perusahaan tidak ditemukan |

### System (SYSTEM_*)

| Code | HTTP | Pesan Indonesia |
|---|---|---|
| `SYSTEM_INTERNAL_ERROR` | 500 | Terjadi kesalahan sistem, silakan hubungi administrator |
| `SYSTEM_DATABASE_ERROR` | 503 | Layanan database tidak tersedia sementara |
| `SYSTEM_RATE_LIMIT_EXCEEDED` | 429 | Terlalu banyak permintaan, silakan coba lagi dalam {retryAfter} detik |
| `SYSTEM_MAINTENANCE` | 503 | Sistem sedang dalam pemeliharaan |

---

## 13.4 Domain Exception Classes

```typescript
// shared/exceptions/base.exception.ts
export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// contexts/fleet/domain/exceptions/vessel-not-found.exception.ts
export class VesselNotFoundException extends DomainException {
  readonly code = "FLEET_VESSEL_NOT_FOUND";
  readonly httpStatus = 404;

  constructor(vesselId: string) {
    super(`Kapal dengan ID ${vesselId} tidak ditemukan`, { vesselId });
  }
}

// contexts/fleet/domain/exceptions/compliance-block.exception.ts
export class ComplianceBlockException extends DomainException {
  readonly code = "VOYAGE_VESSEL_NOT_COMPLIANT";
  readonly httpStatus = 422;

  constructor(public readonly violations: ComplianceViolation[]) {
    super("Kapal tidak dapat beroperasi karena ada pelanggaran compliance", { violations });
  }
}
```

---

## 13.5 Global Exception Filter

```typescript
// shared/filters/global-exception.filter.ts

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log semua 5xx errors
    if (errorResponse.status >= 500) {
      this.logger.error({
        exception,
        requestId: request.headers["x-request-id"],
        path: request.url,
        method: request.method,
        userId: (request as any).user?.userId,
      });
    }

    response.status(errorResponse.status).json({
      success: false,
      error: {
        code: errorResponse.code,
        message: errorResponse.message,
        details: errorResponse.details,
      },
      timestamp: new Date().toISOString(),
      requestId: request.headers["x-request-id"] as string,
    });
  }

  private buildErrorResponse(exception: unknown, request: Request) {
    // Domain exceptions
    if (exception instanceof DomainException) {
      return {
        status: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        details: undefined,
      };
    }

    // NestJS validation pipe errors
    if (exception instanceof BadRequestException) {
      const response = exception.getResponse() as any;
      return {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Data yang dikirim tidak valid",
        details: this.formatValidationErrors(response.message),
      };
    }

    // NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        code: this.mapHttpStatusToCode(exception.getStatus()),
        message: exception.message,
        details: undefined,
      };
    }

    // Unknown errors
    return {
      status: 500,
      code: "SYSTEM_INTERNAL_ERROR",
      message: "Terjadi kesalahan sistem, silakan hubungi administrator",
      details: undefined,
    };
  }

  private formatValidationErrors(messages: string | string[]): ValidationError[] {
    if (typeof messages === "string") {
      return [{ field: "unknown", message: messages }];
    }
    return messages.map(msg => {
      const parts = msg.split("|");
      return { field: parts[0] ?? "unknown", message: parts[1] ?? msg };
    });
  }
}
```

---

## 13.6 Frontend Error Handling

```typescript
// services/api.client.ts

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ApiErrorResponse>) => {
    const errorData = error.response?.data;

    // Handle 401 — token expired
    if (error.response?.status === 401) {
      if (errorData?.error.code === "AUTH_TOKEN_EXPIRED") {
        // Try refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return apiClient.request(error.config!);
        }
        // Redirect to login
        window.location.href = "/login";
        return;
      }
    }

    // Throw structured error untuk di-handle di component
    throw new ApiError(
      errorData?.error.code ?? "SYSTEM_INTERNAL_ERROR",
      errorData?.error.message ?? "Terjadi kesalahan",
      errorData?.error.details,
      error.response?.status
    );
  }
);

// React Query error handling
function useCreateVessel() {
  return useMutation({
    mutationFn: createVessel,
    onError: (error: ApiError) => {
      if (error.code === "FLEET_VESSEL_DUPLICATE_IMO") {
        toast.error("Nomor IMO sudah terdaftar. Gunakan nomor IMO yang berbeda.");
        return;
      }
      if (error.code === "VALIDATION_ERROR" && error.details) {
        // Set form field errors
        error.details.forEach(d => form.setError(d.field, { message: d.message }));
        return;
      }
      // Generic fallback
      toast.error(error.message);
    },
  });
}
```

---

## 13.7 Request ID Tracing

Setiap request harus memiliki unique ID untuk tracing:

```typescript
// shared/middleware/request-id.middleware.ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers["x-request-id"] as string ?? uuid();
    req.headers["x-request-id"] = requestId;
    res.setHeader("X-Request-ID", requestId);
    next();
  }
}
```

---

*Setiap error code baru yang muncul selama development harus didaftarkan di file ini sebelum diimplementasikan.*
