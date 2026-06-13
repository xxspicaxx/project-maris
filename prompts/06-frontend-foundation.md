# Prompt 06 — Frontend Foundation

**Tahap:** Next.js ERP shell, design system, API client, auth flow UI  
**Prerequisite:** Prompt 05 selesai, API berjalan di localhost:4000  
**Output:** ERP shell berfungsi, login bekerja, navigasi siap

---

## PROMPT 06-A — Next.js App Setup & ERP Shell Layout

```
Setup Next.js 14 App Router untuk Maritime Fleet ERP.
Baca docs/ai-rules/10-ui-design-system.md SELURUHNYA sebelum membuat satu baris UI.
Baca docs/ai-rules/04-folder-structure.md section 4.4 untuk struktur folder.

TEMA: Dark maritime enterprise — navy deep blue, dense information, DANAOS-inspired.
BUKAN consumer app. BUKAN startup dashboard. Enterprise ERP untuk profesional maritim.

1. apps/web/src/app/layout.tsx  (Root layout)
   - HTML dengan lang="id"
   - Font: Inter (UI) + JetBrains Mono (data/monospace)
   - CSS variables dari design system (docs/ai-rules/10-ui-design-system.md section 10.2)
   - Providers wrapper: QueryClientProvider, ToastProvider, AuthProvider
   - Background: var(--color-bg-canvas) = #0f1623

2. apps/web/src/app/(auth)/layout.tsx  (Auth pages — centered, no sidebar)
   - Centered vertically dan horizontally
   - Background: gradient subtle dari #0f1623 ke #161f2e
   - Logo Maritime ERP di atas form
   - Tidak ada sidebar/navbar

3. apps/web/src/app/(dashboard)/layout.tsx  (ERP Shell — UTAMA)

   STRUKTUR:
   <div class="flex h-screen overflow-hidden bg-canvas">
     <Sidebar />           ← Fixed left, 240px (collapsed: 64px)
     <div class="flex flex-col flex-1 overflow-hidden">
       <TopBar />           ← Fixed top, 48px height
       <main class="flex-1 overflow-auto">
         <div class="p-4">
           <Breadcrumb />
           {children}
         </div>
       </main>
     </div>
   </div>

4. apps/web/src/components/layout/Sidebar.tsx

   SPESIFIKASI VISUAL (DANAOS-inspired):
   - Background: #161f2e (--color-bg-surface)
   - Border right: 1px solid #243452
   - Width: 240px normal, 64px collapsed
   - Transition collapse: 200ms ease
   - Logo area: 48px height, logo + "Maritime ERP" text

   Navigation items dengan ikon Lucide:
   { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }
   { icon: Ship, label: "Armada", href: "/fleet", children: [
     { label: "Daftar Kapal", href: "/fleet/vessels" },
     { label: "Sertifikat", href: "/fleet/certificates" },
     { label: "Dokumen", href: "/fleet/documents" },
   ]}
   { icon: Users, label: "Kru", href: "/crew", children: [
     { label: "Daftar Pelaut", href: "/crew/seafarers" },
     { label: "Manning List", href: "/crew/manning" },
     { label: "Sertifikat Kru", href: "/crew/certificates" },
   ]}
   { icon: Anchor, label: "Pelayaran", href: "/voyage", children: [...] }
   { icon: Wrench, label: "Teknikal", href: "/technical", children: [...] }
   { icon: ShieldAlert, label: "HSSEQ", href: "/hsseq", children: [...] }
   { icon: Settings, label: "Administrasi", href: "/admin", children: [...] }

   Active state: bg-primary-500/10, text-primary-400, left border 2px primary
   Hover state: bg-overlay, text-primary
   Collapsed: show only icons with tooltip on hover

   Di bagian bawah sidebar:
   - Company selector (jika user SUPER_ADMIN)
   - User avatar + nama + jabatan (compact)
   - Logout button

5. apps/web/src/components/layout/TopBar.tsx

   Height: 48px, background: #161f2e, border-bottom: 1px solid #243452

   Kiri: Breadcrumb (auto-generated dari URL path)
   Kanan:
   - Global search button (icon + "Cari..." placeholder, Cmd+K shortcut)
   - Notification bell (dengan badge count jika ada alert)
   - Company badge (nama company aktif)
   - User menu (avatar dropdown: Profile, Ganti Password, Logout)

6. apps/web/src/components/layout/Breadcrumb.tsx

   Auto-generate dari pathname:
   /fleet/vessels → Dashboard > Armada > Daftar Kapal
   /fleet/vessels/[id] → Dashboard > Armada > MV Nusantara Jaya

   Style: text-xs, text-secondary, separator: /
   Last item: text-primary, tidak clickable

7. CSS Global (apps/web/src/app/globals.css)

   Tambahkan CSS variables dari design system:
   :root { semua --color-* variables }

   Komponen utility classes:
   .erp-table { dense table styles }
   .erp-panel { bg-surface border rounded }
   .erp-section-header { border-b, title styling }
   .status-badge-* { untuk semua status colors }
```

