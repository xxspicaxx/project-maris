"use client";

import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService, type LoginResponse } from "@/services/auth.service";
import { useAuthStore, type User } from "@/stores/auth.store";

export function useLogin(): UseMutationResult<
  LoginResponse,
  Error,
  { email: string; password: string }
> {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push("/dashboard");
    },
  });
}

export function useLogout(): UseMutationResult<void, Error, void> {
  const { logout } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout();
      router.push("/login");
    },
  });
}

export function useProfile(): UseQueryResult<User, Error> {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<User> => {
      const data = await authService.getProfile();
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
