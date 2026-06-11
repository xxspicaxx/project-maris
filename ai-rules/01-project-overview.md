# 01 — Project Overview

> **AI Instruction:** Baca file ini sebelum menulis kode apapun. Ini adalah konteks bisnis dan teknis tertinggi dari sistem ini.

---

## 1.1 Nama & Identitas Sistem

| Atribut | Nilai |
|---|---|
| **Nama Sistem** | Maritime Fleet ERP |
| **Kode Proyek** | `mf-erp` |
| **Kategori** | Enterprise Resource Planning — Maritime Industry |
| **Target Pasar** | Perusahaan pelayaran Indonesia & regional (ASEAN) |
| **Benchmark** | DANAOS Enterprise, Sertica, Helm CONNECT |

---

## 1.2 Tujuan Sistem

Maritime Fleet ERP adalah platform manajemen armada kapal berbasis web yang dirancang untuk:

1. **Mengintegrasikan** seluruh operasional armada dalam satu platform terpusat
2. **Memastikan kepatuhan** terhadap regulasi IMO (ISM, STCW, SOLAS, MARPOL, MLC 2006)
3. **Mendukung multi-perusahaan** (holding & anak perusahaan) dalam satu instance
4. **Menyediakan visibilitas real-time** terhadap status armada, kru, dan sertifikasi
5. **Mengurangi risiko PSC deficiency** melalui alert proaktif dan dokumentasi terstruktur

---

## 1.3 Pengguna Sistem (Personas)

| Persona | Peran | Kebutuhan Utama |
|---|---|---|
| **Fleet Manager** | Manajer armada perusahaan | Dashboard KPI armada, laporan compliance |
| **Ship Master** | Nakhoda kapal | Log pelayaran, laporan kejadian, permintaan suku cadang |
| **Chief Officer** | Mualim I | Manajemen kru, sertifikasi, drill record |
| **Port Agent** | Agen pelabuhan | Dokumen clearance, manifest |
| **Crewing Officer** | HRD maritim | Rekrutmen, rotasi, payroll kru |
| **Technical Superintendent** | Pengawas teknis | PMS, defect, dry dock planning |
| **ISM / HSSEQ Manager** | Manajer keselamatan | Audit, near miss, non-conformity |
| **Finance Officer** | Keuangan | Voyage cost, disbursement account |
| **System Admin** | IT admin | User management, konfigurasi sistem |

---

## 1.4 Arsitektur Bisnis — Multi-Company & Multi-Vessel

```
┌─────────────────────────────────────────┐
│           HOLDING COMPANY               │
│    (Tenant Level — Company Group)       │
├─────────────────┬───────────────────────┤
│  COMPANY A      │  COMPANY B            │
│  (Ship Owner)   │  (Ship Manager)       │
├────────┬────────┼────────┬──────────────┤
│Vessel 1│Vessel 2│Vessel 3│  Vessel 4    │
│MV Nusa │MV Arta │MV Jaya │  MV Sentosa  │
└────────┴────────┴────────┴──────────────┘
```

- Satu **instance** sistem dapat melayani banyak perusahaan (multi-tenant)
- Setiap perusahaan mengelola armadanya sendiri dengan isolasi data penuh
- Holding dapat melihat agregat lintas perusahaan (read-only)

---

## 1.5 Modul Sistem (Domain Utama)

```
Maritime Fleet ERP
│
├── 🚢 Fleet Management          ← Registrasi & status armada
├── 👨‍✈️ Crew Management          ← Manajemen SDM pelaut
├── ⚓ Voyage Management         ← Perencanaan & log pelayaran
├── 🔧 Technical / PMS          ← Planned Maintenance System
├── 📄 Document Management      ← Sertifikat & dokumen kapal
├── ⚠️  HSSEQ / ISM             ← Safety, audit, incident
├── 💰 Financial Management     ← Voyage cost, disbursement
├── 📦 Procurement              ← Pembelian suku cadang & consumable
├── 🏢 Company Administration   ← Multi-company management
└── ⚙️  System Administration   ← User, role, konfigurasi
```

---

## 1.6 Fase Pengembangan

```
PHASE 1 — Foundation (MVP Core)
├── Company & Vessel Registry
├── User Management & RBAC
├── Dashboard & KPI
└── Basic Document Tracking

PHASE 2 — Operations
├── Crew Management (STCW Compliance)
├── Voyage Management
├── Basic PMS
└── Notification & Alert System

PHASE 3 — Compliance & Safety
├── ISM / HSSEQ Module
├── Audit Management
├── Incident Reporting
└── PSC Inspection Tracking

PHASE 4 — Financial & Procurement
├── Voyage Cost Management
├── Disbursement Account
├── Procurement & Inventory
└── Budget vs Actual

PHASE 5 — Advanced & Integration
├── AIS Integration
├── Port MIS Integration
├── BKI / Class API
└── Mobile App (Seafarer)
```

---

## 1.7 Prinsip Non-Negosiable

AI **wajib** memahami dan menerapkan prinsip berikut dalam setiap keputusan:

1. **Data Isolation** — Data antar company tidak boleh bocor dalam kondisi apapun
2. **Audit Everything** — Setiap perubahan data harus tercatat (siapa, kapan, dari mana)
3. **Compliance First** — Validasi regulasi maritim adalah business rule, bukan optional
4. **Performance** — Sistem harus responsif untuk data armada ratusan kapal
5. **Offline Resilience** — Kapal di lautan; sistem harus handle data sync dengan graceful

---

## 1.8 Referensi Sistem Benchmark

| Sistem | Vendor | Yang Dipelajari |
|---|---|---|
| **DANAOS Enterprise** | Danaos Corp | UI density, modul struktur, workflow |
| **Sertica** | Logimatic | PMS, maintenance workflow |
| **Helm CONNECT** | Helm Operations | UX maritim, crew management |
| **AMOS** | Bass Software | Technical management depth |
| **MarinerPlus** | — | Crewing module structure |

---

*File ini adalah konteks bisnis tertinggi. Jangan build fitur yang tidak ada di modul 1.5 tanpa konfirmasi eksplisit.*
