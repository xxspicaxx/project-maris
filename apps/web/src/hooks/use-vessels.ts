"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  fleetService,
  type Vessel,
  type VesselCertificate,
  type PaginationMeta,
} from "@/services/fleet.service";

export function useVessels(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): UseQueryResult<{ data: Vessel[]; meta?: PaginationMeta }, Error> {
  return useQuery({
    queryKey: ["vessels", params],
    queryFn: () => fleetService.getVessels(params),
  });
}

export function useVessel(vesselId: string): UseQueryResult<Vessel, Error> {
  return useQuery({
    queryKey: ["vessel", vesselId],
    queryFn: () => fleetService.getVessel(vesselId),
    enabled: !!vesselId,
  });
}

export function useCreateVessel(): UseMutationResult<Vessel, Error, Record<string, unknown>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fleetService.createVessel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
}

export function useUpdateVessel(): UseMutationResult<
  Vessel,
  Error,
  { vesselId: string; data: Record<string, unknown> }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vesselId, data }: { vesselId: string; data: Record<string, unknown> }) =>
      fleetService.updateVessel(vesselId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
}

export function useDeleteVessel(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vesselId: string) => fleetService.deleteVessel(vesselId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
}

export function useUpdateVesselStatus(): UseMutationResult<
  Vessel,
  Error,
  { vesselId: string; status: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vesselId, status }: { vesselId: string; status: string }) =>
      fleetService.updateVesselStatus(vesselId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessels"] });
    },
  });
}

export function useVesselCertificates(
  vesselId: string,
): UseQueryResult<VesselCertificate[], Error> {
  return useQuery({
    queryKey: ["vessel-certificates", vesselId],
    queryFn: () => fleetService.getVesselCertificates(vesselId),
    enabled: !!vesselId,
  });
}

export function useCreateCertificate(): UseMutationResult<
  VesselCertificate,
  Error,
  { vesselId: string; data: Record<string, unknown> }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vesselId, data }: { vesselId: string; data: Record<string, unknown> }) =>
      fleetService.createCertificate(vesselId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vessel-certificates"] });
    },
  });
}
