# Prompt 12 — Notification System

**Tahap:** Email alerts, in-app notifications, cron jobs  
**Prerequisite:** Prompt 11 selesai  
**Output:** Sistem notifikasi lengkap — email + in-app

---

## PROMPT 12 — Notification System

```
Buat Notification System yang terintegrasi dengan semua domain events.
Baca docs/ai-rules/02-architecture.md section 2.6 untuk event-driven pattern.

BACKEND:

1. Prisma schema additions:

   model Notification {
     id          String    @id @default(uuid())
     companyId   String
     userId      String    ← Penerima notifikasi
     type        NotificationType
     title       String
     message     String
     data        Json?     ← Payload tambahan (certId, vesselId, dll)
     isRead      Boolean   @default(false)
     readAt      DateTime?
     createdAt   DateTime  @default(now())

     @@index([userId, isRead])
     @@index([companyId, createdAt])
   }

   enum NotificationType {
     CERT_EXPIRING_SOON
     CERT_CRITICAL
     CERT_EXPIRED
     VESSEL_STATUS_CHANGED
     CREW_SIGN_ON
     CREW_SIGN_OFF
     INCIDENT_REPORTED
     AUDIT_FINDING_OPENED
     MAINTENANCE_OVERDUE
     PSC_DETAINED
   }

   Migration: add_notifications_schema

2. apps/api/src/shared/notifications/

   notification.service.ts

   create(data: CreateNotificationDto): Promise<Notification>
     → Save ke DB
     → Emit ke WebSocket channel user (jika connected)

   markAsRead(id: string, userId: string): Promise<void>
   markAllAsRead(userId: string, companyId: string): Promise<void>
   getUnread(userId: string, companyId: string): Promise<Notification[]>
   getCount(userId: string): Promise<number>

3. Email Service:

   email.service.ts

   Gunakan NodeMailer dengan config dari MailConfig.
   Di development: kirim ke MailHog (localhost:1025)
   Di production: SMTP real

   Templates (HTML email, simpel tapi professional):

   sendCertificateExpiryAlert(data: {
     recipientEmail, recipientName,
     vesselName, certType, expiryDate, daysLeft, dashboardUrl
   }): Promise<void>

   sendIncidentNotification(data: {...}): Promise<void>
   sendWelcomeEmail(data: { email, firstName, tempPassword }): Promise<void>
   sendPasswordResetEmail(data: { email, resetLink }): Promise<void>

   Email templates: apps/api/src/shared/notifications/templates/
   Gunakan handlebars atau simple template strings (TIDAK perlu library berat)

4. Event Handlers yang mengirim notifikasi:

   certificate-alert.notification-handler.ts
   Listen: CertificateExpiringEvent, CertificateExpiredEvent
   → Cari users dengan role FLEET_MANAGER dan COMPANY_ADMIN di company tersebut
   → Create in-app notification untuk setiap user
   → Kirim email ke fleet manager dan company admin
   → Log ke audit trail

   incident.notification-handler.ts
   Listen: IncidentReportedEvent
   → Notify ISM Manager company
   → Jika severity FATAL/SERIOUS: juga notify COMPANY_ADMIN

   maintenance.notification-handler.ts
   Listen: MaintenanceOverdueEvent
   → Notify TECHNICAL_SUPER dan CHIEF_ENGINEER kapal

5. Notification Controllers:

   GET  /api/v1/notifications              ← Unread notifications user ini
   GET  /api/v1/notifications/count        ← Unread count (untuk badge)
   PATCH /api/v1/notifications/:id/read
   PATCH /api/v1/notifications/read-all

6. WebSocket untuk real-time (NestJS Gateway):

   notification.gateway.ts
   @WebSocketGateway({ namespace: "/notifications", cors: true })

   onConnection: authenticate JWT, join room user-{userId}

   Saat notification baru dibuat:
   → Emit ke room: "new_notification", notificationData

   Client subscribe ke event ini → update badge count tanpa reload

FRONTEND:

7. Notification Bell di TopBar:

   components/layout/NotificationBell.tsx

   - Badge: unread count (merah, max "99+")
   - Click → dropdown panel, max-height 400px, scrollable
   - Setiap item: icon + title + message + time ago
   - "Tandai semua dibaca" button di header dropdown
   - "Lihat semua" link di footer
   - Real-time: subscribe ke WebSocket, update badge

   Custom hook: useNotifications()
   - useQuery untuk initial load
   - WebSocket subscription untuk real-time updates
   - useMutation untuk mark as read

8. Notification Preferences (di Profile page):

   User bisa pilih mana yang mau dapat email notif:
   ✅ Sertifikat kadaluarsa (warning & critical)
   ✅ Insiden dilaporkan
   □ Update status kapal
   ✅ Maintenance overdue
```

