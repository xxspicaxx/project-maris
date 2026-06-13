import apiClient, { type ApiResponse } from "./api.client";

export interface FleetOverview {
  company: { name: string; code: string } | null;
  totalVessels: number;
  activeVessels: number;
  drydockVessels: number;
  laidUpVessels: number;
  scrappedVessels: number;
  crewOnBoard: number;
}

export interface CertificateSummary {
  total: number;
  valid: number;
  expiringSoon: number;
  critical: number;
  expired: number;
}

export interface Alert {
  type: string;
  severity: string;
  title: string;
  description: string;
  vesselId?: string;
  vesselName?: string;
  expiryDate?: string;
  daysRemaining?: number;
}

export interface AlertPanel {
  critical: Alert[];
  expiringSoon: Alert[];
  drydockVessels: Alert[];
  totalAlerts: number;
}

export const dashboardService = {
  getFleetOverview: async (): Promise<FleetOverview> => {
    const response = (await apiClient.get(
      "/dashboard/fleet-overview",
    )) as unknown as ApiResponse<FleetOverview>;
    return response.data;
  },

  getCertificateSummary: async (): Promise<CertificateSummary> => {
    const response = (await apiClient.get(
      "/dashboard/certificate-summary",
    )) as unknown as ApiResponse<CertificateSummary>;
    return response.data;
  },

  getAlertPanel: async (): Promise<AlertPanel> => {
    const response = (await apiClient.get(
      "/dashboard/alert-panel",
    )) as unknown as ApiResponse<AlertPanel>;
    return response.data;
  },
};
