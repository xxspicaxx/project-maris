# 06 — API Design

> **AI Instruction:** API-First berarti API contract didefinisikan sebelum implementasi. Semua endpoint wajib memiliki Swagger documentation. Ikuti format response standar tanpa pengecualian.

---

## 6.1 API Versioning & Base URL

```
Base URL  : https://api.maritime-erp.com
Version   : /api/v1
Full path : https://api.maritime-erp.com/api/v1/{resource}
```

**Versioning Strategy:** URL-based versioning (`/v1`, `/v2`)

- Jangan ganti versi minor yang breaking — buat endpoint v2 baru
- v1 harus tetap berjalan minimal 12 bulan setelah v2 rilis

---

## 6.2 REST Conventions

### URL Patterns

```
# Resource collections (plural)
GET    /api/v1/vessels                    ← List semua kapal
POST   /api/v1/vessels                    ← Buat kapal baru

# Single resource
GET    /api/v1/vessels/:vesselId          ← Detail kapal
PATCH  /api/v1/vessels/:vesselId          ← Update sebagian
DELETE /api/v1/vessels/:vesselId          ← Soft delete

# Nested resources
GET    /api/v1/vessels/:vesselId/crew     ← Kru di kapal tertentu
POST   /api/v1/vessels/:vesselId/crew     ← Assign kru ke kapal

# Actions (non-CRUD — gunakan verb)
POST   /api/v1/vessels/:vesselId/activate
POST   /api/v1/vessels/:vesselId/deactivate
POST   /api/v1/voyages/:voyageId/complete
POST   /api/v1/crew/:crewId/sign-on
POST   /api/v1/crew/:crewId/sign-off
```

### HTTP Methods

| Method   | Kegunaan                      | Body | Idempotent |
| -------- | ----------------------------- | ---- | ---------- |
| `GET`    | Read only                     | ❌   | ✅         |
| `POST`   | Create / trigger action       | ✅   | ❌         |
| `PATCH`  | Partial update                | ✅   | ✅         |
| `PUT`    | Full replace (jarang dipakai) | ✅   | ✅         |
| `DELETE` | Soft delete                   | ❌   | ✅         |

**Gunakan `PATCH` bukan `PUT`** untuk update — lebih aman untuk partial updates.

---

## 6.3 Standard Response Format

**Semua response API wajib menggunakan format ini:**

### Success Response

```typescript
// Interface
interface ApiResponse<T> {
  success: true;
  data: T;
  message: string;
  meta?: PaginationMeta;
  timestamp: string; // ISO 8601
  requestId: string; // UUID untuk tracing
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

```json
// Contoh: List vessels
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "imoNumber": "9123456",
      "name": "MV Nusantara Jaya",
      "flagState": "ID",
      "status": "ACTIVE",
      "grossTonnage": 12500.5
    }
  ],
  "message": "Berhasil mengambil data armada",
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-15T08:30:00.000Z",
  "requestId": "req_7f3d2a1b-4c5e"
}
```

```json
// Contoh: Single resource
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "imoNumber": "9123456",
    "name": "MV Nusantara Jaya"
  },
  "message": "Berhasil mengambil detail kapal",
  "timestamp": "2024-01-15T08:30:00.000Z",
  "requestId": "req_7f3d2a1b-4c5e"
}
```

### Error Response

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string; // Error code (lihat 13-error-handling.md)
    message: string; // Human-readable message (Bahasa Indonesia)
    details?: ValidationError[];
  };
  timestamp: string;
  requestId: string;
}

interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}
```

```json
// Contoh: Validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data yang dikirim tidak valid",
    "details": [
      {
        "field": "imoNumber",
        "message": "Nomor IMO harus terdiri dari 7 digit angka",
        "value": "123"
      },
      {
        "field": "grossTonnage",
        "message": "Gross tonnage harus berupa angka positif"
      }
    ]
  },
  "timestamp": "2024-01-15T08:30:00.000Z",
  "requestId": "req_7f3d2a1b-4c5e"
}
```

---

## 6.4 Query Parameters Standard

### Pagination

```
GET /api/v1/vessels?page=1&limit=20
```

### Sorting

```
GET /api/v1/vessels?sortBy=name&sortOrder=asc
GET /api/v1/vessels?sortBy=createdAt&sortOrder=desc
```

### Filtering

```
GET /api/v1/vessels?status=ACTIVE
GET /api/v1/vessels?flagState=ID&status=ACTIVE
GET /api/v1/crew?certStatus=EXPIRING_SOON
```

### Search

```
GET /api/v1/vessels?search=nusantara
GET /api/v1/crew?search=john&searchFields=name,seamanBook
```

### Date Range

```
GET /api/v1/voyages?startDate=2024-01-01&endDate=2024-12-31
```

### Include Relations

```
GET /api/v1/vessels/:id?include=crew,documents,certificates
```

---

## 6.5 NestJS Controller Template