---

# Prompt 13 — Testing Suite

**Tahap:** Complete test coverage — unit, integration, E2E  
**Prerequisite:** Semua module (01–12) selesai  
**Output:** Test suite lengkap, coverage ≥80%, CI passing

---

## PROMPT 13 — Testing Suite

```
Buat test suite lengkap untuk Maritime Fleet ERP.
Baca docs/ai-rules/14-testing-strategy.md untuk semua patterns dan requirements.
Coverage target: ≥80% untuk domain + application layer.

1. Unit Test Suite — Domain Layer

   Buat atau lengkapi test files untuk semua domain entities:

   contexts/fleet/domain/__tests__/
   - vessel.entity.spec.ts
     ✅ create() dengan valid data → berhasil
     ✅ create() dengan IMO format salah → throw InvalidImoNumberException
     ✅ changeStatus() ACTIVE → DRYDOCK → valid
     ✅ changeStatus() ACTIVE → SCRAPPED (skip steps) → throw InvalidStatusTransitionException
     ✅ isOperational → true jika ACTIVE, false lainnya

   - vessel-certificate.entity.spec.ts
     ✅ expiryStatus: 91 hari lagi → VALID
     ✅ expiryStatus: 60 hari lagi → EXPIRING_SOON
     ✅ expiryStatus: 20 hari lagi → CRITICAL
     ✅ expiryStatus: kemarin → EXPIRED
     ✅ isValid: true untuk VALID dan EXPIRING_SOON
     ✅ isValid: false untuk CRITICAL dan EXPIRED

   contexts/crew/domain/__tests__/
   - stcw-compliance.service.spec.ts
     ✅ MASTER dengan semua cert valid → isCompliant: true
     ✅ MASTER dengan CoC expired → violation EXPIRED
     ✅ MASTER tanpa BST → violation MISSING
     ✅ AB dengan cert minimal valid → isCompliant: true
     ✅ Multiple violations → semua ditampilkan sekaligus

   - crew-assignment.entity.spec.ts
     ✅ isOnBoard: true jika signOffDate null
     ✅ signOff() → set signOffDate, emit event
     ✅ signOff() dengan tanggal sebelum signOnDate → error

   contexts/voyage/domain/__tests__/
   - voyage-compliance.service.spec.ts
     ✅ SMC expired → hardBlock: true, canDepart: false
     ✅ SMC critical (<30 hari) → softBlock, canDepart: true (dengan warning)
     ✅ Manning kurang → hardBlock
     ✅ PSC detained → hardBlock
     ✅ Semua OK → canDepart: true, no blocks

2. Unit Test Suite — Application Layer

   Buat test untuk semua command handlers (pakai mock repository):

   contexts/fleet/application/__tests__/
   - register-vessel.handler.spec.ts
     ✅ Vessel baru → berhasil disimpan
     ✅ IMO duplikat → throw DuplicateImoNumberException
     ✅ Event VesselRegisteredEvent di-emit
     ✅ Audit log dibuat (verify auditService.log dipanggil)

   - add-vessel-certificate.handler.spec.ts
     ✅ Cert baru → berhasil
     ✅ Cert tipe sama yang masih valid sudah ada → throw CertAlreadyValidException

   contexts/crew/application/__tests__/
   - sign-on-crew.handler.spec.ts
     ✅ Crew valid → assignment dibuat
     ✅ Crew sudah on board → throw AlreadyOnBoardException
     ✅ STCW violation → throw StcwComplianceViolationException dengan details
     ✅ Event CrewSignedOnEvent di-emit

   contexts/iam/application/__tests__/
   - login.handler.spec.ts          ← Sudah dibuat di Prompt 04-C
   - get-user-permissions.handler.spec.ts

3. Integration Test Suite — API Endpoints

   test/integration/

   setup:
   - beforeAll: start NestJS app, jalankan migrations, seed test data
   - afterAll: cleanup test data, close app
   - beforeEach: reset state yang berubah

   fleet/
   - vessel.integration.spec.ts      ← Dari Prompt 05-C (lengkapi)
   - certificate.integration.spec.ts
     ✅ Add cert → GET certs → cert muncul dengan status VALID
     ✅ Add cert yang sudah expired → status langsung EXPIRED
     ✅ Renew cert → expiryDate update, status kembali VALID

   crew/
   - seafarer.integration.spec.ts
     ✅ Register seafarer → GET → data benar
     ✅ Sign-on dengan cert invalid → 422 dengan violation details
     ✅ Sign-on valid → manning list terupdate
     ✅ Sign-off → isOnBoard false

   voyage/
   - voyage.integration.spec.ts
     ✅ Create voyage PLANNED
     ✅ Approve departure dengan SMC expired → 422
     ✅ Approve departure dengan semua OK → status ACTIVE
     ✅ Record arrival → status COMPLETED

   iam/
   - auth.integration.spec.ts
     ✅ Login → dapat accessToken
     ✅ Refresh → dapat accessToken baru
     ✅ Logout → refreshToken direvoke
     ✅ Request dengan expired token → 401
     ✅ Multi-tenant: user company A tidak bisa akses data company B

4. E2E Test Suite — Critical User Journeys

   test/e2e/ (Playwright atau NestJS supertest)

   journey-1-vessel-lifecycle.e2e.ts
   - Login sebagai Fleet Manager
   - Tambah kapal baru
   - Tambah SMC certificate
   - Change status ke Drydock
   - Reaktivasi kapal
   - Hapus kapal

   journey-2-crew-sign-on.e2e.ts
   - Login sebagai Crewing Manager
   - Daftarkan seafarer baru
   - Tambah semua STCW certificates
   - Sign-on ke kapal
   - Verifikasi manning list
   - Sign-off

   journey-3-voyage-with-compliance.e2e.ts
   - Setup: kapal dengan SMC valid + crew cukup
   - Create voyage
   - Approve departure → compliance check pass → status ACTIVE
   - Record arrival → COMPLETED

   journey-4-compliance-alert.e2e.ts
   - Setup: cert dengan expiry besok
   - Trigger cron job
   - Verifikasi status cert berubah ke CRITICAL
   - Verifikasi notification dibuat

5. Coverage Report & CI Config:

   .github/workflows/ci.yml

   jobs:
     test:
       steps:
         - pnpm install
         - pnpm lint
         - pnpm test:unit --coverage
         - pnpm test:integration
         - Upload coverage ke Codecov (optional)

   Coverage thresholds (jest.config.ts):
   Domain layer: lines ≥ 85%, branches ≥ 80%
   Application layer: lines ≥ 80%
   Overall: lines ≥ 70%

   CI harus GAGAL jika threshold tidak terpenuhi.

Setelah selesai, jalankan:
pnpm test:coverage
→ Coverage report harus memenuhi threshold di semua layer
```

