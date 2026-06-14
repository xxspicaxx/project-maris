# Database Migrations

Panduan untuk mengelola database migrations menggunakan Prisma di project Maritime Fleet ERP.

## Cara Membuat Migration Baru
Ketika ada perubahan pada file `prisma/schema.prisma`, buat migration baru dengan perintah:

```bash
npx prisma migrate dev --name <deskripsi_singkat>
```
Contoh: `npx prisma migrate dev --name add_vessel_status`

## Naming Convention Migration
- Gunakan bahasa Inggris.
- Gunakan `snake_case` untuk nama migration.
- Berikan nama yang deskriptif mengenai tabel atau kolom apa yang diubah.
- Contoh yang baik: `init_maritime_erp_schema`, `add_user_roles`, `update_vessel_capacity`.
- Contoh yang buruk: `update1`, `fix_db`, `schema`.

## Cara Rollback Migration
Jika migration belum di-apply ke production atau jika sedang di local dan ingin mereset seluruh database:

```bash
npx prisma migrate reset
```
**Peringatan:** Perintah ini akan menghapus database, membuat ulang dari awal (apply semua migrations dari awal), dan menjalankan seed script (jika ada). Jangan gunakan ini di production!

## Cara Apply di Production
Pada environment staging atau production, jangan gunakan `migrate dev`. Gunakan perintah berikut untuk meng-apply migration secara aman:

```bash
npx prisma migrate deploy
```
Perintah ini hanya akan menjalankan file migration yang belum pernah di-apply sebelumnya ke database tanpa mereset atau memodifikasi file `schema.prisma`.
