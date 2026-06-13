# Prompt 04 — IAM Module (Auth + RBAC)

**Tahap:** Authentication, JWT, User management, Role & Permission  
**Prerequisite:** Prompt 03 selesai  
**Output:** Login berfungsi, RBAC aktif, semua test auth pass

---

## PROMPT 04-A — Auth Domain & Application Layer

```
Buat IAM bounded context menggunakan DDD + Clean Architecture.
Baca docs/ai-rules/04-folder-structure.md section 4.3 untuk template struktur.
Baca docs/ai-rules/08-auth-rbac.md untuk semua auth rules dan JWT payload.
Baca docs/ai-rules/05-code-conventions.md untuk SOLID principles.

Lokasi: apps/api/src/contexts/iam/

DOMAIN LAYER (contexts/iam/domain/):

1. entities/user.entity.ts
   class User {
     id: string
     companyId: string
     email: string
     passwordHash: string  ← private, tidak boleh exposed
     firstName: string
     lastName: string
     isActive: boolean

     get fullName(): string

     static create(data: CreateUserData): User
     changePassword(newPasswordHash: string): void
     deactivate(): void
     activate(): void
   }

2. value-objects/email.vo.ts
   class Email {
     private readonly value: string
     static create(email: string): Email  ← validate format
     toString(): string
   }

3. value-objects/password.vo.ts
   class Password {
     static validate(plain: string): ValidationResult
       ← Cek rules dari docs/ai-rules/08-auth-rbac.md section 8.5
     static hash(plain: string): Promise<string>
     static verify(plain: string, hash: string): Promise<boolean>
   }

4. events/
   - user-logged-in.event.ts
   - user-created.event.ts
   - password-changed.event.ts

5. exceptions/
   - user-not-found.exception.ts          (code: IAM_USER_NOT_FOUND, 404)
   - invalid-credentials.exception.ts    (code: AUTH_CREDENTIALS_INVALID, 401)
   - user-email-exists.exception.ts      (code: IAM_USER_EMAIL_EXISTS, 409)
   - account-disabled.exception.ts       (code: AUTH_ACCOUNT_DISABLED, 403)
   - token-expired.exception.ts          (code: AUTH_TOKEN_EXPIRED, 401)

6. repositories/
   - user.repository.interface.ts
     findById(id: string, companyId?: string): Promise<User | null>
     findByEmail(email: string): Promise<User | null>
     findAll(companyId: string, options?): Promise<PaginatedResult<User>>
     save(user: User): Promise<User>
     update(id, companyId, data): Promise<User>
     softDelete(id, companyId, deletedBy): Promise<void>

   - refresh-token.repository.interface.ts
     create(data: CreateRefreshTokenData): Promise<RefreshToken>
     findByToken(hashedToken: string): Promise<RefreshToken | null>
     revoke(id: string): Promise<void>
     revokeAllForUser(userId: string): Promise<void>

APPLICATION LAYER (contexts/iam/application/):

1. commands/login/
   - login.command.ts          { email, password, ipAddress, userAgent }
   - login.handler.ts
     → findByEmail, verify password, check isActive
     → generate accessToken + refreshToken
     → save refreshToken ke DB (hashed)
     → emit UserLoggedInEvent (untuk audit)
     → return: { accessToken, refreshToken, user: UserResponseDto }

2. commands/refresh-token/
   - refresh-token.command.ts  { refreshToken, ipAddress }
   - refresh-token.handler.ts
     → hash token, findByToken
     → check not revoked, not expired
     → generate new accessToken
     → return: { accessToken }

3. commands/logout/
   - logout.command.ts         { userId, refreshToken }
   - logout.handler.ts
     → revoke specific refreshToken
     → emit UserLoggedOutEvent

4. commands/create-user/
   - create-user.command.ts
   - create-user.handler.ts
     → validate email uniqueness
     → hash password
     → create user + assign default role
     → emit UserCreatedEvent

5. commands/change-password/
   - change-password.command.ts  { userId, oldPassword, newPassword }
   - change-password.handler.ts
     → verify old password
     → validate new password policy
     → hash new password
     → update user
     → revoke all refresh tokens (security)

6. queries/get-user-permissions/
   - get-user-permissions.query.ts   { userId, companyId }
   - get-user-permissions.handler.ts
     → fetch user roles
     → aggregate all permissions from roles
     → cache result di Redis (TTL: 5 menit)
     → return: string[] (e.g. ["vessel:create", "crew:read"])

   PENTING: Result di-cache karena dipanggil setiap request via RBAC guard.

7. dtos/
   - login.dto.ts               { email: string, password: string }
   - login-response.dto.ts      { accessToken, user: UserSummaryDto }
   - create-user.dto.ts         (dengan Swagger decorators lengkap)
   - user-response.dto.ts       (TANPA passwordHash)
   - change-password.dto.ts

Buat unit tests untuk semua handlers di __tests__/ masing-masing.
```

