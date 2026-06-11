# 10 — UI Design System

> **AI Instruction:** UI ini adalah Enterprise Maritime ERP — dense information, bukan consumer app. Terinspirasi dari DANAOS dan Sertica. Bukan dashboard startup. Bukan card-card besar dengan whitespace berlebih. Prioritas: data density, readability, efisiensi workflow.

---

## 10.1 Design Philosophy

### Enterprise Dense Information Design
```
✅ Yang benar (DANAOS-style):
- Data table dengan 15+ kolom
- Multiple panels dalam satu layar
- Sidebar navigasi dengan sub-menu
- Status indicators compact
- Form dengan banyak field dalam satu view
- Breadcrumb yang selalu visible

❌ Yang salah (Consumer app style):
- Card besar dengan satu data
- Whitespace berlebih
- Animasi berlebihan
- Single-column layout
- Full-screen modal untuk form sederhana
```

---

## 10.2 Color System

```css
/* Maritime ERP Color Palette */
:root {
  /* Primary — Navy Maritime */
  --color-primary-950: #0a0f1a;
  --color-primary-900: #0d1526;
  --color-primary-800: #112040;
  --color-primary-700: #162d5a;
  --color-primary-600: #1a3a73;
  --color-primary-500: #1e4699;
  --color-primary-400: #2563eb;
  --color-primary-300: #60a5fa;
  --color-primary-200: #bfdbfe;
  --color-primary-100: #dbeafe;

  /* Background */
  --color-bg-canvas: #0f1623;       /* Halaman utama */
  --color-bg-surface: #161f2e;      /* Panel / card */
  --color-bg-elevated: #1d2a3e;     /* Modal, dropdown */
  --color-bg-overlay: #243452;      /* Hover state */

  /* Borders */
  --color-border-default: #243452;
  --color-border-subtle: #1a2640;
  --color-border-emphasis: #2563eb;

  /* Text */
  --color-text-primary: #e2e8f0;
  --color-text-secondary: #94a3b8;
  --color-text-tertiary: #64748b;
  --color-text-disabled: #475569;

  /* Status — Maritime Semantic Colors */
  --color-status-valid: #22c55e;       /* Certificate valid */
  --color-status-warning: #f59e0b;     /* Expiring soon (90d) */
  --color-status-critical: #f97316;    /* Critical (30d) */
  --color-status-danger: #ef4444;      /* Expired / danger */
  --color-status-info: #3b82f6;        /* Information */
  --color-status-neutral: #64748b;     /* Inactive / laid-up */

  /* Vessel Status */
  --color-vessel-active: #22c55e;
  --color-vessel-drydock: #f59e0b;
  --color-vessel-laidup: #94a3b8;
  --color-vessel-scrapped: #64748b;
}
```

---

## 10.3 Typography

```css
/* Font Stack */
--font-mono: "JetBrains Mono", "Fira Code", monospace;   /* Angka, kode, IMO */
--font-ui: "Inter", -apple-system, sans-serif;             /* UI elements */
--font-data: "IBM Plex Sans", "Inter", sans-serif;         /* Data tables */

/* Type Scale */
--text-xs: 0.6875rem;    /* 11px — Table compact data */
--text-sm: 0.75rem;      /* 12px — Table normal, labels */
--text-base: 0.875rem;   /* 14px — Body text, form fields */
--text-md: 1rem;         /* 16px — Section headings */
--text-lg: 1.125rem;     /* 18px — Page titles */
--text-xl: 1.25rem;      /* 20px — Dashboard KPI values */
--text-2xl: 1.5rem;      /* 24px — Hero numbers */
```

---

## 10.4 Layout System

### ERP Shell Layout
```tsx
// Struktur layout utama ERP
<div className="flex h-screen bg-[var(--color-bg-canvas)] overflow-hidden">
  {/* Sidebar — 240px, collapsible ke 64px */}
  <Sidebar className="w-60 flex-shrink-0" />

  <div className="flex flex-col flex-1 overflow-hidden">
    {/* Top bar — 48px height */}
    <TopBar className="h-12 flex-shrink-0" />

    {/* Main content area */}
    <main className="flex-1 overflow-auto p-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-3" />

      {/* Page content */}
      {children}
    </main>
  </div>
</div>
```

### Page Layout Patterns

```tsx
// Pattern 1: Full table page (Vessel List, Crew List)
<PageLayout>
  <PageHeader title="Daftar Armada" subtitle="47 kapal terdaftar">
    <FilterBar />
    <Button>+ Tambah Kapal</Button>
  </PageHeader>
  <DataTable columns={vesselColumns} data={vessels} />
</PageLayout>

// Pattern 2: Split panel (Detail page)
<PageLayout>
  <PageHeader title="MV Nusantara Jaya" badge={<VesselStatusBadge />} />
  <div className="grid grid-cols-3 gap-3">
    <div className="col-span-1 space-y-3">
      {/* Info panels */}
      <InfoPanel title="Data Kapal" data={vesselData} />
      <InfoPanel title="Sertifikasi" data={certificates} />
    </div>
    <div className="col-span-2">
      {/* Main content — tabs */}
      <Tabs>
        <Tab label="Manning">...</Tab>
        <Tab label="Pelayaran">...</Tab>
        <Tab label="Maintenance">...</Tab>
      </Tabs>
    </div>
  </div>
</PageLayout>

// Pattern 3: Dashboard
<PageLayout>
  <KpiRow metrics={fleetKpis} />
  <div className="grid grid-cols-3 gap-3 mt-3">
    <AlertPanel className="col-span-1" />
    <VesselStatusMap className="col-span-2" />
  </div>
  <div className="grid grid-cols-2 gap-3 mt-3">
    <CertificateExpiryWidget />
    <RecentVoyagesWidget />
  </div>
</PageLayout>
```

