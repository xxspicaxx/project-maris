"use client";

import apiClient from "@/services/api.client";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { LogOut, Menu, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function Topbar() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore logout API errors to ensure user is logged out locally
    }
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-[var(--color-border-default)]" />
        <span className="text-xs text-[var(--color-text-secondary)]">
          {user?.companyId ? "Perusahaan" : "System"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-600)]">
            <User className="h-3.5 w-3.5 text-[var(--color-text-primary)]" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-[var(--color-text-primary)]">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">{user?.email}</p>
          </div>
        </div>

        <div className="h-4 w-px bg-[var(--color-border-default)]" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-status-danger)]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