---

## PROMPT 04-B — IAM Infrastructure & Presentation

```
Buat infrastructure dan presentation layer untuk IAM module.
Baca docs/ai-rules/06-api-design.md untuk controller patterns.
Baca docs/ai-rules/08-auth-rbac.md untuk JWT strategy.

INFRASTRUCTURE LAYER (contexts/iam/infrastructure/):

1. repositories/
   - prisma-user.repository.ts
     Implements IUserRepository
     Semua query WAJIB include deletedAt: null
     Handle PrismaClientKnownRequestError → convert ke domain exceptions

   - prisma-refresh-token.repository.ts
     Implements IRefreshTokenRepository

2. strategies/
   - jwt.strategy.ts
     Extends PassportStrategy(Strategy, "jwt")
     Validate JWT payload → return RequestUser
     Inject permissions dari cache/DB (via GetUserPermissionsHandler)
     Inject active vesselIds jika user punya vessel-scoped role

   - local.strategy.ts (optional — untuk form login)

3. mappers/
   - user.mapper.ts
     toDomain(prismaUser): User
     toResponse(user): UserResponseDto
     toPrismaCreate(user): Prisma.UserCreateInput

PRESENTATION LAYER (contexts/iam/presentation/):

1. controllers/auth.controller.ts
   Tag Swagger: "Auth"

   POST /api/v1/auth/login
   @Public()                          ← No auth required
   @Throttle(5, 60)                   ← Max 5x per menit (rate limit)
   Body: LoginDto
   Response: { accessToken, user }
   Set refreshToken sebagai httpOnly cookie

   POST /api/v1/auth/refresh
   @Public()
   Ambil refreshToken dari cookie
   Response: { accessToken }

   POST /api/v1/auth/logout
   @UseGuards(JwtAuthGuard)
   Revoke refresh token dari cookie
   Clear cookie

   GET /api/v1/auth/me
   @UseGuards(JwtAuthGuard)
   Return current user info + permissions

2. controllers/user.controller.ts
   Tag Swagger: "System Admin — Users"

   GET    /api/v1/users              @Permissions("user:read")
   POST   /api/v1/users              @Permissions("user:create")
   GET    /api/v1/users/:userId      @Permissions("user:read")
   PATCH  /api/v1/users/:userId      @Permissions("user:update")
   DELETE /api/v1/users/:userId      @Permissions("user:delete")
   POST   /api/v1/users/:userId/roles      Assign role ke user
   DELETE /api/v1/users/:userId/roles/:roleId  Remove role

3. controllers/role.controller.ts
   Tag Swagger: "System Admin — Roles"

   GET    /api/v1/roles              @Permissions("role:read") — list semua roles
   GET    /api/v1/roles/:roleId      Detail role + permissions
   POST   /api/v1/roles              @Permissions("role:manage") — SUPER_ADMIN only
   PATCH  /api/v1/roles/:roleId      Update role permissions
   DELETE /api/v1/roles/:roleId      Check isSystem → throw jika true

4. iam.module.ts
   Providers: semua handlers, repositories, strategies
   Imports: PassportModule, JwtModule (async config dari JwtConfig)
   Exports: JwtStrategy, PassportModule (untuk digunakan modul lain)
```

---

## PROMPT 04-C — Permission Cache & RBAC Guard

