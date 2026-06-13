"use client";

import { Plus, Search, Ship } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useVessels } from "@/hooks/use-vessels";
import type { Vessel } from "@/services/fleet.service";

const statusColors: Record<string, string> = {
  ACTIVE: "text-[var(--color-vessel-active)]",
  DRYDOCK: "text-[var(--color-vessel-drydock)]",
  LAID_UP: "text-[var(--color-vessel-laidup)]",
  SCRAPPED: "text-[var(--color-vessel-scrapped)]",
  SOLD: "text-[var(--color-vessel-scrapped)]",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  DRYDOCK: "Drydock",
  LAID_UP: "Laid-up",
  SCRAPPED: "Afkir",
  SOLD: "Terjual",
};

export default function FleetPage(): React.JSX.Element {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useVessels({ page, limit: 20, search: search || undefined });

  const vessels = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Daftar Armada
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {meta?.total ?? 0} kapal terdaftar
          </p>
        </div>
        <Link
          href="/fleet/create"
          className="flex items-center gap-1.5 rounded bg-[var(--color-primary-500)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary-600)]"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Kapal
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari berdasarkan nama, IMO, atau call sign..."
          className="w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] py-2 pl-9 pr-3 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary-400)]"
        />
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded border border-[var(--color-border-default)]">
        <table className="erp-table w-full">
          <thead>
            <tr className="bg-[var(--color-bg-elevated)]">
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Nama Kapal
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                IMO
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Tipe
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Flag
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                GT
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Status
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Sertifikat
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-xs text-[var(--color-text-tertiary)]"
                >
                  Loading...
                </td>
              </tr>
            ) : vessels.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-xs text-[var(--color-text-tertiary)]"
                >
                  Belum ada data kapal
                </td>
              </tr>
            ) : (
              vessels.map((vessel: Vessel) => (
                <tr
                  key={vessel.id}
                  className="cursor-pointer transition-colors hover:bg-[var(--color-bg-overlay)]"
                  onClick={() => (window.location.href = `/fleet/${vessel.id}`)}
                >
                  <td className="px-3 py-2 text-xs font-medium text-[var(--color-text-primary)]">
                    <div className="flex items-center gap-2">
                      <Ship className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                      {vessel.name}
                    </div>
                  </td>
                  <td className="font-mono text-xs text-[var(--color-text-secondary)]">
                    {vessel.imoNumber}
                  </td>
                  <td className="text-xs text-[var(--color-text-secondary)]">
                    {vessel.vesselType?.replace(/_/g, " ")}
                  </td>
                  <td className="text-xs text-[var(--color-text-secondary)]">{vessel.flagState}</td>
                  <td className="font-mono text-xs text-[var(--color-text-secondary)]">
                    {vessel.grossTonnage?.toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        vessel.status === "ACTIVE"
                          ? "bg-[var(--color-status-valid)]/10 text-[var(--color-status-valid)]"
                          : vessel.status === "DRYDOCK"
                            ? "bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)]"
                            : "bg-[var(--color-status-neutral)]/10 text-[var(--color-status-neutral)]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusColors[vessel.status] || ""}`}
                      />
                      {statusLabels[vessel.status] || vessel.status}
                    </span>
                  </td>
                  <td className="text-xs text-[var(--color-text-secondary)]">
                    {vessel._count?.certificates ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            Halaman {meta.page} dari {meta.totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-overlay)] disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
              disabled={page >= meta.totalPages}
              className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-overlay)] disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
