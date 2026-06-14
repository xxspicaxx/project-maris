# Prompt 07 — Dashboard & Fleet Vessels Page

**Tahap:** Dashboard KPI, alert panel, compliance widgets, vessel list page  
**Prerequisite:** Prompt 06 selesai — ERP shell berfungsi, API client ready  
**Output:** Dashboard fully functional dengan real data + halaman daftar kapal

> **Status: ⚠️ SEBAGIAN SELESAI**  
> `apps/web/src/app/(dashboard)/dashboard/page.tsx` (dashboard page) dan `apps/web/src/app/(dashboard)/fleet/page.tsx` (fleet list) sudah ada. Backend dashboard service dan hooks juga ada. **Yang belum:** Dashboard widget components (AlertPanel, VesselStatusChart, RecentActivityPanel, UpcomingExpiryPanel) di `components/dashboard/`, halaman detail vessel, design system components yang diperlukan (KpiCard, ErpDataTable, dll masih kosong).

---

## PROMPT 07-A — Dashboard Page Layout

> ⚠️ **SEBAGIAN** — `apps/web/src/app/(dashboard)/dashboard/page.tsx` tersedia dengan struktur layout KPI, alert, chart sections. **Belum ada:** Widget components (AlertPanel, VesselStatusChart, RecentActivityPanel, UpcomingExpiryPanel) di folder `components/dashboard/`.

```
Buat halaman Dashboard utama untuk Maritime Fleet ERP.
Baca docs/ai-rules/10-ui-design-system.md section 10.4 Pattern 3 untuk layout.
TIDAK ADA hardcoded/mock data — semua dari API via React Query hooks.
TIDAK ADA whitespace berlebih — ini enterprise dense dashboard.

File: apps/web/src/app/(dashboard)/page.tsx

DATA SOURCES:
- GET /api/v1/vessels/compliance-summary  → KPI cards + alert counts
- GET /api/v1/voyage/active               → Active voyages widget
- GET /api/v1/notifications?unread=true   → Alert panel
- GET /api/v1/audit/recent?limit=10       → Recent activity

LAYOUT (3 sections, top to bottom):

────────────────────────────────────────────────────────
SECTION 1 — KPI Row (4 cards, equal width)
────────────────────────────────────────────────────────

<div className="grid grid-cols-4 gap-3 mb-4">
  <KpiCard
    title="Total Armada"
    value={summary.totalVessels}
    unit="kapal"
    status="neutral"
    icon={Ship}
  />
  <KpiCard
    title="Beroperasi"
    value={summary.activeVessels}
    unit="kapal"
    status="good"
    icon={Anchor}
    trend={{ value: summary.drydockVessels, label: "dok kering" }}
  />
  <KpiCard
    title="Sertifikat Kritis"
    value={summary.certificates.critical + summary.certificates.expired}
    unit="item"
    status={criticalCount > 0 ? "danger" : "good"}
    icon={AlertTriangle}
  />
  <KpiCard
    title="Compliance Rate"
    value={summary.complianceRate.toFixed(1)}
    unit="%"
    status={rate >= 90 ? "good" : rate >= 75 ? "warning" : "danger"}
    icon={ShieldCheck}
  />
</div>

────────────────────────────────────────────────────────
SECTION 2 — Main widgets (3:2 split)
────────────────────────────────────────────────────────

<div className="grid grid-cols-5 gap-3 mb-4">
  <div className="col-span-3">
    <AlertPanel />               ← Sertifikat critical & expiring
  </div>
  <div className="col-span-2">
    <VesselStatusChart />        ← Donut chart + breakdown list
  </div>
</div>

────────────────────────────────────────────────────────
SECTION 3 — Bottom widgets (1:1 split)
────────────────────────────────────────────────────────

<div className="grid grid-cols-2 gap-3">
  <RecentActivityPanel />       ← Audit log terbaru
  <UpcomingExpiryPanel />       ← 10 cert yang mau expired
</div>
```

---

## PROMPT 07-B — Dashboard Component Details

> ❌ **BELUM SELESAI** — Semua widget komponen (AlertPanel, VesselStatusChart, RecentActivityPanel, UpcomingExpiryPanel) belum dibuat. Folder `components/dashboard/` belum ada.