---

## PROMPT 06-B — Design System Components

```
Buat komponen UI design system yang akan digunakan di seluruh aplikasi.
Baca docs/ai-rules/10-ui-design-system.md section 10.5 untuk spesifikasi.
SEMUA komponen harus mengikuti maritime dark theme.
JANGAN buat komponen yang terlalu "consumer-friendly" — ini enterprise dense UI.

Lokasi: apps/web/src/components/

1. data-display/ErpDataTable.tsx

   Props:
   - columns: ColumnDef<T>[]          ← @tanstack/react-table
   - data: T[]
   - totalRows: number
   - pagination: { page, limit }
   - onPaginationChange: fn
   - isLoading?: boolean
   - onRowClick?: (row: T) => void
   - selectedRows?: string[]
   - stickyHeader?: boolean           ← default true

   Features:
   - Row height: 36px (compact)
   - Header: 32px, uppercase, 11px font, secondary color
   - Alternating row: subtle bg difference
   - Loading state: skeleton rows (bukan spinner)
   - Empty state: ikon + "Tidak ada data" message
   - Sticky header
   - Click row → highlight + call onRowClick
   - Pagination bar di bawah: "Menampilkan X–Y dari Z data"
   - Page size selector: [10, 20, 50, 100]

2. data-display/KpiCard.tsx

   Props:
   - title: string
   - value: string | number
   - unit?: string
   - trend?: { value: number, direction: "up" | "down", label: string }
   - status?: "good" | "warning" | "danger" | "neutral"
   - icon?: LucideIcon
   - isLoading?: boolean

   Visual:
   - bg-surface, border, rounded, p-3
   - Title: 11px uppercase tracking-wider text-secondary
   - Value: 24px font-mono font-bold
   - Status indicator: left border color (green/yellow/red/gray)
   - Trend: small arrow + percentage in green/red

3. data-display/InfoPanel.tsx

   Props:
   - title: string
   - fields: Array<{ label: string, value: ReactNode, span?: number }>
   - actions?: ReactNode
   - isLoading?: boolean

   Visual:
   - Panel dengan header (title + actions)
   - Body: label-value pairs, 2 kolom grid
   - Label: 11px text-secondary, 40% width
   - Value: 12px text-primary font-medium
   - Row height: ~28px dengan divider antar row
   - Loading: skeleton lines

4. maritime/StatusBadge.tsx

   Handles semua status types:
   - VesselStatus: ACTIVE(green), DRYDOCK(yellow), LAID_UP(gray), SCRAPPED(red-dark)
   - CertificateStatus: VALID(green), EXPIRING_SOON(yellow), CRITICAL(orange), EXPIRED(red)
   - VoyageStatus: PLANNED(blue), ACTIVE(green), COMPLETED(gray), CANCELLED(red)

   Props:
   - status: string
   - type: "vessel" | "certificate" | "voyage" | "crew"
   - size?: "sm" | "md"              ← default "sm" (11px)

   Visual: colored dot + label, pill shape, small padding
   Jangan gunakan full background — gunakan tinted background (opacity 10-15%)

5. maritime/CertificateExpiryBar.tsx

   Visual indicator untuk certificate expiry:
   - Progress bar dari 0–100% (100% = today, 0% = issue date)
   - Color: green → yellow → orange → red berdasarkan days left
   - Tooltip: "X hari lagi" atau "Kadaluarsa Y hari lalu"
   - Compact: hanya bar + days left number

   Props: { issueDate, expiryDate, size?: "sm" | "md" }

6. forms/

   FormField.tsx — wrapper untuk react-hook-form fields
   - Label (required indicator: *)
   - Input/Select/etc
   - Error message (merah, 11px)
   - Helper text

   MariTimeSelect.tsx — dropdown yang consistent
   - Searchable
   - Loading state
   - Empty state
   - Support untuk vessel types, ranks, flag states, dll

   DatePicker.tsx — untuk expiry dates
   - Format: DD/MM/YYYY (Indonesia)
   - Min/max date props
   - Highlight dates dalam 90 hari (warning zone)

7. feedback/

   AlertBanner.tsx — untuk compliance alerts
   - Variants: warning, critical, danger, info
   - Icon + title + message + optional CTA button
   - Dismissible

   EmptyState.tsx
   - Icon + title + description + optional action button
   - Berbeda style untuk: no data, no permission, no results, error

8. layout/

   PageHeader.tsx
   - Title (h1, 18px)
   - Subtitle (text-secondary, 12px)
   - Right slot: action buttons
   - Optional: status badge di sebelah title

   SectionDivider.tsx
   - Horizontal rule dengan optional label

   TabNav.tsx
   - Tab navigation untuk detail pages
   - Active: underline primary color
   - Dense: tidak besar-besar

Buat Storybook stories untuk semua komponen di atas.
Jalankan: pnpm storybook → semua komponen visible dan interaktif.
```

