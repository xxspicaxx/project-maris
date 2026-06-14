"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVessel, useVesselCertificates } from "@/hooks/use-vessels";

const getCertStatusColor = (status: string): string => {
  switch (status) {
    case "VALID":
      return "bg-[var(--color-status-valid)]/10 text-[var(--color-status-valid)]";
    case "EXPIRED":
      return "bg-[var(--color-status-danger)]/10 text-[var(--color-status-danger)]";
    case "EXPIRING_SOON":
      return "bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)]";
    default:
      return "bg-[var(--color-status-neutral)]/10 text-[var(--color-status-neutral)]";
  }
};

export default function VesselDetailPage(): React.JSX.Element {
  const params = useParams<{ vesselId: string }>();
  const { data: vessel, isLoading: isLoadingVessel } = useVessel(params?.vesselId ?? "");
  const { data: certificates, isLoading: isLoadingCertificates } = useVesselCertificates(
    params?.vesselId ?? "",
  );

  if (isLoadingVessel) {
    return (
      <div className="p-6 text-sm text-[var(--color-text-tertiary)]">Loading vessel details...</div>
    );
  }

  if (!vessel) {
    return <div className="p-6 text-sm text-[var(--color-status-danger)]">Vessel not found.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link
          href="/fleet"
          className="text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">{vessel.name}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {vessel.imoNumber} • {vessel.vesselType?.replace(/_/g, " ")}
            </p>
          </div>
          <StatusBadge status={vessel.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <KpiCard title="Gross Tonnage" value={vessel.grossTonnage?.toLocaleString() ?? "-"} />
        <KpiCard title="Year Built" value={vessel.yearBuilt ?? "-"} />
        <KpiCard title="Flag State" value={vessel.flagState ?? "-"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)]">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCertificates ? (
              <p className="text-sm text-[var(--color-text-tertiary)]">Loading certificates...</p>
            ) : certificates && certificates.length > 0 ? (
              <div className="overflow-x-auto rounded border border-[var(--color-border-default)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--color-bg-elevated)] uppercase tracking-wider text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Tipe</th>
                      <th className="px-3 py-2 font-semibold">Nomor</th>
                      <th className="px-3 py-2 font-semibold">Berakhir</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {certificates.map((cert) => (
                      <tr
                        key={cert.id}
                        className="transition-colors hover:bg-[var(--color-bg-overlay)]"
                      >
                        <td className="px-3 py-2 font-medium text-[var(--color-text-primary)]">
                          {cert.certificateType}
                        </td>
                        <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                          {cert.certificateNumber || "-"}
                        </td>
                        <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                          {new Date(cert.expiryDate).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getCertStatusColor(
                              cert.status,
                            )}`}
                          >
                            {cert.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Belum ada sertifikat terdaftar.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)]">Recent Voyages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Modul pelayaran akan dibangun pada Phase 2.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
