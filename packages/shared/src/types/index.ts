/**
 * @maris/shared — Shared domain types
 */

// ─── Generic API Response Types ────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// ─── Audit Types ───────────────────────────────────────────

export interface AuditInfo {
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// ─── Tenant Scoped ────────────────────────────────────────

export interface TenantScoped {
  companyId: string;
}
