# 15 — Scope & Phases

> **AI Instruction:** Ini adalah pagar scope. Jangan build apapun yang tidak ada di phase yang sedang aktif tanpa konfirmasi eksplisit. "Saya tambahkan sekalian" adalah anti-pattern yang harus dihindari.

---

## 15.1 Current Active Phase

```
┌─────────────────────────────────────┐
│         PHASE 1 — ACTIVE            │
│   Foundation & Core Infrastructure  │
└─────────────────────────────────────┘
```

Update file ini setiap kali phase berganti.

---

## 15.2 Phase 1 — Foundation (Active)

**Target durasi:** 8–10 minggu  
**Tujuan:** Sistem dapat login, manage company, manage vessels, track dokumen, dan tampilkan dashboard KPI dasar.

### ✅ Yang Harus Dibangun di Phase 1

#### Infrastructure
- [x] Monorepo setup (Turborepo + pnpm)
- [x] Docker Compose (PostgreSQL, Redis, MinIO, Nginx)
- [x] NestJS bootstrap + global middleware
- [x] Next.js bootstrap + ERP layout shell
- [x] Prisma setup + base schema
- [x] CI/CD pipeline dasar (GitHub Actions)

#### IAM Module
- [x] User registration & login (JWT)
- [x] Refresh token flow
- [x] Password reset via email
- [x] Role & permission management
- [x] RBAC guard implementation
- [x] Audit interceptor (global)

#### Company Module
- [x] CRUD company
- [x] Company settings
- [x] Multi-company isolation (middleware)

#### Fleet Module
- [x] CRUD vessel
- [x] Vessel status management (Active, Drydock, Laid-up)
- [x] Vessel certificate tracking (CRUD)
- [x] Certificate expiry alert (cron job, daily)
- [x] Vessel document upload (PDF, image)

#### Dashboard
- [x] Fleet overview KPIs (total vessels, active, drydock)
- [x] Certificate expiry summary widget
- [x] Alert panel (critical & expiring soon)

#### System
- [x] Swagger documentation (semua endpoint)
- [x] Global error handling
- [x] Request ID tracing
- [x] Basic logging (Winston)

### ❌ TIDAK Dibangun di Phase 1
- Crew management
- Voyage management
- PMS / Maintenance
- HSSEQ / ISM
- Financial
- Procurement
- Real-time features (WebSocket)
- Email notifications (hanya log ke console)
- Mobile responsiveness (desktop-first dulu)

---

## 15.3 Phase 2 — Operations

**Target durasi:** 10–12 minggu  
**Prerequisite:** Phase 1 selesai dan stable di staging.

### ✅ Yang Dibangun di Phase 2

#### Crew Management Module
- [ ] Seafarer CRUD (data pribadi, dokumen)
- [ ] STCW certificate tracking per seafarer
- [ ] Crew assignment (sign-on / sign-off)
- [ ] Manning list per vessel
- [ ] Certificate expiry alert untuk kru
- [ ] STCW compliance validation saat sign-on
- [ ] Crew contract management (basic)

#### Voyage Management Module
- [ ] Voyage planning (create, edit)
- [ ] Port of call management
- [ ] Voyage log (departure, arrival, noon report)
- [ ] Manning safety validation saat departure approval
- [ ] Compliance check sebelum departure
- [ ] Voyage status lifecycle (planned → active → completed)

#### Notification System
- [ ] Email notifications (certificate expiry, compliance alerts)
- [ ] In-app notification bell
- [ ] Notification preferences per user

#### Enhanced Dashboard
- [ ] Crew on board summary per vessel
- [ ] Voyage in progress tracker
- [ ] Manning compliance status

### ❌ TIDAK Dibangun di Phase 2
- PMS / Technical module
- HSSEQ module
- Financial module
- Procurement module
- Crew payroll
- AIS integration

---

## 15.4 Phase 3 — Compliance & Safety

**Target durasi:** 8–10 minggu  
**Prerequisite:** Phase 2 selesai.

### ✅ Yang Dibangun di Phase 3

#### Technical / PMS Module
- [ ] Equipment & component registry
- [ ] Planned maintenance job (by running hours / calendar)
- [ ] Work order management
- [ ] Defect reporting & tracking
- [ ] Maintenance history
- [ ] Dry dock planning (basic)
- [ ] Spare parts inventory (basic)

#### HSSEQ / ISM Module
- [ ] Incident & near miss reporting
- [ ] Incident investigation workflow
- [ ] Non-conformity tracking
- [ ] Corrective action plan (CAP)
- [ ] Internal audit management
- [ ] PSC inspection recording & deficiency tracking
- [ ] Drill record (fire, abandon ship, MOB)
- [ ] MARPOL Oil Record Book

#### MLC Compliance
- [ ] Rest hours recording per seafarer
- [ ] Rest hours violation detection & reporting

