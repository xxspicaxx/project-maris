import { SetMetadata } from "@nestjs/common";

export interface AuditConfig {
  resource: string;
  captureOld?: boolean;
}

export const AUDIT_KEY = "audit";

/**
 * Decorator to enable auditing for an endpoint.
 * Usage: @Audit({ resource: "vessel", captureOld: true })
 */
export const Audit = (config: AuditConfig) => SetMetadata(AUDIT_KEY, config);