---

## 10.5 Component Specifications

### Data Table (Core Component)
```tsx
// Spesifikasi untuk ERP Data Table
interface ErpDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  pagination: PaginationState;
  totalRows: number;
  isLoading?: boolean;
  onPaginationChange: (state: PaginationState) => void;
  onRowClick?: (row: T) => void;
  selectedRows?: string[];
  onSelectionChange?: (ids: string[]) => void;
  stickyHeader?: boolean;      // Default: true
  compact?: boolean;            // Default: true (dense mode)
  rowHeight?: "compact" | "normal"; // Default: "compact" (32px)
}

// CSS untuk dense table
.erp-table {
  font-size: var(--text-sm);     /* 12px */
  
  th {
    height: 32px;
    padding: 0 8px;
    background: var(--color-bg-elevated);
    color: var(--color-text-secondary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: var(--text-xs);
  }
  
  td {
    height: 36px;           /* compact row height */
    padding: 0 8px;
    border-bottom: 1px solid var(--color-border-subtle);
    white-space: nowrap;
  }
  
  tr:hover td {
    background: var(--color-bg-overlay);
    cursor: pointer;
  }
}
```

### Status Badges
```tsx
// Certificate status badge
const CertificateStatusBadge = ({ status }: { status: CertificateStatus }) => {
  const config = {
    VALID: { color: "green", label: "Valid", icon: CheckCircle },
    EXPIRING_SOON: { color: "yellow", label: "Segera Expired", icon: AlertTriangle },
    CRITICAL: { color: "orange", label: "Kritis", icon: AlertOctagon },
    EXPIRED: { color: "red", label: "Expired", icon: XCircle },
    PENDING_RENEWAL: { color: "blue", label: "Proses Renewal", icon: Clock },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
      bg-${config.color}-500/10 text-${config.color}-400 border border-${config.color}-500/20`}>
      <config.icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};
```

### KPI Cards (Dashboard)
```tsx
// Compact KPI card — bukan besar-besar
const KpiCard = ({ title, value, unit, trend, status }: KpiCardProps) => (
  <div className="bg-surface border border-border rounded p-3">
    <div className="text-xs text-secondary uppercase tracking-wider mb-1">{title}</div>
    <div className="flex items-end gap-1">
      <span className="text-2xl font-mono font-bold text-primary">{value}</span>
      {unit && <span className="text-sm text-secondary mb-0.5">{unit}</span>}
    </div>
    {trend && <TrendIndicator value={trend} />}
  </div>
);
```

### Info Panel (Detail view)
```tsx
// Dense info panel — label: value pairs
const InfoPanel = ({ title, fields }: InfoPanelProps) => (
  <div className="bg-surface border border-border rounded">
    <div className="px-3 py-2 border-b border-border">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
    </div>
    <div className="divide-y divide-border">
      {fields.map(({ label, value }) => (
        <div key={label} className="flex items-center px-3 py-1.5">
          <span className="text-xs text-secondary w-40 flex-shrink-0">{label}</span>
          <span className="text-xs text-primary font-medium">{value ?? "—"}</span>
        </div>
      ))}
    </div>
  </div>
);
```

---

## 10.6 Navigation Structure

```
Sidebar Navigation:
├── 🏠 Dashboard
├── 🚢 Armada
│   ├── Daftar Kapal
│   ├── Sertifikat Kapal
│   └── Dokumen Kapal
├── 👨‍✈️ Kru
│   ├── Daftar Seafarer
│   ├── Manning List
│   ├── Sertifikat Kru
│   └── Rotasi & Kontrak
├── ⚓ Pelayaran
│   ├── Daftar Voyage
│   ├── Port Call Log
│   └── Log Book
├── 🔧 Teknikal
│   ├── Planned Maintenance
│   ├── Work Orders
│   ├── Defect List
│   └── Dry Dock
├── ⚠️ HSSEQ
│   ├── Insiden & Near Miss
│   ├── Audit Internal
│   ├── PSC Inspection
│   └── Drill Record
├── 💰 Keuangan      [Phase 4]
├── 📦 Pengadaan     [Phase 4]
└── ⚙️ Administrasi
    ├── Pengguna
    ├── Peran & Izin
    └── Konfigurasi
```

---

## 10.7 UI Rules yang Tidak Boleh Dilanggar

```
❌ JANGAN gunakan whitespace > 24px antar section dalam satu page
❌ JANGAN buat modal full-screen untuk form simple (gunakan slide-over panel)
❌ JANGAN gunakan font > 18px untuk data display
❌ JANGAN sembunyikan data penting di balik klik/hover
❌ JANGAN gunakan animasi yang > 200ms untuk transisi UI
❌ JANGAN buat loading state yang blok seluruh screen (gunakan skeleton inline)

✅ SELALU tunjukkan status kapal/sertifikat dengan warna yang konsisten
✅ SELALU tampilkan breadcrumb pada halaman lebih dari 1 level
✅ SELALU gunakan monospace font untuk angka teknis (GT, IMO, koordinat)
✅ SELALU tampilkan "terakhir diupdate" pada data kritis
✅ SELALU sediakan export ke Excel/PDF pada setiap data table utama
```

---

*UI ini untuk maritim professional, bukan untuk konsumen umum. Kepadatan informasi adalah fitur, bukan bug.*
