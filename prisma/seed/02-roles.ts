/* eslint-disable no-console */
import { PrismaClient, Permission, Role } from "@prisma/client";

interface RoleSeed {
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  permissionMatcher: (p: Permission) => boolean;
}

export async function seedRoles(prisma: PrismaClient, permissions: Permission[]): Promise<Role[]> {
  console.log("Seeding roles and mapping permissions...");

  const rolesToSeed: RoleSeed[] = [
    {
      name: "SUPER_ADMIN",
      displayName: "Super Admin",
      description: "Super Administrator with full access across all companies",
      isSystem: true,
      // scope: ALL untuk semua
      permissionMatcher: (p) => p.scope === "ALL",
    },
    {
      name: "COMPANY_ADMIN",
      displayName: "Company Admin",
      description: "Company Administrator with full access within their company",
      isSystem: true,
      // scope: COMPANY untuk semua
      permissionMatcher: (p) => p.scope === "COMPANY",
    },
    {
      name: "FLEET_MANAGER",
      displayName: "Fleet Manager",
      description: "Manages fleet operations, voyages, and vessel details within the company",
      isSystem: true,
      // vessel: COMPANY, crew: COMPANY read-only, voyage: COMPANY
      permissionMatcher: (p) => {
        if (p.resource === "vessel" && p.scope === "COMPANY") return true;
        if (p.resource === "crew" && p.action === "read" && p.scope === "COMPANY") return true;
        if (p.resource === "voyage" && p.scope === "COMPANY") return true;
        return false;
      },
    },
    {
      name: "CREWING_MANAGER",
      displayName: "Crewing Manager",
      description: "Manages seafarers, assignments, and certificates within the company",
      isSystem: true,
      // crew: COMPANY, vessel: COMPANY read-only
      permissionMatcher: (p) => {
        if (p.resource === "crew" && p.scope === "COMPANY") return true;
        if (p.resource === "vessel" && p.action === "read" && p.scope === "COMPANY") return true;
        return false;
      },
    },
    {
      name: "TECHNICAL_SUPER",
      displayName: "Technical Superintendent",
      description: "Manages technical maintenance, PMS, and vessels within the company",
      isSystem: true,
      // technical: COMPANY, vessel: COMPANY
      permissionMatcher: (p) => {
        if (p.resource === "technical" && p.scope === "COMPANY") return true;
        if (p.resource === "vessel" && p.scope === "COMPANY") return true;
        return false;
      },
    },
    {
      name: "ISM_MANAGER",
      displayName: "ISM Manager",
      description: "Manages safety, HSSEQ compliance, and vessel certificates within the company",
      isSystem: true,
      // hsseq: COMPANY, vessel: COMPANY read-only
      permissionMatcher: (p) => {
        if (p.resource === "hsseq" && p.scope === "COMPANY") return true;
        if (p.resource === "vessel" && p.action === "read" && p.scope === "COMPANY") return true;
        return false;
      },
    },
    {
      name: "MASTER",
      displayName: "Master",
      description: "Vessel Master / Captain with operational access to assigned vessel",
      isSystem: true,
      // vessel: OWN, voyage: OWN, crew: OWN read-only
      permissionMatcher: (p) => {
        if (p.resource === "vessel" && p.scope === "OWN") return true;
        if (p.resource === "voyage" && p.scope === "OWN") return true;
        if (p.resource === "crew" && p.action === "read" && p.scope === "OWN") return true;
        return false;
      },
    },
    {
      name: "CHIEF_OFFICER",
      displayName: "Chief Officer",
      description: "Chief Officer with watchkeeping and cargo duties on assigned vessel",
      isSystem: true,
      // vessel: OWN read-only, voyage: OWN log, crew: OWN read-only
      permissionMatcher: (p) => {
        if (p.resource === "vessel" && p.action === "read" && p.scope === "OWN") return true;
        if (p.resource === "voyage" && p.scope === "OWN" && p.action !== "delete") return true;
        if (p.resource === "crew" && p.action === "read" && p.scope === "OWN") return true;
        return false;
      },
    },
    {
      name: "PORT_AGENT",
      displayName: "Port Agent",
      description:
        "External port agent with limited read-only access to voyages and port call documents",
      isSystem: true,
      // voyage: OWN read-only, document: OWN read-only
      permissionMatcher: (p) => {
        if (p.resource === "voyage" && p.action === "read" && p.scope === "OWN") return true;
        if (p.resource === "document" && p.action === "read" && p.scope === "OWN") return true;
        return false;
      },
    },
  ];

  const seededRoles: Role[] = [];

  for (const roleData of rolesToSeed) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        displayName: roleData.displayName,
        description: roleData.description,
        isSystem: roleData.isSystem,
        updatedBy: "SEED",
      },
      create: {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        isSystem: roleData.isSystem,
        createdBy: "SEED",
        updatedBy: "SEED",
      },
    });

    seededRoles.push(role);

    // Filter matched permissions
    const matchedPermissions = permissions.filter(roleData.permissionMatcher);

    // Clear existing permissions for this role first to avoid duplicates
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    if (matchedPermissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: matchedPermissions.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`  - Role ${role.name}: mapped ${matchedPermissions.length} permissions.`);
  }

  console.log(`  ✅ Seeded ${seededRoles.length} roles.`);
  return seededRoles;
}