---

# Prompt 14 — Production Hardening

**Tahap:** Security, performance, logging, monitoring  
**Prerequisite:** Prompt 13 selesai, semua tests passing  
**Output:** Aplikasi siap production dari sisi security dan performance

---

## PROMPT 14 — Production Hardening

```
Harden aplikasi untuk production deployment.
Ini adalah prompt pre-deployment yang memastikan semua celah keamanan tertutup.

1. SECURITY HARDENING — Backend

   a. HTTP Security Headers (via Helmet):
   helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],  // Tailwind needs this
         imgSrc: ["'self'", "data:", "https:"],
         connectSrc: ["'self'", process.env.API_URL],
       },
     },
     crossOriginEmbedderPolicy: false,  // Untuk MinIO file serving
   })

   b. CORS Configuration:
   {
     origin: [process.env.WEB_URL],       // Hanya izinkan frontend domain
     credentials: true,                   // Untuk httpOnly cookie
     methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
     allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
   }

   c. Validate semua environment variables saat startup:
   Jika JWT_SECRET kurang dari 32 karakter → throw Error, app tidak start
   Jika DATABASE_URL tidak bisa connect → throw Error

   d. SQL Injection: Prisma handles ini, tapi pastikan:
   - TIDAK ada raw query ($queryRaw) kecuali benar-benar diperlukan
   - Jika ada $queryRaw: selalu gunakan parameterized queries

   e. Sensitive data:
   - Response DTO tidak boleh include passwordHash, tokenHash, bankAccount
   - Tambahkan @Exclude() decorator dari class-transformer untuk fields sensitif
   - Audit log: sanitize sensitive fields sebelum simpan (lihat audit interceptor)

   f. File upload security:
   - Validate MIME type menggunakan magic bytes (file-type library), bukan hanya extension
   - Scan filename: strip path traversal characters
   - Store di MinIO dengan random UUID filename (bukan original filename)

2. PERFORMANCE OPTIMIZATION — Backend

   a. Database query optimization:
   - Review semua findAll queries: pastikan ada index yang sesuai
   - N+1 problem check: semua relasi yang sering diakses harus eager load dengan include
   - Tambahkan select() untuk field yang tidak diperlukan
   - Connection pooling: DATABASE_URL + ?connection_limit=20&pool_timeout=10

   b. Redis Caching:
   - Cache komplianceSummary per company: TTL 5 menit
   - Cache vesselList (page 1, default filter) per company: TTL 2 menit
   - Cache user permissions: TTL 5 menit (sudah dari Prompt 04-C)
   - Invalidate cache relevant saat data berubah

   c. Response compression:
   Pastikan compression() middleware aktif (sudah dari Prompt 03-A)

   d. Lazy loading modules:
   Modul yang jarang dipakai (Financial, Procurement) bisa lazy load.
   Untuk Phase 1, semua modul eager load masih OK.

3. PERFORMANCE OPTIMIZATION — Frontend

   a. Next.js optimizations:
   - next.config.js: images.domains untuk MinIO domain
   - Bundle analysis: ANALYZE=true pnpm build → identifikasi bundle besar
   - Lazy import heavy components: dynamic(() => import('./HeavyChart'))
   - Prefetch routes yang sering diakses (prefetch di Link component)

   b. React Query optimizations:
   - Gunakan select() untuk transform data di query (kurangi re-renders)
   - useInfiniteQuery untuk long lists jika diperlukan
   - Pastikan queryKey consistent untuk proper caching

   c. Table virtualization (untuk data sangat besar):
   Jika vessel list > 500 row: implementasikan virtual scrolling
   Gunakan @tanstack/react-virtual

4. LOGGING & MONITORING

   a. Structured logging (Winston):
   Format production: JSON
   Format development: pretty print dengan warna

   Log levels:
   - ERROR: unhandled exceptions, 5xx errors
   - WARN: 4xx errors, business rule violations, slow queries (>1s)
   - INFO: request/response, auth events, business events
   - DEBUG: detail query, cache hits/misses (development only)

   Log fields wajib: timestamp, level, message, requestId, userId,
                    companyId, method, url, statusCode, duration

   b. Health check enhancement:
   GET /health/detailed (butuh auth):
   - Database response time
   - Redis response time
   - MinIO status
   - Active WebSocket connections
   - Memory usage
   - CPU usage
   - Uptime

   c. Error tracking setup (Sentry — optional tapi recommended):
   Jika SENTRY_DSN di env → init Sentry
   Capture semua 5xx errors dengan context: userId, companyId, requestId

5. DATABASE MAINTENANCE

   Buat script untuk:

   scripts/db-maintenance.ts
   - Archive audit logs > 2 tahun ke tabel archive (atau hapus jika tidak perlu)
   - Cleanup expired refresh tokens (sudah lewat expiry)
   - Cleanup expired password reset tokens
   - Update certificate statuses (seharusnya sudah di cron job)

   Schedule via @Cron("0 2 * * 0") ← Setiap Minggu jam 2 pagi

6. INPUT VALIDATION REVIEW

   Review semua DTOs:
   □ Semua string field: @MaxLength() untuk prevent DoS
   □ Semua free-text field: @IsString() + sanitasi XSS (strip HTML tags)
   □ Date fields: validate tidak lebih dari 100 tahun di masa depan
   □ Number fields: @IsPositive() atau @Min(0) sesuai konteks
   □ File upload: tipe, ukuran, nama file

7. SECURITY CHECKLIST (verifikasi manual)

   □ Tidak ada hardcoded secrets di kode
   □ .env tidak di-commit ke git
   □ Swagger hanya aktif di development (NODE_ENV !== 'production')
   □ Admin endpoints hanya bisa diakses SUPER_ADMIN
   □ Semua file routes butuh auth (kecuali /health, /login, /forgot-password)
   □ Rate limiting aktif di auth endpoints
   □ httpOnly, Secure, SameSite=Strict pada cookie refresh token
   □ JWT secret minimal 32 karakter
   □ bcrypt salt rounds minimal 12
   □ File upload disimpan di MinIO, tidak di filesystem container
```

