"use client";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useLogin() {
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

export function useLogout() {
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

export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const data = await authService.getProfile();
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