---

## PROMPT 06-C — API Client & Data Fetching

```
Setup API client dan data fetching layer untuk Next.js.
Baca docs/ai-rules/06-api-design.md untuk format response yang diharapkan.
Baca docs/ai-rules/13-error-handling.md untuk error handling di frontend.

1. apps/web/src/lib/api-client.ts

   Axios instance dengan:
   - baseURL: process.env.NEXT_PUBLIC_API_URL
   - timeout: 30000
   - withCredentials: true  ← untuk httpOnly cookie refresh token

   Request interceptor:
   → Inject Authorization: Bearer {accessToken} dari auth store
   → Inject X-Request-ID: uuid()

   Response interceptor:
   → Unwrap ApiResponse<T>.data → return langsung data
   → Handle 401: coba refresh token, retry request
   → Handle refresh failure: redirect ke /login
   → Convert error ke ApiError class:
     class ApiError extends Error {
       constructor(
         public code: string,
         message: string,
         public details?: ValidationError[],
         public status?: number
       )
     }

2. apps/web/src/services/ — Service functions per domain

   fleet.service.ts:
   getVessels(params: ListVesselsParams): Promise<PaginatedResponse<VesselListItem>>
   getVesselById(id: string): Promise<VesselDetail>
   createVessel(data: CreateVesselDto): Promise<VesselDetail>
   updateVessel(id: string, data: UpdateVesselDto): Promise<VesselDetail>
   deleteVessel(id: string): Promise<void>
   getVesselCertificates(vesselId: string): Promise<VesselCertificate[]>
   addVesselCertificate(vesselId: string, data): Promise<VesselCertificate>
   renewCertificate(vesselId, certId, data): Promise<VesselCertificate>
   getComplianceSummary(): Promise<ComplianceSummary>
   changeVesselStatus(vesselId, action, data?): Promise<VesselDetail>

   auth.service.ts:
   login(email, password): Promise<LoginResponse>
   logout(): Promise<void>
   refreshToken(): Promise<{ accessToken: string }>
   getMe(): Promise<CurrentUser>
   forgotPassword(email): Promise<void>
   resetPassword(token, newPassword): Promise<void>

3. apps/web/src/hooks/ — React Query hooks

   use-vessels.ts:
   useVessels(params) — useQuery
   useVessel(id) — useQuery
   useCreateVessel() — useMutation dengan:
     onSuccess: invalidate vessels list, toast success
     onError: handle ApiError (validation errors → form fields, dll)
   useUpdateVessel() — useMutation
   useDeleteVessel() — useMutation dengan confirm dialog
   useVesselCertificates(vesselId) — useQuery
   useComplianceSummary() — useQuery, refetch every 5 menit

   use-auth.ts:
   useLogin() — useMutation
   useLogout() — useMutation
   useCurrentUser() — useQuery

4. apps/web/src/stores/auth.store.ts  (Zustand)

   State:
   - accessToken: string | null
   - user: CurrentUser | null
   - isAuthenticated: boolean

   Actions:
   - setAccessToken(token)
   - setUser(user)
   - clearAuth()            ← dipanggil saat logout/token expired

5. apps/web/src/stores/ui.store.ts  (Zustand)

   State:
   - sidebarCollapsed: boolean
   - activeNotifications: Notification[]
   - globalSearch: { open: boolean, query: string }

   Actions:
   - toggleSidebar()
   - addNotification(notif)
   - removeNotification(id)
   - openSearch()
   - closeSearch()

6. React Query setup:
   apps/web/src/lib/query-client.ts

   QueryClient config:
   defaultOptions: {
     queries: {
       staleTime: 5 * 60 * 1000,       // 5 menit
       retry: (count, error) => {
         if (error instanceof ApiError && error.status === 404) return false;
         return count < 2;
       },
       refetchOnWindowFocus: false,     // Enterprise app, tidak perlu
     },
     mutations: {
       onError: (error) => {            // Global mutation error handler
         if (error instanceof ApiError && error.status === 401) return;
         // Show generic toast untuk unhandled errors
       }
     }
   }
```