---

## 15.5 Phase 4 — Financial & Procurement

**Target durasi:** 10–12 minggu  
**Prerequisite:** Phase 3 selesai.

### ✅ Yang Dibangun di Phase 4

#### Financial Module
- [ ] Voyage cost estimate
- [ ] Disbursement account (port expenses)
- [ ] Crew payroll calculation
- [ ] Budget vs actual per voyage
- [ ] Basic financial reporting

#### Procurement Module
- [ ] Purchase requisition
- [ ] Purchase order
- [ ] Vendor management
- [ ] Goods receipt
- [ ] Inventory management (spare parts)
- [ ] Budget approval workflow

---

## 15.6 Phase 5 — Advanced & Integration

**Target durasi:** Open-ended  
**Prerequisite:** Phase 4 selesai.

### ✅ Yang Dibangun di Phase 5

#### External Integrations
- [ ] AIS real-time vessel tracking
- [ ] Port MIS integration (Indonesia)
- [ ] BKI / Class society API
- [ ] Weather data integration

#### Advanced Features
- [ ] Mobile app (React Native) — Seafarer self-service
- [ ] Offline sync (untuk vessel di laut)
- [ ] Advanced analytics & reporting
- [ ] Predictive maintenance (ML-based)
- [ ] Vessel performance monitoring (SEEMP)
- [ ] Carbon intensity reporting (CII)

---

## 15.7 Scope Decision Matrix

Ketika ada permintaan fitur baru, gunakan matrix ini:

```
Pertanyaan untuk evaluasi fitur baru:
│
├── Apakah ini ada di phase yang sedang aktif?
│   ├── YA → Build sesuai spec
│   └── TIDAK → Lanjut ke pertanyaan berikut
│
├── Apakah ini blocking untuk phase aktif?
│   ├── YA → Evaluasi ulang phase scope
│   └── TIDAK → Log sebagai backlog, jangan build sekarang
│
├── Apakah ini compliance requirement (ISM/STCW/SOLAS)?
│   ├── YA → Prioritaskan, masukkan ke phase terdekat
│   └── TIDAK → Masuk backlog normal
│
└── Apakah ini membutuhkan architecture change?
    ├── YA → Review file 02-architecture.md dulu
    └── TIDAK → Follow existing patterns
```

---

## 15.8 Feature Backlog (Ditemukan tapi Belum Dijadwalkan)

Catat fitur yang ditemukan selama development tapi belum masuk phase manapun:

| Feature | Ditemukan | Diusulkan oleh | Target Phase | Status |
|---|---|---|---|---|
| Bulk import crew via Excel | 2024-01 | — | Phase 2 | Backlog |
| Certificate renewal workflow | 2024-01 | — | Phase 2 | Backlog |
| Vessel comparison report | 2024-01 | — | Phase 3 | Backlog |
| Multi-language UI (EN/ID) | 2024-01 | — | Phase 5 | Backlog |
| Dark / Light theme toggle | 2024-01 | — | Phase 2 | Backlog |

---

## 15.9 Definition of Done (per Feature)

Sebuah fitur dinyatakan DONE jika memenuhi semua kriteria ini:

```
✅ Code sesuai conventions (05-code-conventions.md)
✅ Unit tests tersedia (coverage ≥ 80% untuk domain logic)
✅ Integration test untuk API endpoint
✅ Swagger documentation diupdate
✅ Error codes didaftarkan (13-error-handling.md)
✅ Audit trail diimplementasikan (jika write operation)
✅ RBAC permissions diterapkan
✅ Tidak ada console.log tersisa
✅ PR di-review minimal 1 orang
✅ Tested di staging environment
```

---

## 15.10 Anti-Patterns yang Harus Dihindari AI

```
❌ "Saya tambahkan juga fitur X sekalian karena relevan"
   → Hanya build yang diminta, tidak lebih

❌ "Untuk masa depan, lebih baik kita buat abstraksi ini dulu"
   → YAGNI — You Aren't Gonna Need It. Build for now.

❌ "Saya skip test dulu, bisa ditambah nanti"
   → Test wajib bersamaan dengan implementasi (14-testing-strategy.md)

❌ "Saya gunakan library X yang lebih bagus dari yang di tech stack"
   → Hanya gunakan library yang ada di 03-tech-stack.md

❌ "Saya refactor modul Y sambil jalan karena strukturnya tidak ideal"
   → Refactor butuh PR tersendiri, bukan digabung dengan feature PR

❌ "Saya implementasikan fase 2 sekalian karena sudah kepikiran"
   → Satu phase, satu focus. Build for the current phase only.
```

---

*File ini adalah kontrak scope. Update checklist phase setiap kali item selesai. Update "Current Active Phase" setiap kali phase berganti.*
