/**
 * Base class for all domain exceptions.
 * Extend this class to create domain-specific exceptions.
 */
export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Base class for application layer exceptions.
 */
export abstract class ApplicationException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Base class for infrastructure layer exceptions.
 */
export abstract class InfrastructureException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
