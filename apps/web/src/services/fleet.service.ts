import apiClient, { type ApiResponse, type PaginationMeta } from "./api.client";
export type { PaginationMeta } from "./api.client";

export interface Vessel {
  id: string;
  imoNumber: string;
  name: string;
  flagState: string;
  vesselType: string;
  status: string;
  grossTonnage: number;
  yearBuilt?: number;
  createdAt: string;
  _count?: { certificates: number; crewAssignments: number };
}

export interface VesselCertificate {
  id: string;
  certificateType: string;
  certificateNumber?: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  documentUrl?: string;
  notes?: string;
  vessel?: { id: string; name: string; imoNumber: string };
}

export const fleetService = {
  // Vessels
  getVessels: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    flagState?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ data: Vessel[]; meta?: PaginationMeta }> => {
    const response = (await apiClient.get("/vessels", { params })) as unknown as ApiResponse<
      Vessel[]
    >;
    return { data: response.data, meta: response.meta };
  },

  getVessel: async (vesselId: string): Promise<Vessel> => {
    const response = (await apiClient.get(
      `/vessels/${vesselId}`,
    )) as unknown as ApiResponse<Vessel>;
    return response.data;
  },

  createVessel: async (data: Record<string, unknown>): Promise<Vessel> => {
    const response = (await apiClient.post("/vessels", data)) as unknown as ApiResponse<Vessel>;
    return response.data;
  },

  updateVessel: async (vesselId: string, data: Record<string, unknown>): Promise<Vessel> => {
    const response = (await apiClient.patch(
      `/vessels/${vesselId}`,
      data,
    )) as unknown as ApiResponse<Vessel>;
    return response.data;
  },

  deleteVessel: async (vesselId: string): Promise<void> => {
    await apiClient.delete(`/vessels/${vesselId}`);
  },

  updateVesselStatus: async (vesselId: string, status: string): Promise<Vessel> => {
    const response = (await apiClient.post(`/vessels/${vesselId}/status`, {
      status,
    })) as unknown as ApiResponse<Vessel>;
    return response.data;
  },

  // Certificates
  getVesselCertificates: async (vesselId: string): Promise<VesselCertificate[]> => {
    const response = (await apiClient.get(
      `/vessels/${vesselId}/certificates`,
    )) as unknown as ApiResponse<VesselCertificate[]>;
    return response.data;
  },

  createCertificate: async (
    vesselId: string,
    data: Record<string, unknown>,
  ): Promise<VesselCertificate> => {
    const response = (await apiClient.post(
      `/vessels/${vesselId}/certificates`,
      data,
    )) as unknown as ApiResponse<VesselCertificate>;
    return response.data;
  },

  updateCertificate: async (
    certificateId: string,
    data: Record<string, unknown>,
  ): Promise<VesselCertificate> => {
    const response = (await apiClient.patch(
      `/vessels/certificates/${certificateId}`,
      data,
    )) as unknown as ApiResponse<VesselCertificate>;
    return response.data;
  },

  deleteCertificate: async (certificateId: string): Promise<void> => {
    await apiClient.delete(`/vessels/certificates/${certificateId}`);
  },
};