```
Buat semua widget komponen untuk dashboard.
Setiap komponen punya loading skeleton dan error state sendiri.
Data fetch per komponen — bukan satu big fetch di parent.

1. components/dashboard/AlertPanel.tsx

   Data: useQuery({ queryKey: ["compliance-summary"],
                    queryFn: getComplianceSummary,
                    refetchInterval: 5 * 60 * 1000 })

   VISUAL SPEC (dense list, seperti email inbox):

   Header: "⚠ Alert Kepatuhan" [badge: total count] [refresh icon]

   List (sorted: EXPIRED → CRITICAL → EXPIRING_SOON):
   ┌───────────────────────────────────────────────────────────┐
   │ ● [EXPIRED]       MV Nusantara 1 · SMC · Expired 5 hr lalu│ ← row: 40px
   │ ● [KRITIS]        MV Sentosa Star · IOPP · 12 hari lagi   │
   │ ● [KRITIS]        MV Armada 3 · ISSC · 18 hari lagi       │
   │ ● [SEGERA HABIS]  MV Nusantara 2 · Load Line · 45 hr lagi │
   └───────────────────────────────────────────────────────────┘

   Setiap row:
   - Klik → navigate ke /fleet/vessels/{vesselId}?tab=certificates
   - Warna dot: merah (expired), oranye (critical), kuning (expiring)
   - Vessel name: bold 12px, cert type + waktu: secondary 11px
   - Max 15 items, footer: "X alert aktif — Lihat Semua →"

   Empty state (semua OK):
   ✅ icon + "Semua sertifikat dalam kondisi baik" (green tinted bg)

2. components/dashboard/VesselStatusChart.tsx

   Gunakan recharts PieChart (donut style).

   Warna sesuai VesselStatus dari design system:
   ACTIVE → #22c55e, DRYDOCK → #f59e0b, LAID_UP → #94a3b8, SCRAPPED → #64748b

   Layout:
   - Donut chart center: total vessel count
   - Di bawah chart: breakdown list (status + count + warna dot)
   - No animation berlebihan (reducedMotion friendly)

3. components/dashboard/RecentActivityPanel.tsx

   Data: GET /api/v1/audit/recent?limit=10

   List item:
   [icon action] [resource] [id singkat] · [user] · [time ago]

   CREATE → PlusCircle (biru)
   UPDATE → PencilLine (kuning)
   DELETE → Trash2 (merah)
   LOGIN  → LogIn (hijau)

   Time ago: gunakan date-fns formatDistanceToNow()
   Max 10 items, height fixed dengan internal scroll

4. components/dashboard/UpcomingExpiryPanel.tsx

   Data: GET /api/v1/vessels/certificates?status=EXPIRING_SOON,CRITICAL&limit=10

   List item:
   [vessel name] · [cert type] · [expiry date] · [days badge]

   Days badge: kuning jika >30 hari, oranye jika ≤30 hari
   Sorted: soonest expiry first
   Klik → navigasi ke sertifikat

5. Skeleton loading untuk semua widgets:
   - Saat isLoading: tampilkan skeleton lines (bukan spinner)
   - Animate: pulse (tailwind animate-pulse)
   - Match jumlah skeleton dengan expected content count
```

---

## PROMPT 07-C — Fleet Vessels List Page

> ⚠️ **SEBAGIAN** — `apps/web/src/app/(dashboard)/fleet/page.tsx` tersedia dengan struktur dasar. **Belum selesai:** ErpDataTable component belum ada, filter bar, URL state sync, dialog tambah kapal (slide-over), bulk action bar.

