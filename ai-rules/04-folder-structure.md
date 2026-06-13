# 04 — Folder Structure

> **AI Instruction:** Ikuti struktur ini secara ketat. Jangan buat file di luar struktur ini tanpa alasan yang jelas. Setiap domain baru harus mengikuti pola yang sama.

---

## 4.1 Root Monorepo

```
maritime-fleet-erp/
├── apps/
│   ├── web/                    ← Next.js 14 App Router
│   └── api/                    ← NestJS Backend
├── packages/
│   ├── shared/                 ← Shared types, schemas, constants
│   ├── ui/                     ← Design system components
│   └── config/                 ← Shared TS/ESLint config
├── prisma/
│   ├── schema.prisma           ← Database schema
│   ├── migrations/             ← Generated migrations
│   └── seed/                   ← Seed scripts
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── nginx.conf
├── docs/
│   └── ai-rules/               ← File-file ini
├── .cursorrules                ← Entry point untuk Cursor
├── .windsurfrules              ← Entry point untuk Windsurf
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 4.2 Backend — NestJS (`apps/api/`)

```
apps/api/
├── src/
│   ├── main.ts                 ← Bootstrap, Swagger setup
│   ├── app.module.ts           ← Root module
│   │
│   ├── contexts/               ← Bounded contexts (domain utama)
│   │   ├── fleet/
│   │   ├── crew/
│   │   ├── voyage/
│   │   ├── technical/
│   │   ├── document/
│   │   ├── hsseq/
│   │   ├── financial/
│   │   ├── procurement/
│   │   ├── company/
│   │   └── iam/
│   │
│   ├── shared/                 ← Shared infrastructure
│   │   ├── database/           ← Prisma service, base repository
│   │   ├── guards/             ← Auth guards, RBAC guard
│   │   ├── interceptors/       ← Audit, transform, logging
│   │   ├── filters/            ← Global exception filters
│   │   ├── pipes/              ← Validation pipes
│   │   ├── decorators/         ← Custom decorators
│   │   ├── middleware/         ← Request middleware
│   │   └── utils/              ← Helpers, constants
│   │
│   └── config/                 ← App configuration
│       ├── database.config.ts
│       ├── jwt.config.ts
│       └── app.config.ts
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 4.3 Struktur Satu Bounded Context (Template Wajib)

Setiap domain mengikuti struktur ini **tanpa pengecualian**:

```
contexts/fleet/
├── fleet.module.ts             ← NestJS module definition
│
├── domain/                     ← Domain layer (pure TypeScript)
│   ├── entities/
│   │   ├── vessel.entity.ts    ← Aggregate root
│   │   └── flag-state.entity.ts
│   ├── value-objects/
│   │   ├── imo-number.vo.ts
│   │   └── vessel-status.vo.ts
│   ├── events/
│   │   ├── vessel-registered.event.ts
│   │   └── vessel-status-changed.event.ts
│   ├── exceptions/
│   │   ├── vessel-not-found.exception.ts
│   │   └── duplicate-imo.exception.ts
│   └── repositories/
│       └── vessel.repository.interface.ts  ← Interface only
│
├── application/                ← Application layer
│   ├── commands/
│   │   ├── register-vessel/
│   │   │   ├── register-vessel.command.ts
│   │   │   └── register-vessel.handler.ts
│   │   └── update-vessel-status/
│   │       ├── update-vessel-status.command.ts
│   │       └── update-vessel-status.handler.ts
│   ├── queries/
│   │   ├── get-vessel/
│   │   │   ├── get-vessel.query.ts
│   │   │   └── get-vessel.handler.ts
│   │   └── list-vessels/
│   │       ├── list-vessels.query.ts
│   │       └── list-vessels.handler.ts
│   ├── dtos/
│   │   ├── create-vessel.dto.ts
│   │   ├── update-vessel.dto.ts
│   │   └── vessel-response.dto.ts
│   └── services/
│       └── vessel-certificate.service.ts
│
├── infrastructure/             ← Infrastructure layer
│   ├── repositories/
│   │   └── prisma-vessel.repository.ts  ← Implements domain interface
│   ├── mappers/
│   │   └── vessel.mapper.ts    ← Entity ↔ Prisma model mapping
│   └── event-handlers/
│       └── vessel-registered.handler.ts
│
└── presentation/               ← Presentation layer
    ├── controllers/
    │   └── vessel.controller.ts
    └── swagger/
        └── vessel.swagger.ts   ← Swagger decorators
```

---

