# 08 — Auth & RBAC

> **AI Instruction:** Setiap endpoint wajib dilindungi. RBAC maritim sangat spesifik — Master kapal tidak sama dengan Fleet Manager. Implementasikan permission matrix ini secara ketat.

---

## 8.1 Authentication Flow

### Login Flow

```
1. POST /api/v1/auth/login  { email, password }
2. Server: validate credentials → bcrypt compare
3. Server: generate accessToken (15m) + refreshToken (7d)
4. Client: simpan accessToken di memory, refreshToken di httpOnly cookie
5. Client: sertakan accessToken di header: Authorization: Bearer {token}
6. Server: validate token di setiap request via JwtAuthGuard
```

### Token Refresh Flow

```
1. AccessToken expired → client terima 401
2. POST /api/v1/auth/refresh  (refreshToken dari cookie)
3. Server: validate refreshToken → generate accessToken baru
4. Client: gunakan accessToken baru
```

### JWT Payload

```typescript
interface JwtPayload {
  sub: string; // userId
  email: string;
  companyId: string; // Tenant identifier
  roles: string[]; // Role names
  iat: number;
  exp: number;
}
```

---

## 8.2 System Roles

### Hierarki Role

```
SUPER_ADMIN          ← Anthropic/Vendor level (lintas company)
│
├── COMPANY_ADMIN    ← Admin perusahaan pelayaran
│   ├── FLEET_MANAGER        ← Manajer armada
│   ├── CREWING_MANAGER      ← Manajer kru/crewing
│   ├── TECHNICAL_SUPER      ← Technical Superintendent
│   ├── ISM_MANAGER          ← Safety / ISM Manager
│   ├── FINANCE_MANAGER      ← Manajer keuangan
│   └── PROCUREMENT_OFFICER  ← Purchasing
│
└── VESSEL_ROLES     ← Scoped ke kapal tertentu
    ├── MASTER               ← Nakhoda
    ├── CHIEF_OFFICER        ← Mualim I
    ├── CHIEF_ENGINEER       ← KKM
    ├── RADIO_OFFICER        ← Perwira Radio
    └── PORT_AGENT           ← Agen pelabuhan (external, read-only)
```

---

## 8.3 Permission Matrix

Format: `resource:action` | ✅ = allowed | ❌ = denied | 🔒 = own data only | 🚢 = vessel-scoped

### Fleet Management

| Permission                  | Super Admin | Company Admin | Fleet Manager | Master | Chief Officer | Technical Super | Port Agent |
| --------------------------- | ----------- | ------------- | ------------- | ------ | ------------- | --------------- | ---------- |
| `vessel:create`             | ✅          | ✅            | ✅            | ❌     | ❌            | ❌              | ❌         |
| `vessel:read`               | ✅          | ✅            | ✅            | 🚢     | 🚢            | ✅              | 🚢         |
| `vessel:update`             | ✅          | ✅            | ✅            | ❌     | ❌            | ✅              | ❌         |
| `vessel:delete`             | ✅          | ✅            | ❌            | ❌     | ❌            | ❌              | ❌         |
| `vessel:certificate:manage` | ✅          | ✅            | ✅            | ❌     | ❌            | ✅              | ❌         |

### Crew Management

| Permission                | Super Admin | Company Admin | Fleet Manager | Crewing Manager | Master | Chief Officer | Port Agent |
| ------------------------- | ----------- | ------------- | ------------- | --------------- | ------ | ------------- | ---------- |
| `crew:create`             | ✅          | ✅            | ❌            | ✅              | ❌     | ❌            | ❌         |
| `crew:read`               | ✅          | ✅            | ✅            | ✅              | 🚢     | 🚢            | ❌         |
| `crew:update`             | ✅          | ✅            | ❌            | ✅              | ❌     | ❌            | ❌         |
| `crew:sign_on`            | ✅          | ✅            | ❌            | ✅              | ❌     | ❌            | ❌         |
| `crew:sign_off`           | ✅          | ✅            | ❌            | ✅              | ✅     | ❌            | ❌         |
| `crew:certificate:manage` | ✅          | ✅            | ❌            | ✅              | ❌     | ❌            | ❌         |

### Voyage Management

| Permission          | Super Admin | Company Admin | Fleet Manager | Master | Chief Officer | Port Agent |
| ------------------- | ----------- | ------------- | ------------- | ------ | ------------- | ---------- |
| `voyage:create`     | ✅          | ✅            | ✅            | ❌     | ❌            | ❌         |
| `voyage:read`       | ✅          | ✅            | ✅            | 🚢     | 🚢            | 🚢         |
| `voyage:update`     | ✅          | ✅            | ✅            | 🚢     | ❌            | ❌         |
| `voyage:log:create` | ✅          | ✅            | ❌            | 🚢     | 🚢            | ❌         |
| `voyage:complete`   | ✅          | ✅            | ✅            | ❌     | ❌            | ❌         |

### Technical / PMS

