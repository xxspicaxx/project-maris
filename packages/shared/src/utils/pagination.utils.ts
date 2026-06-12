import { type PaginationMeta } from "../types/pagination.types";

export function buildPaginationMeta(
  totalItems: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    total: totalItems,
    totalPages: Math.max(0, totalPages),
  };
}