## 4.4 Frontend — Next.js (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/                    ← Next.js App Router
│   │   ├── (auth)/             ← Auth group (tidak ada layout ERP)
│   │   │   ├── login/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/        ← Protected ERP layout
│   │   │   ├── layout.tsx      ← ERP shell (sidebar, header)
│   │   │   ├── page.tsx        ← Dashboard utama
│   │   │   ├── fleet/
│   │   │   │   ├── page.tsx    ← Vessel list
│   │   │   │   ├── [vesselId]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── crew/
│   │   │   │   │   ├── documents/
│   │   │   │   │   └── maintenance/
│   │   │   ├── crew/
│   │   │   ├── voyage/
│   │   │   ├── technical/
│   │   │   ├── documents/
│   │   │   ├── hsseq/
│   │   │   ├── financial/
│   │   │   ├── procurement/
│   │   │   └── admin/
│   │   └── api/                ← Next.js API routes (minimal, proxy only)
│   │
│   ├── components/
│   │   ├── ui/                 ← shadcn/ui components (jangan edit)
│   │   ├── layout/             ← Sidebar, header, breadcrumb
│   │   ├── maritime/           ← Domain-specific components
│   │   │   ├── vessel-status-badge.tsx
│   │   │   ├── certificate-expiry-indicator.tsx
│   │   │   └── crew-rank-badge.tsx
│   │   ├── data-display/       ← Tables, cards, KPI widgets
│   │   │   ├── erp-data-table.tsx
│   │   │   ├── kpi-card.tsx
│   │   │   └── stat-panel.tsx
│   │   └── forms/              ← Reusable form components
│   │       ├── vessel-form.tsx
│   │       └── crew-form.tsx
│   │
│   ├── hooks/                  ← Custom React hooks
│   │   ├── use-vessels.ts
│   │   ├── use-crew.ts
│   │   └── use-auth.ts
│   │
│   ├── services/               ← API call functions
│   │   ├── api.client.ts       ← Axios instance
│   │   ├── fleet.service.ts
│   │   └── crew.service.ts
│   │
│   ├── stores/                 ← Zustand stores
│   │   ├── auth.store.ts
│   │   └── ui.store.ts         ← Sidebar state, theme, etc.
│   │
│   ├── lib/                    ← Utilities
│   │   ├── utils.ts
│   │   ├── date.ts
│   │   └── format.ts
│   │
│   └── types/                  ← Frontend-specific types
│       └── api.types.ts
│
├── public/
│   ├── fonts/
│   └── images/
├── .env.local
└── package.json
```

---

## 4.5 Shared Package (`packages/shared/`)

```
packages/shared/
├── src/
│   ├── types/
│   │   ├── vessel.types.ts
│   │   ├── crew.types.ts
│   │   ├── voyage.types.ts
│   │   └── api-response.types.ts
│   ├── schemas/                ← Zod schemas (shared FE & BE)
│   │   ├── vessel.schema.ts
│   │   └── crew.schema.ts
│   ├── constants/
│   │   ├── certificate-types.ts
│   │   ├── vessel-types.ts
│   │   └── port-functions.ts
│   └── enums/
│       ├── vessel-status.enum.ts
│       ├── crew-rank.enum.ts
│       └── document-status.enum.ts
├── package.json
└── tsconfig.json
```

---

## 4.6 Naming Rules (File & Folder)

```
# Folders → kebab-case
contexts/fleet/
contexts/crew/

# NestJS files → kebab-case.type.ts
vessel.controller.ts
vessel.service.ts
create-vessel.dto.ts
vessel-not-found.exception.ts

# React components → PascalCase.tsx
VesselCard.tsx
CrewTable.tsx
CertificateExpiryBadge.tsx

# React hooks → camelCase dengan prefix 'use'
use-vessels.ts
use-auth.ts

# Utility files → kebab-case.ts
format-date.ts
validate-imo.ts

# Zod schemas → kebab-case.schema.ts
vessel.schema.ts
create-vessel.schema.ts
```

---

## 4.7 File Size Limits

| Tipe File          | Max Baris | Tindakan jika melebihi        |
| ------------------ | --------- | ----------------------------- |
| Controller         | 150 baris | Pecah ke multiple controllers |
| Service / Use Case | 200 baris | Pecah ke sub-services         |
| Repository         | 250 baris | Pecah per query group         |
| React Component    | 200 baris | Pecah ke sub-components       |
| Prisma Schema      | —         | Tidak ada limit (satu file)   |

---

_Struktur ini berlaku untuk semua phase. Domain baru selalu mengikuti template di 4.3._
