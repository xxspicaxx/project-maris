# 03 — Tech Stack

> **AI Instruction:** Hanya gunakan library yang ada di daftar ini. Jika butuh library baru, tambahkan ke daftar ini dengan alasan yang jelas — jangan langsung install tanpa konfirmasi.

---

## 3.1 Core Stack

| Layer | Teknologi | Versi | Alasan |
|---|---|---|---|
| **Frontend Framework** | Next.js | 14.x (App Router) | SSR, RSC, enterprise-ready |
| **Backend Framework** | NestJS | 10.x | Modular, DI, enterprise patterns |
| **Database** | PostgreSQL | 16.x | ACID, relational, enterprise |
| **ORM** | Prisma | 5.x | Type-safe, migrations, multi-schema |
| **Container** | Docker + Compose | latest | Reproducible environment |
| **Language** | TypeScript | 5.x (strict) | Type safety across full stack |

---

## 3.2 Frontend (Next.js)

### UI & Styling
| Library | Versi | Kegunaan |
|---|---|---|
| `tailwindcss` | 3.x | Utility-first CSS |
| `shadcn/ui` | latest | Komponen dasar (accessible, unstyled base) |
| `radix-ui` | latest | Headless primitives (via shadcn) |
| `lucide-react` | latest | Icon system |
| `class-variance-authority` | latest | Component variant management |
| `clsx` + `tailwind-merge` | latest | Conditional class merging |

### Data & State
| Library | Versi | Kegunaan |
|---|---|---|
| `@tanstack/react-query` | 5.x | Server state, caching, sync |
| `zustand` | 4.x | Client state (UI state only) |
| `axios` | 1.x | HTTP client |
| `zod` | 3.x | Schema validation (shared dengan backend) |

### Tables & Data Display
| Library | Versi | Kegunaan |
|---|---|---|
| `@tanstack/react-table` | 8.x | Enterprise data tables |
| `recharts` | 2.x | Charts & KPI visualization |

### Forms
| Library | Versi | Kegunaan |
|---|---|---|
| `react-hook-form` | 7.x | Form management |
| `@hookform/resolvers` | latest | Zod integration untuk forms |

### Utilities
| Library | Versi | Kegunaan |
|---|---|---|
| `date-fns` | 3.x | Date manipulation |
| `dayjs` | latest | Lightweight date (untuk display) |
| `numeral` | latest | Number formatting |

---

## 3.3 Backend (NestJS)

### Core NestJS Modules
| Package | Kegunaan |
|---|---|
| `@nestjs/core` | Framework core |
| `@nestjs/common` | Decorators, pipes, guards |
| `@nestjs/config` | Environment configuration |
| `@nestjs/jwt` | JWT authentication |
| `@nestjs/passport` | Auth strategies |
| `@nestjs/event-emitter` | Internal domain events |
| `@nestjs/swagger` | API documentation |
| `@nestjs/schedule` | Cron jobs (certificate expiry check) |
| `@nestjs/cache-manager` | Redis caching |
| `@nestjs/throttler` | Rate limiting |

### Database & Validation
| Package | Kegunaan |
|---|---|
| `@prisma/client` | Database client |
| `prisma` | ORM & migration CLI |
| `class-validator` | DTO validation |
| `class-transformer` | DTO transformation |
| `zod` | Shared schema validation |

### Security & Auth
| Package | Kegunaan |
|---|---|
| `bcrypt` | Password hashing |
| `passport-jwt` | JWT strategy |
| `passport-local` | Local auth strategy |
| `helmet` | HTTP security headers |

### Utilities
| Package | Kegunaan |
|---|---|
| `uuid` | UUID generation |
| `date-fns` | Date manipulation |
| `winston` | Logging |
| `nest-winston` | NestJS winston integration |
| `winston-daily-rotate-file` | Daily log rotation for Winston |
| `@aws-sdk/client-s3` | S3 SDK client for MinIO storage integration |
| `nodemailer` | SMTP client library for emails |

---

## 3.4 Infrastructure

| Teknologi | Kegunaan |
|---|---|
| **Redis** | Session cache, rate limiting, pub/sub |
| **MinIO** (S3-compatible) | File storage (dokumen, sertifikat) |
| **Nginx** | Reverse proxy, SSL termination |
| **Bull** (Redis-based) | Job queue (email, reports, sync) |

---

## 3.5 Development Tools

| Tool | Kegunaan |
|---|---|
| **ESLint** | Linting (config: `@typescript-eslint/strict`) |
| **Prettier** | Code formatting |
| **Husky** | Git hooks |
| **lint-staged** | Pre-commit linting |
| **Jest** | Unit & integration testing |
| **Playwright** | E2E testing |
| **Storybook** | UI component development & docs |

---

## 3.6 Versi Node & Package Manager

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "pnpm@8.x"
}
```

**Gunakan `pnpm`** — lebih cepat, disk efficient, hoisting yang lebih aman untuk monorepo.

---

## 3.7 Monorepo Structure

```
project-root/
├── apps/
│   ├── web/          ← Next.js frontend
│   └── api/          ← NestJS backend
├── packages/
│   ├── shared/       ← Shared types, DTOs, Zod schemas
│   ├── ui/           ← Shared UI components (design system)
│   └── config/       ← Shared ESLint, TS configs
├── prisma/           ← Schema & migrations (di root)
├── docker/           ← Dockerfile per service
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json        ← Turborepo build orchestration
```

**Build system:** Turborepo — untuk parallel builds dan caching.

---

## 3.8 Environment Variables (Wajib)

```bash
# apps/api/.env

# App
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/maritime_erp

# JWT
JWT_SECRET=<secret-min-32-chars>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_URL=redis://localhost:6379

# Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=<key>
MINIO_SECRET_KEY=<secret>
MINIO_BUCKET=maritime-docs

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=<password>
```

```bash
# apps/web/.env.local

NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=http://localhost:3000
```

---

## 3.9 Library yang DILARANG (Jangan Install)

| Library | Alasan |
|---|---|
| `moment.js` | Deprecated, besar; gunakan `date-fns` |
| `lodash` (full) | Gunakan native ES6+ atau import per-method |
| `jquery` | Tidak relevan dengan React |
| `express` | Backend harus NestJS |
| `sequelize` / `typeorm` | ORM harus Prisma |
| `material-ui` / `antd` | UI library harus shadcn/ui |
| `redux` | State harus Zustand + React Query |
| `axios` di server-side NestJS | Gunakan `@nestjs/axios` atau `fetch` native |

---

*Update file ini setiap kali ada keputusan penambahan library baru.*