```
Buat halaman Daftar Kapal — core page paling sering digunakan.
Baca docs/ai-rules/10-ui-design-system.md section 10.5 untuk ErpDataTable spec.

File: apps/web/src/app/(dashboard)/fleet/vessels/page.tsx

FULL LAYOUT:

┌─ PageHeader ────────────────────────────────────────────────┐
│ Daftar Armada          [47 kapal]          [Filter▼] [+Tambah]│
└─────────────────────────────────────────────────────────────┘
┌─ Filter Bar ────────────────────────────────────────────────┐
│ [🔍 Cari nama, IMO...] [Status▼] [Tipe Kapal▼] [Bendera▼]  │
└─────────────────────────────────────────────────────────────┘
┌─ Data Table ────────────────────────────────────────────────┐
│ ☐  Nama Kapal    IMO      Tipe         Bendera  GT      Status    Sertifikat  ⋯ │
│ ☐  MV Nusantara  9100001  Bulk Carrier 🇮🇩 ID   25,000  ● Aktif  ✓✓✓⚠      ⋯ │
│ ☐  MV Sentosa    9200001  Container    🇸🇬 SG   35,000  ● Aktif  ✓✓✓✓      ⋯ │
│ ☐  MV Armada 3   9100003  Kargo Umum   🇮🇩 ID   8,500   ● Dok    ✓⚠⚠       ⋯ │
└─────────────────────────────────────────────────────────────┘
┌─ Pagination ────────────────────────────────────────────────┐
│ Menampilkan 1–20 dari 47 kapal       [<] [1] [2] [3] [>]   │
└─────────────────────────────────────────────────────────────┘

TABLE COLUMNS (ColumnDef array):
1. select (checkbox, 40px)
2. name (clickable link ke /fleet/vessels/{id}, bold, min 200px)
3. imoNumber (monospace font, 100px)
4. vesselType (mapped ke label Indonesia, 140px)
5. flagState (emoji flag + kode, 80px)
6. grossTonnage (number format dengan koma, right-aligned, monospace, 100px)
7. classSociety (80px)
8. status (StatusBadge component, 100px)
9. certificateIndicator (custom cell, 100px):
   - Mini icon bar: berapa cert OK (hijau), warning (kuning), expired (merah)
   - Format: "✓3 ⚠1 ✗0" dengan warna
10. actions (DropdownMenu: Edit, Ubah Status, Lihat Sertifikat, Hapus, 60px)

URL STATE SYNC (gunakan nuqs atau manual URLSearchParams):
?page=1&limit=20&status=ACTIVE&vesselType=BULK_CARRIER&search=nusantara

Ketika filter berubah → update URL → React Query refetch

BULK ACTION BAR (muncul saat ada yang di-select):
[X dipilih] [Export Excel] [Ubah Status Massal] [Batalkan Pilihan]

DIALOG TAMBAH KAPAL (Sheet/SlideOver dari kanan):
Width: 520px
Form pakai react-hook-form + zod (schema dari @shared/schemas):

Section "Identitas Kapal":
- Nomor IMO*        [7 digit, validate realtime]
- Nama Kapal*       [text]
- Nomor MMSI        [9 digit, optional]
- Tanda Panggil     [text, optional]

Section "Klasifikasi":
- Tipe Kapal*       [select — gunakan VesselType enum]
- Negara Bendera*   [searchable select, ISO country list]
- Pelabuhan Pendaftaran [text, optional]
- Biro Klasifikasi  [select: BKI, DNV, Lloyd's Register, ABS, NK, BV, RINA, Lainnya]
- Nomor Kelas       [text, optional]

Section "Ukuran":
- Gross Tonnage*    [number, min 0]
- Net Tonnage       [number, optional]
- Deadweight Ton    [number, optional]
- Panjang (LOA)     [number, satuan: meter, optional]

Section "Informasi Pembangunan":
- Tahun Dibangun    [number, 1900–2030, optional]
- Galangan Kapal    [text, optional]

Footer: [Batal] [Simpan Kapal]

onSubmit:
→ useCreateVessel().mutate(data)
→ Success: tutup panel, invalidate vessels query, toast "Kapal berhasil didaftarkan"
→ Error FLEET_VESSEL_DUPLICATE_IMO: set error pada field imoNumber
→ Error VALIDATION_ERROR: set field errors dari response.error.details
```

---

## PROMPT 07-D — Vessel Detail Page

> ❌ **BELUM SELESAI** — `apps/web/src/app/(dashboard)/fleet/vessels/[vesselId]/` belum ada. Halaman detail kapal dengan InfoPanel, TabNav (Sertifikat, Dokumen, Kru, Riwayat), change status dialog belum dibuat.

