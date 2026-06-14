"use client";

import { AlertTriangle, Anchor, FileText, Ship, Users } from "lucide-react";

import { VesselStatusChart } from "@/components/VesselStatusChart";
import { useAlertPanel, useCertificateSummary, useFleetOverview } from "@/hooks/use-dashboard";

function KpiCard({
  title,
  value,
  unit,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
}): React.JSX.Element {
  return (
    <div className="rounded border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {title}
        </span>
        <div className={`text-${color}-400`}>{icon}</div>
      </div>
      <div className="flex items-end gap-1">
        <span className="font-mono text-xl font-bold text-[var(--color-text-primary)]">
          {value}
        </span>
        {unit && <span className="mb-0.5 text-xs text-[var(--color-text-tertiary)]">{unit}</span>}
      </div>
    </div>
  );
}

function AlertItem({
  severity,
  title,
  description,
  daysRemaining,
}: {
  severity: string;
  title: string;
  description: string;
  daysRemaining?: number;
}): React.JSX.Element {
  const colorMap: Record<string, string> = {
    danger: "var(--color-status-danger)",
    critical: "var(--color-status-critical)",
    warning: "var(--color-status-warning)",
  };

  return (
    <div className="flex items-start gap-2 border-b border-[var(--color-border-subtle)] px-3 py-2 last:border-0">
      <AlertTriangle
        className="mt-0.5 h-3 w-3 flex-shrink-0"
        style={{ color: colorMap[severity] || colorMap.warning }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-[var(--color-text-primary)]">{title}</p>
        <p className="truncate text-[10px] text-[var(--color-text-tertiary)]">{description}</p>
      </div>
      {daysRemaining !== undefined && (
        <span
          className={`flex-shrink-0 font-mono text-[10px] ${
            daysRemaining <= 0
              ? "text-[var(--color-status-danger)]"
              : daysRemaining <= 30
                ? "text-[var(--color-status-critical)]"
                : "text-[var(--color-status-warning)]"
          }`}
        >
          {daysRemaining <= 0 ? "EXPIRED" : `${daysRemaining}d`}
        </span>
      )}
    </div>
  );
}

export default function DashboardPage(): React.JSX.Element {
  const { data: overview, isLoading: loadingOverview } = useFleetOverview();
  const { data: certSummary, isLoading: loadingCert } = useCertificateSummary();
  const { data: alertPanel, isLoading: loadingAlerts } = useAlertPanel();

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Dashboard</h1>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          {overview?.company?.name || "Overview Armada"}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard
          title="Total Kapal"
          value={loadingOverview ? "—" : (overview?.totalVessels ?? 0)}
          icon={<Ship className="h-4 w-4" />}
          color="primary"
        />
        <KpiCard
          title="Aktif"
          value={loadingOverview ? "—" : (overview?.activeVessels ?? 0)}
          unit="kapal"
          icon={<Anchor className="h-4 w-4" />}
          color="green"
        />
        <KpiCard
          title="Drydock"
          value={loadingOverview ? "—" : (overview?.drydockVessels ?? 0)}
          icon={<Ship className="h-4 w-4" />}
          color="yellow"
        />
        <KpiCard
          title="Kru On Board"
          value={loadingOverview ? "—" : (overview?.crewOnBoard ?? 0)}
          icon={<Users className="h-4 w-4" />}
          color="blue"
        />
        <KpiCard
          title="Sertifikat"
          value={loadingCert ? "—" : (certSummary?.total ?? 0)}
          unit={`${certSummary?.valid ?? 0} valid`}
          icon={<FileText className="h-4 w-4" />}
          color="blue"
        />
      </div>

      {/* Certificate Summary + Alert Panel */}
      <div className="grid grid-cols-3 gap-4">
        {/* Certificate Status */}
        <div className="col-span-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
          <div className="border-b border-[var(--color-border-default)] px-3 py-2">
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
              Status Sertifikat
            </h3>
          </div>
          {loadingCert ? (
            <div className="p-3 text-xs text-[var(--color-text-tertiary)]">Loading...</div>
          ) : (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-[var(--color-text-secondary)]">Valid</span>
                <span className="font-mono text-xs text-[var(--color-status-valid)]">
                  {certSummary?.valid ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-[var(--color-text-secondary)]">Akan Expired</span>
                <span className="font-mono text-xs text-[var(--color-status-warning)]">
                  {certSummary?.expiringSoon ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-[var(--color-text-secondary)]">Kritis</span>
                <span className="font-mono text-xs text-[var(--color-status-critical)]">
                  {certSummary?.critical ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs text-[var(--color-text-secondary)]">Expired</span>
                <span className="font-mono text-xs text-[var(--color-status-danger)]">
                  {certSummary?.expired ?? 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alert Panel */}
        <div className="col-span-2 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-3 py-2">
            <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">Alert Panel</h3>
            <span className="bg-[var(--color-status-danger)]/10 rounded-full px-2 py-0.5 text-[10px] text-[var(--color-status-danger)]">
              {alertPanel?.totalAlerts ?? 0} alert
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loadingAlerts ? (
              <div className="p-3 text-xs text-[var(--color-text-tertiary)]">Loading...</div>
            ) : alertPanel?.critical.length ? (
              alertPanel.critical.map((alert, i) => <AlertItem key={`critical-${i}`} {...alert} />)
            ) : (
              <div className="p-3 text-xs text-[var(--color-text-tertiary)]">
                Tidak ada alert kritis
              </div>
            )}
            {alertPanel?.expiringSoon?.map((alert, i) => (
              <AlertItem key={`expiring-${i}`} {...alert} />
            ))}
            {alertPanel?.drydockVessels?.map((alert, i) => (
              <AlertItem key={`drydock-${i}`} {...alert} />
            ))}
          </div>
        </div>
      </div>

      {/* Vessel Status Chart */}
      <div className="mt-4">
        <VesselStatusChart
          data={[
            { status: "ACTIVE", count: overview?.activeVessels ?? 0 },
            { status: "DRYDOCK", count: overview?.drydockVessels ?? 0 },
            { status: "LAID_UP", count: overview?.laidUpVessels ?? 0 },
          ]}
        />
      </div>
    </div>
  );
}
