"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  dashboardService,
  type AlertPanel,
  type CertificateSummary,
  type FleetOverview,
} from "@/services/dashboard.service";

export function useFleetOverview(): UseQueryResult<FleetOverview, Error> {
  return useQuery({
    queryKey: ["dashboard", "fleet-overview"],
    queryFn: () => dashboardService.getFleetOverview(),
  });
}

export function useCertificateSummary(): UseQueryResult<CertificateSummary, Error> {
  return useQuery({
    queryKey: ["dashboard", "certificate-summary"],
    queryFn: () => dashboardService.getCertificateSummary(),
  });
}

export function useAlertPanel(): UseQueryResult<AlertPanel, Error> {
  return useQuery({
    queryKey: ["dashboard", "alert-panel"],
    queryFn: () => dashboardService.getAlertPanel(),
  });
}
