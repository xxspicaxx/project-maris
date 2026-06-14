# Prompt 01 — Project Initialization

**Tahap:** Setup monorepo, Docker, tooling dasar  
**Prerequisite:** Node 20+, pnpm 8+, Docker terinstall  
**Output:** Project siap di-run secara lokal dengan `pnpm dev`

> **Status: ✅ SELESAI**  
> Monorepo Turborepo+pnpm berjalan, Docker Compose tersedia, shared packages (enums, types, utils, schemas) terbuat, ESLint+Prettier+Husky aktif.

---

## PROMPT 01-A — Inisiasi Monorepo

> ✅ **SELESAI** — Struktur monorepo Turborepo+pnpm terbuat, `apps/api`, `apps/web`, `packages/shared`, `packages/ui`, `packages/config` sudah ada.

```
Kamu adalah senior fullstack engineer yang akan membangun Maritime Fleet ERP.
Baca terlebih dahulu semua file di docs/ai-rules/ sebelum melakukan apapun.

Tugas: Inisiasi monorepo dari scratch dengan struktur berikut.

Stack:
- Monorepo manager: Turborepo + pnpm workspaces
- Backend: NestJS 10 + TypeScript strict
- Frontend: Next.js 14 App Router + TypeScript strict
- Shared packages: types, UI components, configs

Buat struktur ini secara lengkap:

maritime-fleet-erp/
├── apps/
│   ├── web/          ← Next.js 14
│   └── api/          ← NestJS 10
├── packages/
│   ├── shared/       ← Shared types, enums, Zod schemas, constants
│   ├── ui/           ← Shared UI components (design system)
│   └── config/       ← Shared ESLint + TypeScript configs
├── turbo.json
├── pnpm-workspace.yaml
├── package.json (root)
└── .gitignore

Requirements:
1. TypeScript strict mode di semua packages
2. ESLint dengan @typescript-eslint/strict
3. Prettier dengan konfigurasi standar
4. Husky + lint-staged untuk pre-commit hooks
5. Path aliases: @/* untuk src/, @shared/* untuk packages/shared/src/
6. turbo.json dengan pipeline: build, dev, test, lint

Setelah struktur selesai, pastikan `pnpm install` dan `pnpm dev` berjalan tanpa error.
```

---

## PROMPT 01-B — Docker Compose Setup

> ✅ **SELESAI** — `docker-compose.yml`, `docker-compose.prod.yml`, `docker/Dockerfile.api`, `docker/Dockerfile.web`, `docker/nginx/nginx.conf`, `.env.example` tersedia.

```
Lanjutkan setup Docker Compose untuk Maritime Fleet ERP.
Baca docs/ai-rules/03-tech-stack.md untuk referensi services yang dibutuhkan.

Buat file-file berikut:

1. docker-compose.yml (development)
   Services yang dibutuhkan:
   - postgres:16 → port 5432, database: maritime_erp_dev
   - redis:7 → port 6379
   - minio/minio → port 9000 (API) + 9001 (Console)
   - mailhog → port 1025 (SMTP) + 8025 (Web UI untuk dev)

2. docker-compose.prod.yml (production override)
   - Tidak expose port database ke luar
   - Volume persistence untuk postgres, redis, minio
   - Health checks untuk semua services
   - Resource limits

3. docker/
   ├── Dockerfile.api     ← Multi-stage build untuk NestJS
   ├── Dockerfile.web     ← Multi-stage build untuk Next.js
   └── nginx/
       ├── nginx.conf     ← Reverse proxy config
       └── ssl/           ← Placeholder untuk SSL certs

4. .env.example (template env vars lengkap)
   Referensi: docs/ai-rules/03-tech-stack.md section 3.8

Requirements:
- Dockerfile harus multi-stage (builder + runner)
- Non-root user di production containers
- Health check endpoints: /health untuk API, /api/health untuk proxy
- .env tidak boleh di-commit (pastikan ada di .gitignore)
- Jalankan: docker compose up -d dan semua services harus healthy
```

---

## PROMPT 01-C — Shared Package Foundation

> ✅ **SELESAI** — `packages/shared/src/` memiliki `enums/`, `types/`, `constants/`, `utils/`, `schemas/`, dan semua ter-export dari `index.ts`.