| Permission               | Super Admin | Company Admin | Technical Super | Chief Engineer | Master |
| ------------------------ | ----------- | ------------- | --------------- | -------------- | ------ |
| `pms:create`             | ✅          | ✅            | ✅              | ❌             | ❌     |
| `pms:read`               | ✅          | ✅            | ✅              | 🚢             | 🚢     |
| `pms:workorder:create`   | ✅          | ✅            | ✅              | 🚢             | ❌     |
| `pms:workorder:complete` | ✅          | ✅            | ✅              | 🚢             | ❌     |
| `pms:defect:report`      | ✅          | ✅            | ✅              | 🚢             | 🚢     |

### Documents

| Permission        | Super Admin | Company Admin | Fleet Manager | Master | Chief Officer | Port Agent |
| ----------------- | ----------- | ------------- | ------------- | ------ | ------------- | ---------- |
| `document:upload` | ✅          | ✅            | ✅            | 🚢     | 🚢            | ❌         |
| `document:read`   | ✅          | ✅            | ✅            | 🚢     | 🚢            | 🚢         |
| `document:delete` | ✅          | ✅            | ✅            | ❌     | ❌            | ❌         |

### HSSEQ

| Permission                   | Super Admin | Company Admin | ISM Manager | Master | Chief Officer | All Crew |
| ---------------------------- | ----------- | ------------- | ----------- | ------ | ------------- | -------- |
| `hsseq:incident:report`      | ✅          | ✅            | ✅          | 🚢     | 🚢            | 🚢       |
| `hsseq:incident:investigate` | ✅          | ✅            | ✅          | ❌     | ❌            | ❌       |
| `hsseq:audit:conduct`        | ✅          | ✅            | ✅          | ❌     | ❌            | ❌       |
| `hsseq:drill:record`         | ✅          | ✅            | ✅          | 🚢     | 🚢            | ❌       |

### Administration

| Permission       | Super Admin | Company Admin    |
| ---------------- | ----------- | ---------------- |
| `user:manage`    | ✅          | ✅ (own company) |
| `role:manage`    | ✅          | ❌               |
| `company:manage` | ✅          | 🔒               |
| `system:config`  | ✅          | ❌               |

---

## 8.4 NestJS Implementation

### Guards

```typescript
// shared/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

// shared/guards/rbac.guard.ts
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) return true; // Public endpoint

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    // Check each required permission
    return this.permissionService.hasAllPermissions(
      user.userId,
      user.companyId,
      requiredPermissions,
      request.params?.vesselId, // Untuk vessel-scoped permissions
    );
  }
}
```

### Decorators

```typescript
// shared/decorators/permissions.decorator.ts
export const PERMISSIONS_KEY = "permissions";
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// shared/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user[data] : request.user;
  },
);

// Penggunaan di controller
@Post()
@Permissions("vessel:create")
@UseGuards(JwtAuthGuard, RbacGuard)
async createVessel(
  @Body() dto: CreateVesselDto,
  @CurrentUser() user: RequestUser,
) { ... }
```

### RequestUser Interface

```typescript
// shared/types/request-user.type.ts
export interface RequestUser {
  userId: string;
  email: string;
  companyId: string;
  roles: string[];
  permissions: string[];
  vesselIds?: string[]; // Vessel yang bisa diakses (untuk vessel-scoped role)
  isSuperAdmin: boolean;
}
```

---

## 8.5 Password Policy

```typescript
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // Hari — wajib ganti setelah 90 hari
  historyCount: 5, // Tidak boleh pakai 5 password terakhir
};

// Regex validasi
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
```

---

## 8.6 Session Management

```typescript
// Refresh token disimpan di database untuk revocation
model RefreshToken {
  id          String    @id @default(uuid())
  userId      String
  token       String    @unique   // Hashed
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  revokedAt   DateTime?
  ipAddress   String?
  userAgent   String?

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("refresh_tokens")
}
```

**Token revocation triggers:**

- User logout
- Password changed
- Role changed
- Account suspended
- Manual revocation oleh admin

---

## 8.7 Vessel-Scoped Access Control

Master dan officer hanya bisa mengakses data kapal yang sedang mereka awaki:

```typescript
// Middleware untuk inject vessel context
@Injectable()
export class VesselContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const user: RequestUser = req.user;

    if (!user.isSuperAdmin && !user.roles.includes("FLEET_MANAGER")) {
      // Get vessels currently assigned to this user
      const activeAssignments = await this.crewService.getActiveVessels(user.userId);
      req.user.vesselIds = activeAssignments.map(a => a.vesselId);
    }

    next();
  }
}

// Di repository — selalu filter vessel access
async findVoyagesByVessel(vesselId: string, user: RequestUser): Promise<Voyage[]> {
  // Vessel-scoped user hanya boleh akses vessel mereka
  if (user.vesselIds && !user.vesselIds.includes(vesselId)) {
    throw new ForbiddenException("Anda tidak memiliki akses ke kapal ini");
  }

  return this.prisma.voyage.findMany({
    where: { vesselId, companyId: user.companyId }
  });
}
```

---

_RBAC adalah business-critical. Tidak ada pengecualian pada permission check. Semua bypass harus melalui review._
