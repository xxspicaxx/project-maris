"use client";

import { fleetService } from "@/services/fleet.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useVessels(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["vessels", params],
    queryFn: () => fleetService.getVessels(params),
  });
}

export function useVessel(vesselId: string) {
  return useQuery({
    queryKey: ["vessel", vesselId],
    queryFn: () => fleetService.getVessel(vesselId),
    enabled: !!vesselId,
  });
}

export function useCreateVessel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetService.createVessel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
}

export function useUpdateVessel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vesselId, data }: { vesselId: string; data: Record<string, unknown> }) =>
      fleetService.updateVessel(vesselId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
}

export function useDeleteVessel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vesselId: string) => fleetService.deleteVessel(vesselId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
}

export function useUpdateVesselStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vesselId, status }: { vesselId: string; status: string }) =>
      fleetService.updateVesselStatus(vesselId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
}

export function useVesselCertificates(vesselId: string) {
  return useQuery({
    queryKey: ["vessel-certificates", vesselId],
    queryFn: () => fleetService.getVesselCertificates(vesselId),
    enabled: !!vesselId,
  });
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vesselId, data }: { vesselId: string; data: Record<string, unknown> }) =>
      fleetService.createCertificate(vesselId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessel-certificates"] });
    },
  });
}