```
Setup packages/shared yang akan digunakan oleh apps/web dan apps/api.
Baca docs/ai-rules/04-folder-structure.md section 4.5 dan
docs/ai-rules/11-domain-glossary.md untuk referensi enum values.

Buat struktur packages/shared/src/ lengkap:

1. enums/ — Semua enum maritim
   Buat file-file ini dengan values yang sesuai dari domain glossary:
   - vessel-status.enum.ts     (ACTIVE, DRYDOCK, LAID_UP, SCRAPPED, SOLD)
   - vessel-type.enum.ts       (BULK_CARRIER, TANKER_CRUDE, dll — lihat glossary)
   - crew-rank.enum.ts         (MASTER, CHIEF_OFFICER, dll — lengkap)
   - certificate-status.enum.ts (VALID, EXPIRING_SOON, CRITICAL, EXPIRED, PENDING_RENEWAL)
   - vessel-cert-type.enum.ts  (SMC, DOC, ISSC, IOPP, dll)
   - seafarer-cert-type.enum.ts (COC, BST, SCRFA, dll)
   - audit-action.enum.ts      (CREATE, UPDATE, DELETE, LOGIN, dll)

2. types/
   - api-response.types.ts     (ApiResponse<T>, PaginationMeta, ApiErrorResponse)
   - request-context.types.ts  (RequestUser interface)
   - pagination.types.ts       (PaginationQuery, PaginationResult<T>)

3. constants/
   - certificate-thresholds.ts  (EXPIRY_WARNING_DAYS = 90, EXPIRY_CRITICAL_DAYS = 30)
   - pagination.ts               (DEFAULT_PAGE_SIZE = 20, MAX_PAGE_SIZE = 100)
   - maritime.ts                 (IMO_NUMBER_REGEX, MMSI_NUMBER_REGEX, dll)

4. utils/
   - date.utils.ts              (calculateDaysUntilDate, isExpired, formatMaritime)
   - certificate.utils.ts       (calculateCertificateExpiryStatus)
   - pagination.utils.ts        (buildPaginationMeta)

5. schemas/ (Zod — shared antara FE dan BE)
   - vessel.schema.ts           (createVesselSchema, updateVesselSchema)
   - pagination.schema.ts       (paginationQuerySchema)

Pastikan semua di-export dari packages/shared/src/index.ts
Pastikan apps/api dan apps/web bisa import dari @shared/*
```

---

## PROMPT 01-D — Tooling & Code Quality

> ✅ **SELESAI** — `.prettierrc`, `.eslintignore`, `.prettierrc`, `.husky/pre-commit`, `.lintstagedrc.js`, `.vscode/` semua ada. `no-console: warn` aktif.

```
Setup tooling lengkap untuk code quality dan developer experience.
Semua konfigurasi harus di packages/config/ agar bisa di-share.

1. packages/config/
   ├── eslint/
   │   ├── base.js           ← Base ESLint config
   │   ├── nestjs.js         ← NestJS-specific rules
   │   ├── nextjs.js         ← Next.js-specific rules
   │   └── index.js
   └── typescript/
       ├── base.json         ← Base tsconfig (strict mode)
       ├── nestjs.json       ← Extends base + NestJS settings
       └── nextjs.json       ← Extends base + Next.js settings

2. Root-level configs:
   - .prettierrc              ← Prettier config (semi: true, singleQuote: false, tabWidth: 2)
   - .eslintignore
   - .prettierignore
   - .husky/pre-commit        ← Run lint-staged
   - .lintstagedrc.js         ← ESLint + Prettier pada staged files

3. VSCode workspace settings (.vscode/):
   - settings.json            ← Format on save, ESLint auto-fix
   - extensions.json          ← Recommended extensions list
   - launch.json              ← Debug configs untuk API dan Web

ESLint rules yang wajib aktif:
- @typescript-eslint/no-explicit-any: error
- @typescript-eslint/explicit-function-return-type: error
- @typescript-eslint/no-unused-vars: error
- import/order: error (dengan groups yang benar)
- no-console: warn

Setelah setup, jalankan:
pnpm lint → harus 0 errors pada fresh project
pnpm format → harus format semua file
```

---

## Checklist Selesai Prompt 01

Sebelum lanjut ke Prompt 02, pastikan semua ini berfungsi:

```bash
# 1. Install dependencies
pnpm install                        # Harus sukses, 0 errors

# 2. Docker services up
docker compose up -d                # Semua services healthy
docker compose ps                   # Status: healthy

# 3. Dev servers start
pnpm dev                            # API: localhost:4000, Web: localhost:3000

# 4. Code quality
pnpm lint                           # 0 errors
pnpm format --check                 # 0 unformatted files

# 5. Import test
# Di apps/api/src/main.ts, coba import:
import { VesselStatus } from "@shared/enums";  # Harus resolve
```

**Jangan lanjut ke Prompt 02 sebelum checklist ini 100% hijau.**
