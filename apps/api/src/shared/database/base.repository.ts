import { PaginationMeta, PaginationResult } from "@maris/shared/types";
import { Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { DomainException, InfrastructureException } from "../exceptions/base.exception";

// ---------------------------------------------------------------------------
// Domain exceptions emitted by the base repository layer
// ---------------------------------------------------------------------------

/**
 * Thrown when a record that MUST exist is not found during an
 * update / soft-delete operation.
 *
 * Business Rule: P2025 (Prisma "record not found") is surfaced as a
 * domain-level 404 rather than a raw infrastructure error.
 */
export class RecordNotFoundException extends DomainException {
  readonly code = "SYSTEM_RECORD_NOT_FOUND";
  readonly httpStatus = 404;

  constructor(entity: string, id: string) {
    super(`${entity} dengan ID ${id} tidak ditemukan`, { entity, id });
  }
}

/**
 * Thrown when a unique-constraint violation (P2002) is detected.
 *
 * Business Rule: callers should catch this and rethrow a more specific
 * domain exception (e.g. DuplicateImoNumberException), but this generic
 * version exists as a safe fallback.
 */
export class UniqueConstraintViolationException extends DomainException {
  readonly code = "SYSTEM_UNIQUE_CONSTRAINT_VIOLATION";
  readonly httpStatus = 409;

  constructor(fields: string[]) {
    super(`Data sudah ada: field ${fields.join(", ")} harus unik`, { fields });
  }
}

/**
 * Thrown when an unrecognised Prisma error bubbles up from the repository.
 */
export class DatabaseOperationException extends InfrastructureException {
  readonly code = "SYSTEM_DATABASE_ERROR";
  readonly httpStatus = 503;

  constructor(operation: string, cause: unknown) {
    super(`Operasi database gagal: ${operation}`, {
      operation,
      cause: cause instanceof Error ? cause.message : String(cause),
    });
  }
}

// ---------------------------------------------------------------------------
// FindAll options & paginated result types
// ---------------------------------------------------------------------------

/**
 * Options accepted by {@link BaseRepository.findAll}.
 */
export interface FindAllOptions {
  /** 1-based page number (default: 1) */
  page?: number;
  /** Records per page (default: 20, max: 100) */
  limit?: number;
  /** Field name to sort by */
  sortBy?: string;
  /** Sort direction (default: 'asc') */
  sortOrder?: "asc" | "desc";
  /** Full-text / partial search term */
  search?: string;
  /** Arbitrary key-value filters forwarded to `prisma.where` */
  filters?: Record<string, unknown>;
}

/**
 * Generic paginated response returned by {@link BaseRepository.findAll}.
 * Uses `PaginationMeta` from `@maris/shared/types` to keep the shape
 * consistent with the API response envelope.
 */
export type PaginatedResult<T> = PaginationResult<T>;

// ---------------------------------------------------------------------------
// Normalised pagination helper
// ---------------------------------------------------------------------------

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Clamps and defaults raw options into safe, typed pagination values.
 *
 * @internal
 */
export function normalisePagination(options?: FindAllOptions): {
  page: number;
  limit: number;
  skip: number;
  sortOrder: "asc" | "desc";
} {
  const page = Math.max(1, options?.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, options?.limit ?? DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  const sortOrder = options?.sortOrder ?? "asc";

  return { page, limit, skip, sortOrder };
}

/**
 * Builds a {@link PaginationMeta} object from raw counts and pagination params.
 *
 * @internal
 */
export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ---------------------------------------------------------------------------
// Abstract base repository
// ---------------------------------------------------------------------------

/**
 * Abstract base class for all Prisma-backed repositories.
 *
 * ## Generic Parameters
 * - `TEntity`      — The domain / return type (e.g. `Vessel`)
 * - `TCreateInput` — The create DTO / payload
 * - `TUpdateInput` — The update DTO / payload
 *
 * ## Multi-Tenancy Contract
 * Every query MUST include a `companyId` filter so that tenant data is
 * never leaked between companies (row-level tenant isolation).
 *
 * ## Soft-Delete Contract
 * `findAll` ALWAYS adds `deletedAt: null` to exclude soft-deleted records.
 * `softDelete` sets `deletedAt` to the current timestamp rather than
 * removing the row from the database.
 *
 * ## Error Handling
 * Prisma's `PrismaClientKnownRequestError` codes are mapped to domain
 * exceptions before they propagate:
 * - P2002 (unique constraint)  → `UniqueConstraintViolationException`
 * - P2025 (record not found)   → `RecordNotFoundException`
 * - Everything else             → `DatabaseOperationException`
 */
export abstract class BaseRepository<TEntity, TCreateInput, TUpdateInput> {
  protected abstract readonly entityName: string;
  protected readonly logger: Logger;

  constructor(loggerContext: string) {
    this.logger = new Logger(loggerContext);
  }

  // -------------------------------------------------------------------------
  // Abstract methods — implemented by each concrete Prisma repository
  // -------------------------------------------------------------------------

  /**
   * Find a single entity by primary key, scoped to the given company.
   *
   * @returns The entity, or `null` if it does not exist (or belongs to
   *          a different company / has been soft-deleted).
   */
  abstract findById(id: string, companyId: string): Promise<TEntity | null>;

  /**
   * Fetch a paginated list of entities for the given company.
   *
   * Implementation MUST include `{ deletedAt: null }` in the `where` clause.
   */
  abstract findAll(companyId: string, options?: FindAllOptions): Promise<PaginatedResult<TEntity>>;

  /**
   * Persist a new entity.
   *
   * @param data      - The creation payload
   * @param createdBy - Audit field: ID of the user performing the action
   */
  abstract create(data: TCreateInput, createdBy: string): Promise<TEntity>;

  /**
   * Apply a partial update to an existing entity, scoped to the given company.
   *
   * @param id        - Entity primary key
   * @param companyId - Tenant identifier (MUST match the stored record)
   * @param data      - Partial update payload
   * @param updatedBy - Audit field: ID of the user performing the action
   * @throws {RecordNotFoundException} if the entity does not exist within the tenant
   */
  abstract update(
    id: string,
    companyId: string,
    data: TUpdateInput,
    updatedBy: string,
  ): Promise<TEntity>;

  /**
   * Mark an entity as deleted without removing it from the database.
   *
   * Sets `deletedAt` to the current UTC timestamp. The record will no
   * longer appear in `findAll` results.
   *
   * @throws {RecordNotFoundException} if the entity does not exist within the tenant
   */
  abstract softDelete(id: string, companyId: string, deletedBy: string): Promise<void>;

  /**
   * Check whether an entity with `id` exists for the given `companyId`.
   *
   * Returns `false` for soft-deleted records — they are considered
   * non-existent from the application perspective.
   */
  abstract exists(id: string, companyId: string): Promise<boolean>;

  // -------------------------------------------------------------------------
  // Protected helpers — shared utilities available to concrete repositories
  // -------------------------------------------------------------------------

  /**
   * Wraps a Prisma operation and converts known Prisma errors into typed
   * domain / infrastructure exceptions so that no raw Prisma error leaks
   * beyond the repository boundary.
   *
   * Usage in a concrete repository:
   * ```typescript
   * return this.handlePrismaError('create', () =>
   *   this.prisma.vessel.create({ data: { ... } }),
   * );
   * ```
   *
   * @param operation - Human-readable label used in error logs
   * @param fn        - Async factory that executes the Prisma call
   */
  protected async handlePrismaError<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.warn(
          `Prisma error ${error.code} during "${operation}" on ${this.entityName}: ${error.message}`,
        );

        switch (error.code) {
          case "P2002": {
            // Unique constraint violation
            const meta = error.meta as { target?: string[] } | undefined;
            const fields = meta?.target ?? ["unknown"];
            throw new UniqueConstraintViolationException(fields);
          }

          case "P2025": {
            // Record required for the operation not found
            const meta = error.meta as { cause?: string } | undefined;
            const causeMessage = meta?.cause ?? "Record not found";
            // Surface a generic not-found; callers may rethrow a more
            // specific exception (e.g. VesselNotFoundException).
            throw new RecordNotFoundException(this.entityName, causeMessage);
          }

          default:
            throw new DatabaseOperationException(operation, error);
        }
      }

      // Non-Prisma errors are wrapped as infrastructure exceptions so
      // they are still caught by the global exception filter.
      if (error instanceof Error) {
        this.logger.error(
          `Unexpected error during "${operation}" on ${this.entityName}: ${error.message}`,
          error.stack,
        );
        throw new DatabaseOperationException(operation, error);
      }

      throw error;
    }
  }

  /**
   * Convenience wrapper for `prisma.$transaction` calls.
   *
   * Use this when a repository operation requires multiple atomic steps
   * (e.g. insert + audit log in a single transaction).
   *
   * @example
   * ```typescript
   * return this.runInTransaction(async (tx) => {
   *   const entity = await tx.vessel.create({ data });
   *   await tx.auditLog.create({ data: { ... } });
   *   return entity;
   * });
   * ```
   */
  protected async runInTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.handlePrismaError("transaction", () => this.getPrismaClient().$transaction(fn));
  }

  /**
   * Returns the underlying `PrismaClient` instance.
   *
   * Concrete repositories MUST implement this by returning their injected
   * `PrismaService` instance so that `runInTransaction` has access to
   * `$transaction`.
   *
   * @example
   * ```typescript
   * protected getPrismaClient(): PrismaClient {
   *   return this.prisma;   // injected PrismaService
   * }
   * ```
   */
  protected abstract getPrismaClient(): {
    $transaction: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T>;
  };
}