---

# Prompt 15 — Deployment

**Tahap:** Docker production build, CI/CD, go-live checklist  
**Prerequisite:** Prompt 14 selesai, semua security checklist terpenuhi  
**Output:** Aplikasi running di production, CI/CD pipeline aktif

---

## PROMPT 15 — Deployment

```
Siapkan Maritime Fleet ERP untuk production deployment.
Output: docker-compose.prod.yml yang siap di-run di VPS/cloud.

1. PRODUCTION DOCKERFILE

   docker/Dockerfile.api (multi-stage):

   Stage 1 — deps:
   FROM node:20-alpine AS deps
   Install pnpm, copy package files, pnpm install --frozen-lockfile

   Stage 2 — builder:
   FROM node:20-alpine AS builder
   Copy deps, copy source, pnpm build
   Generate Prisma client: npx prisma generate

   Stage 3 — runner (PRODUCTION):
   FROM node:20-alpine AS runner
   RUN addgroup -S maritime && adduser -S maritime -G maritime
   USER maritime                           ← Non-root user
   Copy dari builder: dist/, node_modules/, prisma/
   EXPOSE 4000
   CMD ["node", "dist/main.js"]

   docker/Dockerfile.web (multi-stage):

   Stage 1 — deps → Stage 2 — builder (pnpm build) → Stage 3 — runner
   FROM node:20-alpine AS runner
   RUN addgroup -S maritime && adduser -S maritime -G maritime
   USER maritime
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   EXPOSE 3000
   CMD ["node", "server.js"]

   next.config.js: output: "standalone"  ← Untuk standalone Docker build

2. DOCKER COMPOSE PRODUCTION

   docker-compose.prod.yml:

   services:
     postgres:
       image: postgres:16-alpine
       volumes:
         - postgres_data:/var/lib/postgresql/data
       environment: (dari .env.prod)
       healthcheck: pg_isready
       restart: unless-stopped
       networks: [internal]                ← Tidak expose ke luar!

     redis:
       image: redis:7-alpine
       command: redis-server --requirepass ${REDIS_PASSWORD}
       volumes: [redis_data:/data]
       healthcheck: redis-cli ping
       restart: unless-stopped
       networks: [internal]

     minio:
       image: minio/minio
       command: server /data --console-address ":9001"
       volumes: [minio_data:/data]
       environment: MINIO_ROOT_USER, MINIO_ROOT_PASSWORD
       healthcheck: curl -f http://localhost:9000/minio/health/live
       restart: unless-stopped
       networks: [internal]

     api:
       build: { context: ., dockerfile: docker/Dockerfile.api }
       depends_on: [postgres, redis, minio]
       environment: (semua env vars)
       command: sh -c "npx prisma migrate deploy && node dist/main.js"
       healthcheck: curl -f http://localhost:4000/health
       restart: unless-stopped
       networks: [internal, public]
       deploy:
         resources:
           limits: { cpus: "2", memory: 2G }

     web:
       build: { context: ., dockerfile: docker/Dockerfile.web }
       depends_on: [api]
       environment: NEXT_PUBLIC_API_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
       restart: unless-stopped
       networks: [internal, public]
       deploy:
         resources:
           limits: { cpus: "1", memory: 1G }

     nginx:
       image: nginx:alpine
       ports: ["80:80", "443:443"]
       volumes:
         - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
         - ./docker/nginx/ssl:/etc/nginx/ssl
       depends_on: [api, web]
       restart: unless-stopped
       networks: [public]

   networks:
     internal: { driver: bridge, internal: true }   ← Tidak bisa akses internet langsung
     public: { driver: bridge }

   volumes: postgres_data, redis_data, minio_data

3. NGINX CONFIGURATION

   docker/nginx/nginx.conf:

   upstream api { server api:4000; }
   upstream web { server web:3000; }

   server {
     listen 80;
     return 301 https://$host$request_uri;    ← Force HTTPS redirect
   }

   server {
     listen 443 ssl http2;
     ssl_certificate /etc/nginx/ssl/cert.pem;
     ssl_certificate_key /etc/nginx/ssl/key.pem;

     # Security headers
     add_header X-Frame-Options DENY;
     add_header X-Content-Type-Options nosniff;
     add_header Strict-Transport-Security "max-age=31536000";

     # API routes
     location /api/ {
       proxy_pass http://api;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       client_max_body_size 10m;             ← File upload limit
     }

     # WebSocket
     location /socket.io/ {
       proxy_pass http://api;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }

     # Frontend (semua route lain)
     location / {
       proxy_pass http://web;
       proxy_set_header Host $host;
     }
   }

4. CI/CD PIPELINE

   .github/workflows/ci.yml:

   on: [push, pull_request]

   jobs:
     quality:
       steps: [checkout, setup pnpm, install, lint, tsc check]

     test:
       needs: quality
       services: [postgres, redis]
       steps: [checkout, setup, install, migrate test DB, test:unit, test:integration]

     build:
       needs: test
       if: github.ref == 'refs/heads/main'
       steps: [docker build api, docker build web, push ke registry]

   .github/workflows/deploy.yml:

   on:
     workflow_run:
       workflows: ["CI"]
       branches: [main]
       types: [completed]

   jobs:
     deploy:
       if: ${{ github.event.workflow_run.conclusion == 'success' }}
       steps:
         - SSH ke VPS
         - docker compose -f docker-compose.prod.yml pull
         - docker compose -f docker-compose.prod.yml up -d
         - docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
         - Health check: curl https://your-domain.com/health
         - Notify Slack/email jika deploy berhasil/gagal

5. GO-LIVE CHECKLIST

   PRE-DEPLOYMENT:
   □ Semua tests passing (pnpm test:ci)
   □ Coverage ≥ threshold
   □ Security hardening checklist (Prompt 14) selesai
   □ .env.prod sudah diisi semua required vars
   □ SSL certificate valid dan tidak expired
   □ DNS sudah pointing ke server
   □ Backup strategy untuk database ada (pg_dump scheduled)
   □ Monitoring alerts sudah dikonfigurasi

   DEPLOYMENT:
   □ docker compose build --no-cache
   □ docker compose -f docker-compose.prod.yml up -d
   □ docker compose ps → semua services healthy
   □ npx prisma migrate deploy → success
   □ pnpm db:seed → HANYA jika fresh database
   □ curl https://your-domain.com/health → { status: "ok" }

   POST-DEPLOYMENT VERIFICATION:
   □ Login dengan superadmin@maritime-erp.com
   □ Login dengan admin@njm.co.id
   □ Tambah vessel → berhasil
   □ RBAC test: PORT_AGENT tidak bisa create vessel
   □ Multi-tenant: company A tidak lihat data company B
   □ Certificate expiry alert visible di dashboard
   □ Email notifikasi terkirim (test dengan akun real)
   □ File upload → dokumen tersimpan di MinIO
   □ WebSocket notifications berfungsi
   □ Swagger tersedia HANYA jika NODE_ENV=development (tidak di production)

   ROLLBACK PLAN:
   Jika ada masalah setelah deploy:
   □ docker compose -f docker-compose.prod.yml down
   □ Restore image versi sebelumnya: docker compose up -d --image=prev-tag
   □ Jika migration bermasalah: restore database dari backup
   □ Notify tim via Slack/email

6. PRODUCTION .env.prod TEMPLATE

   Simpan di server (TIDAK di git), isi dengan nilai aktual:

   # App
   NODE_ENV=production
   PORT=4000
   APP_URL=https://api.your-domain.com
   WEB_URL=https://your-domain.com

   # Database
   DATABASE_URL=postgresql://maritime_user:STRONG_PASSWORD@postgres:5432/maritime_erp_prod

   # JWT — generate dengan: openssl rand -hex 32
   JWT_SECRET=<minimum_32_char_random_string>
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d

   # Redis
   REDIS_URL=redis://:REDIS_PASSWORD@redis:6379
   REDIS_PASSWORD=STRONG_REDIS_PASSWORD

   # MinIO
   MINIO_ENDPOINT=minio
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=<access_key>
   MINIO_SECRET_KEY=<secret_key>
   MINIO_BUCKET=maritime-docs

   # Email (SMTP production)
   SMTP_HOST=smtp.your-provider.com
   SMTP_PORT=587
   SMTP_USER=noreply@your-domain.com
   SMTP_PASS=<smtp_password>
   SMTP_FROM=Maritime ERP <noreply@your-domain.com>

   # Next.js
   NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
   NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
   NEXTAUTH_SECRET=<random_32_char>
   NEXTAUTH_URL=https://your-domain.com

---

## SELESAI — Sistem Siap Production 🚢

Jika semua 15 prompt telah selesai dan go-live checklist hijau,
Maritime Fleet ERP Phase 1 siap digunakan oleh pengguna production.

Langkah selanjutnya:
→ Onboarding pengguna awal (Fleet Manager, Admin)
→ Input data armada aktual
→ Training singkat (1–2 jam) untuk user utama
→ Monitor logs dan alerts selama 2 minggu pertama
→ Mulai perencanaan Phase 2 (Crew & Voyage Management)
```
