import { type User, type Role, type UserRole } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: uuidv4(),
    companyId: uuidv4(),
    email: `test-${uuidv4().substring(0, 8)}@maritime.com`,
    passwordHash: "$2b$12$uq443Qy6B9vH6w73/sN1y.5fUfWn49G.i/q.8VjZ7.wzL.w.l9.2G", // hashed "Password123!"
    firstName: "John",
    lastName: "Doe",
    phone: "+628123456789",
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function createMockRole(overrides?: Partial<Role>): Role {
  return {
    id: uuidv4(),
    name: "FLEET_MANAGER",
    displayName: "Fleet Manager",
    description: "Manager for fleet operations",
    isSystem: true,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockUserRole(
  userId: string,
  roleId: string,
  overrides?: Partial<UserRole>,
): UserRole {
  return {
    id: uuidv4(),
    userId,
    roleId,
    vesselId: null,
    assignedAt: new Date(),
    assignedBy: uuidv4(),
    ...overrides,
  };
}
