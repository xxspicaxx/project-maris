"use client";

import { dashboardService } from "@/services/dashboard.service";
import { useQuery } from "@tanstack/react-query";

export function useFleetOverview() {
  return useQuery({
    queryKey: ["dashboard", "fleet-overview"],
    queryFn: () => dashboardService.getFleetOverview(),
  });
}

export function useCertificateSummary() {
  return useQuery({
    queryKey: ["dashboard", "certificate-summary"],
    queryFn: () => dashboardService.getCertificateSummary(),
  });
}

export function useAlertPanel() {
  return useQuery({
    queryKey: ["dashboard", "alert-panel"],
    queryFn: () => dashboardService.getAlertPanel(),
  });
}