---

## PROMPT 06-D — Auth Pages & Route Protection

```
Buat auth pages dan middleware untuk route protection.

1. apps/web/src/app/(auth)/login/page.tsx

   Form fields:
   - Email input (type="email", autocomplete="email")
   - Password input (type="password", show/hide toggle)
   - "Ingat saya" checkbox (optional)
   - Submit button: "Masuk"
   - Link: "Lupa Password?"

   Visual:
   - Card centered, max-width 400px
   - Logo di atas
   - "Maritime Fleet ERP" subtitle
   - Subtle animated background (CSS only, tidak butuh library)

   Logic (useLogin hook):
   onSubmit → login(email, password)
   → Set accessToken di auth store
   → Redirect ke /dashboard
   → onError: tampilkan pesan error di form (bukan toast)
   → Handle AUTH_CREDENTIALS_INVALID: "Email atau password salah"
   → Handle AUTH_ACCOUNT_DISABLED: "Akun Anda telah dinonaktifkan"

2. apps/web/src/app/(auth)/forgot-password/page.tsx
   - Email input
   - Submit → forgotPassword()
   - Success: tampilkan pesan "Link reset telah dikirim ke email Anda"

3. apps/web/src/app/(auth)/reset-password/page.tsx
   - Password + Confirm Password
   - Validasi client-side sebelum submit
   - Token dari URL query param

4. apps/web/src/middleware.ts  (Next.js middleware)

   Route protection:
   - Semua route /dashboard/* → cek apakah ada accessToken di cookie/store
   - Jika tidak ada → redirect ke /login
   - Jika ada tapi expired → coba refresh, jika gagal → /login
   - Route /login, /forgot-password, /reset-password → jika sudah auth → redirect /dashboard

   Permission check:
   - Baca permissions dari JWT payload (decode di middleware)
   - Jika akses route yang butuh permission tertentu tapi tidak punya → redirect /403

5. apps/web/src/app/403/page.tsx  (Forbidden)
   - Pesan "Anda tidak memiliki akses ke halaman ini"
   - Link kembali ke dashboard

6. apps/web/src/app/not-found.tsx  (404)
   - Maritime themed 404 page
   - "Halaman tidak ditemukan"
   - Link kembali ke dashboard
```

---

## Checklist Selesai Prompt 06

```bash
# ERP Shell visual
# Buka http://localhost:3000
# → Redirect ke /login (belum auth)

# Login flow
# Login dengan admin@njm.co.id / Password123!
# → Redirect ke /dashboard
# → Sidebar visible dengan navigasi lengkap
# → TopBar dengan nama user

# Sidebar collapse
# Klik toggle → sidebar collapse ke 64px (icons only)
# → localStorage persist state collapse

# Storybook
pnpm storybook
# → Semua komponen visible: ErpDataTable, KpiCard, InfoPanel, StatusBadge, dll

# API client
# Buka browser console di /dashboard
# → Tidak ada network error
# → React Query devtools menunjukkan queries

# Auth protection
# Buka /fleet/vessels tanpa login → redirect /login
# Login sebagai PORT_AGENT → sidebar navigasi terbatas sesuai permissions

# TypeScript
cd apps/web && pnpm tsc --noEmit
# → 0 errors
```
