# Maritime Fleet ERP — Master Prompt Playbook

> Kumpulan prompt lengkap dari inisiasi proyek hingga production deployment.
> Gunakan secara berurutan. Setiap prompt dirancang untuk Cursor AI / Windsurf / Claude.

---

## Cara Penggunaan

1. Baca konteks setiap prompt sebelum mengirimkan ke AI
2. Pastikan `.cursorrules` sudah ada di root project sebelum mulai
3. Setiap prompt mengasumsikan prompt sebelumnya sudah selesai
4. Tanda `[GANTI: ...]` berarti isi dengan nilai aktual proyek kamu

---

## Daftar Prompt

| #   | File                         | Tahap                                       | Estimasi Waktu |
| --- | ---------------------------- | ------------------------------------------- | -------------- |
| 01  | `01-project-init.md`         | Setup monorepo, Docker, tooling             | 2–3 jam        |
| 02  | `02-database-foundation.md`  | Prisma schema + seed + migrations           | 2–3 jam        |
| 03  | `03-backend-foundation.md`   | NestJS bootstrap, shared infrastructure     | 3–4 jam        |
| 04  | `04-iam-module.md`           | Auth, JWT, User, Role, RBAC                 | 4–5 jam        |
| 05  | `05-fleet-module.md`         | Vessel CRUD, certificates, documents        | 4–5 jam        |
| 06  | `06-frontend-foundation.md`  | Next.js ERP shell, design system, routing   | 3–4 jam        |
| 07  | `07-dashboard.md`            | Dashboard KPI, alert panel, widgets         | 3–4 jam        |
| 08  | `08-crew-module.md`          | Seafarer, STCW certs, sign-on/off           | 5–6 jam        |
| 09  | `09-voyage-module.md`        | Voyage planning, port call, log, compliance | 4–5 jam        |
| 10  | `10-technical-pms.md`        | PMS, work orders, defect tracking           | 4–5 jam        |
| 11  | `11-hsseq-module.md`         | Incident, audit, PSC, drill                 | 4–5 jam        |
| 12  | `12-notification-system.md`  | Email alerts, in-app notifications, cron    | 2–3 jam        |
| 13  | `13-testing-suite.md`        | Unit tests, integration tests, E2E          | 4–5 jam        |
| 14  | `14-production-hardening.md` | Security, performance, logging, monitoring  | 3–4 jam        |
| 15  | `15-deployment.md`           | Docker production, CI/CD, go-live checklist | 3–4 jam        |

**Total estimasi: 50–65 jam development**

---

## Prasyarat Sebelum Mulai

```bash
# Tools yang harus sudah terinstall
node --version    # >= 20.0.0
pnpm --version    # >= 8.0.0
docker --version  # >= 24.0.0
git --version     # >= 2.40.0
```

---

_Semua prompt mengacu pada rules di `docs/ai-rules/`. Pastikan folder tersebut ada._
