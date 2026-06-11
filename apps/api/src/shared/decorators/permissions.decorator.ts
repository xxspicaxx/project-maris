import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";

/**
 * Decorator to specify required permissions for an endpoint.
 * Usage: @Permissions("vessel:create", "vessel:update")
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