```
Buat halaman detail kapal — split panel layout.

File: apps/web/src/app/(dashboard)/fleet/vessels/[vesselId]/page.tsx

LAYOUT:

PageHeader:
  Title: vessel.name
  Subtitle: "IMO: {imoNumber} · {vesselType} · {flagState}"
  Right: <StatusBadge status={vessel.status} /> [Edit] [Ubah Status▼]

Content (grid 3 kolom):
┌─ Col 1 (1/3) ──────────────────────────────────────────────┐
│ InfoPanel: Data Teknikal                                     │
│  IMO Number     9100001                                      │
│  Tipe Kapal     Bulk Carrier                                 │
│  Gross Tonnage  25,000 GT                                    │
│  Net Tonnage    15,200 NT                                    │
│  DWT            42,500 MT                                    │
│  Panjang        189.5 m                                      │
│  Biro Kelas     BKI                                          │
│  Nomor Kelas    BKI-2015-1234                               │
│  Tahun Bangun   2015                                         │
│  Galangan       PT PAL Indonesia                             │
├─────────────────────────────────────────────────────────────┤
│ InfoPanel: Identifikasi                                      │
│  Tanda Panggil  YCNJ1                                       │
│  MMSI           525001234                                    │
│  Port of Reg.   Tanjung Priok                               │
│  Negara Bendera Indonesia                                    │
├─────────────────────────────────────────────────────────────┤
│ InfoPanel: Status Operasional                               │
│  Status         ● Beroperasi                                │
│  Kru On Board   21 / 25 orang                               │
│  Voyage Aktif   VOY-2024-0047                               │
└─────────────────────────────────────────────────────────────┘

┌─ Col 2-3 (2/3) ────────────────────────────────────────────┐
│ TabNav: [Sertifikat] [Dokumen] [Kru On Board] [Riwayat]    │
│                                                              │
│ TAB: Sertifikat                                             │
│  [+ Tambah Sertifikat]                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Tipe          No. Cert    Penerbit   Berlaku s/d  Status│ │
│  │ SMC           SMC-2023..  BKI        15 Mar 2026  ✓Valid│ │
│  │ DOC           DOC-2022..  BKI        20 Jun 2024  ✗HABIS│ │
│  │ ISSC          ISSC-2023.  Kemenhub   5 Des 2025   ⚠48hr│ │
│  └────────────────────────────────────────────────────────┘ │
│  (klik row → expand detail + tombol Perbarui/Perpanjang)    │
│                                                              │
│ TAB: Kru On Board                                           │
│  Tabel manning: Jabatan | Nama | Sign On | Sisa Kontrak     │
│                                                              │
│ TAB: Riwayat Pelayaran                                      │
│  Timeline voyage: tanggal, rute, status                     │
└─────────────────────────────────────────────────────────────┘

CHANGE STATUS Dialog:
Trigger: dropdown "Ubah Status"
Modal dengan:
- Status saat ini (disabled)
- Status baru* (select — hanya tampilkan valid transitions)
- Alasan (textarea)
- Jika DRYDOCK: tambah field galangan + tanggal rencana
Konfirmasi: "Apakah Anda yakin mengubah status dari X ke Y?"
```

---

## Checklist Selesai Prompt 07

```bash
# Dashboard loads
# Buka http://localhost:3000/dashboard
# → 4 KPI cards dengan data real
# → Alert panel dengan cert yang mau expired (dari seed data)
# → Donut chart vessel status
# → Recent activity dari audit log

# Vessel list
# Buka /fleet/vessels
# → Table dengan semua kapal dari seed data
# → Filter status ACTIVE → hanya kapal aktif
# → Search "nusantara" → filter hasil
# → URL update saat filter berubah

# Tambah kapal
# Klik "+ Tambah Kapal" → slide-over muncul
# Submit IMO duplikat → error muncul di field IMO
# Submit valid → kapal muncul di table

# Vessel detail
# Klik nama kapal → /fleet/vessels/{id}
# → Info panels terisi data
# → Tab Sertifikat → list cert dengan status badges

# Responsive check
# Chrome DevTools → 1280px width → table scrollable horizontal
# Tidak ada overflow di 1280px lebar

# React Query devtools
# Shift+D (jika enabled) → lihat semua queries dan cache state
```
