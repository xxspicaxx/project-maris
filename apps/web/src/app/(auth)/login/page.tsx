"use client";

import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/services/api.client";
import { Ship } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    loginMutation.mutate(
      { email, password },
      {
        onError: (err) => {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Terjadi kesalahan sistem");
          }
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-canvas)]">
      <div className="w-full max-w-sm rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary-600)]">
            <Ship className="h-6 w-6 text-[var(--color-primary-200)]" />
          </div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Maritime Fleet ERP
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Masuk ke sistem manajemen armada
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border-[var(--color-status-danger)]/30 bg-[var(--color-status-danger)]/10 rounded border px-3 py-2 text-xs text-[var(--color-status-danger)]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary-400)]"
              placeholder="admin@maritime-erp.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary-400)]"
              placeholder="Masukkan password"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-600)] disabled:opacity-50"
          >
            {loginMutation.isPending ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] text-[var(--color-text-tertiary)]">
          Maritime Fleet ERP v1.0 &copy; 2026
        </p>
      </div>
    </div>
  );
}