```typescript
// fleet/presentation/controllers/vessel.controller.ts

@ApiTags("Fleet — Vessels")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("vessels")
export class VesselController {
  constructor(
    private readonly registerVesselHandler: RegisterVesselHandler,
    private readonly listVesselsHandler: ListVesselsHandler,
    private readonly getVesselHandler: GetVesselHandler,
  ) {}

  @Post()
  @Permissions("vessel:create")
  @ApiOperation({ summary: "Registrasi kapal baru" })
  @ApiResponse({ status: 201, description: "Kapal berhasil diregistrasi", type: VesselResponseDto })
  @ApiResponse({ status: 400, description: "Data tidak valid" })
  @ApiResponse({ status: 409, description: "IMO Number sudah terdaftar" })
  async create(
    @Body() dto: CreateVesselDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<VesselResponseDto>> {
    const vessel = await this.registerVesselHandler.execute(
      new RegisterVesselCommand(dto, user.companyId, user.id),
    );
    return ApiResponseHelper.success(vessel, "Kapal berhasil diregistrasi", 201);
  }

  @Get()
  @Permissions("vessel:read")
  @ApiOperation({ summary: "Daftar semua kapal dalam perusahaan" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, enum: VesselStatus })
  @ApiQuery({ name: "search", required: false, type: String })
  async findAll(
    @Query() query: ListVesselsQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<VesselResponseDto[]>> {
    const result = await this.listVesselsHandler.execute(
      new ListVesselsQuery(query, user.companyId),
    );
    return ApiResponseHelper.paginated(result.data, result.meta, "Berhasil mengambil data armada");
  }

  @Get(":vesselId")
  @Permissions("vessel:read")
  @ApiOperation({ summary: "Detail kapal berdasarkan ID" })
  @ApiParam({ name: "vesselId", type: String, format: "uuid" })
  async findOne(
    @Param("vesselId", ParseUUIDPipe) vesselId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ApiResponse<VesselResponseDto>> {
    const vessel = await this.getVesselHandler.execute(
      new GetVesselQuery(vesselId, user.companyId),
    );
    return ApiResponseHelper.success(vessel, "Berhasil mengambil detail kapal");
  }
}
```

---

## 6.6 DTO Design

```typescript
// create-vessel.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsEnum, IsOptional, Matches, Min } from "class-validator";
import { VesselType, VesselStatus } from "@shared/enums";

export class CreateVesselDto {
  @ApiProperty({
    description: "Nomor IMO kapal (7 digit)",
    example: "9123456",
    pattern: "^[0-9]{7}$",
  })
  @IsString()
  @Matches(/^[0-9]{7}$/, { message: "Nomor IMO harus terdiri dari 7 digit angka" })
  imoNumber: string;

  @ApiProperty({ description: "Nama kapal", example: "MV Nusantara Jaya" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Kode flag state (ISO 3166-1 alpha-2)", example: "ID" })
  @IsString()
  flagState: string;

  @ApiProperty({ enum: VesselType })
  @IsEnum(VesselType)
  vesselType: VesselType;

  @ApiProperty({ description: "Gross Tonnage", example: 12500.5 })
  @IsNumber()
  @Min(0)
  grossTonnage: number;

  @ApiPropertyOptional({ description: "Net Tonnage" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  netTonnage?: number;

  @ApiPropertyOptional({ description: "Tahun pembangunan", example: 2015 })
  @IsOptional()
  @IsNumber()
  yearBuilt?: number;
}
```

---

## 6.7 Swagger Setup (main.ts)

```typescript
// apps/api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger
  const config = new DocumentBuilder()
    .setTitle("Maritime Fleet ERP API")
    .setDescription("Enterprise API untuk manajemen armada kapal")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Auth", "Authentication & authorization")
    .addTag("Fleet — Vessels", "Manajemen armada kapal")
    .addTag("Crew", "Manajemen SDM pelaut")
    .addTag("Voyage", "Manajemen pelayaran")
    .addTag("Documents", "Manajemen dokumen & sertifikat")
    .addTag("Technical — PMS", "Planned Maintenance System")
    .addTag("HSSEQ", "Safety, security & environment")
    .addTag("Company Admin", "Administrasi perusahaan")
    .addTag("System Admin", "Administrasi sistem")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(4000);
}
```

Swagger tersedia di: `http://localhost:4000/api/docs`

---

## 6.8 Rate Limiting

```typescript
// Konfigurasi per endpoint category
const rateLimitConfig = {
  auth: { ttl: 60, limit: 5 }, // Login: 5x per menit
  read: { ttl: 60, limit: 200 }, // GET: 200x per menit
  write: { ttl: 60, limit: 50 }, // POST/PATCH: 50x per menit
  reports: { ttl: 60, limit: 10 }, // Report generation: 10x per menit
  fileUpload: { ttl: 60, limit: 20 }, // Upload: 20x per menit
};
```

---

## 6.9 Webhook Events (Future — Phase 5)

Format webhook untuk integrasi eksternal (AIS, BKI, dll):

```json
{
  "event": "certificate.expiring",
  "version": "1.0",
  "timestamp": "2024-01-15T08:30:00.000Z",
  "data": {
    "certificateId": "...",
    "vesselId": "...",
    "expiryDate": "2024-03-15",
    "daysRemaining": 59
  }
}
```

---

_Swagger doc wajib diupdate bersamaan dengan setiap perubahan endpoint. Tidak ada endpoint undocumented._