```
Implementasikan permission caching di Redis dan RBAC guard yang robust.
Baca docs/ai-rules/08-auth-rbac.md section 8.4 untuk guard implementation.

1. Permission caching di GetUserPermissionsHandler:

   Cache key: permissions:{userId}:{companyId}
   TTL: 300 detik (5 menit)

   Flow:
   → Check Redis cache
   → Cache hit: return parsed permissions
   → Cache miss: query DB, aggregate permissions, save ke cache

   Cache invalidation trigger:
   → User role diubah → invalidate cache key
   → User dinonaktifkan → invalidate cache key
   → Role permissions diubah → invalidate ALL user caches dengan role tersebut

   Buat: permission-cache.service.ts
   - getPermissions(userId, companyId): Promise<string[] | null>
   - setPermissions(userId, companyId, permissions): Promise<void>
   - invalidateUser(userId, companyId): Promise<void>
   - invalidateRole(roleId): Promise<void>  ← Invalidate semua user dengan role ini

2. RBAC Guard yang handle vessel-scoped access:

   Di rbac.guard.ts, setelah check permission:

   const requiredPermissions = [...];

   // Cek permission string
   const hasPermission = requiredPermissions.every(p => user.permissions.includes(p));

   // Vessel-scoped check
   const vesselId = request.params.vesselId;
   if (vesselId && user.vesselIds && !user.vesselIds.includes(vesselId)) {
     throw new ForbiddenException("AUTH_VESSEL_ACCESS_DENIED");
   }

   return hasPermission;

3. Test seluruh auth flow dengan Jest:

   File: contexts/iam/application/commands/login/__tests__/login.handler.spec.ts

   Test cases:
   ✅ Login berhasil dengan credentials valid
   ✅ Throw InvalidCredentialsException jika password salah
   ✅ Throw InvalidCredentialsException jika email tidak ada
   ✅ Throw AccountDisabledException jika user tidak aktif
   ✅ Generate accessToken dengan payload yang benar
   ✅ Save refreshToken ke database (hashed)
   ✅ Emit UserLoggedInEvent

   File: contexts/iam/application/queries/get-user-permissions/__tests__/

   Test cases:
   ✅ Return dari cache jika ada
   ✅ Query DB dan cache jika tidak ada di Redis
   ✅ Return correct permissions untuk FLEET_MANAGER role
   ✅ Return empty array jika user tidak punya role
```

---

## PROMPT 04-D — Password Reset & Security

```
Implementasikan password reset flow dan security hardening untuk auth.

1. Password Reset Flow:

   POST /api/v1/auth/forgot-password    @Public()
   Body: { email }
   → Find user by email (jangan reveal apakah email ada atau tidak)
   → Generate reset token (crypto.randomBytes(32).toString("hex"))
   → Hash token, simpan ke DB dengan expiry 1 jam
   → Kirim email dengan link: {frontendUrl}/reset-password?token={rawToken}
   → Response SELALU: { message: "Jika email terdaftar, link reset telah dikirim" }

   POST /api/v1/auth/reset-password     @Public()
   Body: { token, newPassword, confirmPassword }
   → Hash token, find di DB
   → Validate not expired, not used
   → Validate password policy
   → Update password
   → Mark token as used
   → Revoke semua refresh tokens user (kick out semua session)
   → Emit PasswordResetEvent

2. Model tambahan di Prisma:

   model PasswordResetToken {
     id        String    @id @default(uuid())
     userId    String
     tokenHash String    @unique
     expiresAt DateTime
     usedAt    DateTime?
     createdAt DateTime  @default(now())

     user      User      @relation(...)
     @@index([userId])
   }

   Buat migration: add_password_reset_tokens

3. Login Security:

   Track failed login attempts (simpan di Redis):
   Key: login_attempts:{email}
   TTL: 15 menit

   Jika failed attempts >= 5:
   → Lock account 15 menit
   → Throw: AUTH_ACCOUNT_LOCKED dengan retryAfter

   Reset counter setelah login sukses.

4. Session Management:

   GET /api/v1/auth/sessions    @UseGuards(JwtAuthGuard)
   → List semua active refresh tokens untuk user ini
   → Tampilkan: id, createdAt, ipAddress, userAgent, lastUsedAt

   DELETE /api/v1/auth/sessions/:sessionId
   → Revoke specific session (logout dari device tertentu)

   DELETE /api/v1/auth/sessions
   → Revoke semua sessions (logout dari semua device)
```

---

## Checklist Selesai Prompt 04

```bash
# Test login flow
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@njm.co.id","password":"Password123!"}'
# → 200 dengan accessToken

# Test auth guard
curl http://localhost:4000/api/v1/users \
  -H "Authorization: Bearer INVALID_TOKEN"
# → 401 AUTH_TOKEN_INVALID

# Test RBAC
# Login sebagai PORT_AGENT, coba create vessel
# → 403 AUTH_PERMISSION_DENIED

# Test rate limiting
# Hit /auth/login > 5x dengan wrong password
# → 429 Too Many Requests

# Test /auth/me
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer {validToken}"
# → user data + permissions array

# Unit tests
pnpm test:unit --testPathPattern=iam
# → Semua passing

# Multi-tenant isolation
# Login sebagai user company A, GET /users
# → Hanya user company A yang muncul, TIDAK ada user company B
```

**Jangan lanjut ke Prompt 05 sebelum semua auth test pass.**
