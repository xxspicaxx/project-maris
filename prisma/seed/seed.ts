import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ─── DEFAULT PERMISSIONS ──────────────────────────────────
  console.log("Creating default permissions...");

  const permissions = [
    // Fleet
    { resource: "vessel", action: "create", scope: "COMPANY" as const },
    { resource: "vessel", action: "read", scope: "COMPANY" as const },
    { resource: "vessel", action: "update", scope: "COMPANY" as const },
    { resource: "vessel", action: "delete", scope: "COMPANY" as const },
    { resource: "vessel", action: "certificate:manage", scope: "COMPANY" as const },
    // Crew
    { resource: "crew", action: "create", scope: "COMPANY" as const },
    { resource: "crew", action: "read", scope: "COMPANY" as const },
    { resource: "crew", action: "update", scope: "COMPANY" as const },
    { resource: "crew", action: "sign_on", scope: "COMPANY" as const },
    { resource: "crew", action: "sign_off", scope: "COMPANY" as const },
    { resource: "crew", action: "certificate:manage", scope: "COMPANY" as const },
    // Voyage
    { resource: "voyage", action: "create", scope: "COMPANY" as const },
    { resource: "voyage", action: "read", scope: "COMPANY" as const },
    { resource: "voyage", action: "update", scope: "COMPANY" as const },
    { resource: "voyage", action: "complete", scope: "COMPANY" as const },
    // Document
    { resource: "document", action: "upload", scope: "COMPANY" as const },
    { resource: "document", action: "read", scope: "COMPANY" as const },
    { resource: "document", action: "delete", scope: "COMPANY" as const },
    // User & Role Management
    { resource: "user", action: "read", scope: "COMPANY" as const },
    { resource: "user", action: "manage", scope: "COMPANY" as const },
    { resource: "role", action: "read", scope: "COMPANY" as const },
    { resource: "role", action: "manage", scope: "COMPANY" as const },
    // Company
    { resource: "company", action: "read", scope: "ALL" as const },
    { resource: "company", action: "manage", scope: "ALL" as const },
    // System
    { resource: "system", action: "config", scope: "ALL" as const },
  ];

  const createdPermissions: Record<string, string> = {};

  for (const perm of permissions) {
    const key = `${perm.resource}:${perm.action}`;
    const existing = await prisma.permission.findUnique({
      where: {
        resource_action_scope: {
          resource: perm.resource,
          action: perm.action,
          scope: perm.scope,
        },
      },
    });

    if (existing) {
      createdPermissions[key] = existing.id;
    } else {
      const created = await prisma.permission.create({ data: perm });
      createdPermissions[key] = created.id;
    }
  }

  console.log(`  ✅ ${permissions.length} permissions ready`);

  // ─── DEFAULT ROLES ────────────────────────────────────────
  console.log("Creating default roles...");

  const roles = [
    {
      name: "SUPER_ADMIN",
      displayName: "Super Administrator",
      description: "Administrator sistem dengan akses penuh ke semua perusahaan",
      isSystem: true,
      permissions: Object.values(createdPermissions),
    },
    {
      name: "COMPANY_ADMIN",
      displayName: "Admin Perusahaan",
      description: "Administrator perusahaan pelayaran",
      isSystem: true,
      permissions: [
        createdPermissions["vessel:create"],
        createdPermissions["vessel:read"],
        createdPermissions["vessel:update"],
        createdPermissions["vessel:delete"],
        createdPermissions["vessel:certificate:manage"],
        createdPermissions["crew:create"],
        createdPermissions["crew:read"],
        createdPermissions["crew:update"],
        createdPermissions["crew:sign_on"],
        createdPermissions["crew:sign_off"],
        createdPermissions["voyage:create"],
        createdPermissions["voyage:read"],
        createdPermissions["voyage:update"],
        createdPermissions["document:upload"],
        createdPermissions["document:read"],
        createdPermissions["user:read"],
        createdPermissions["user:manage"],
        createdPermissions["role:read"],
        createdPermissions["company:read"],
      ].filter(Boolean),
    },
    {
      name: "FLEET_MANAGER",
      displayName: "Fleet Manager",
      description: "Manajer armada kapal",
      isSystem: true,
      permissions: [
        createdPermissions["vessel:create"],
        createdPermissions["vessel:read"],
        createdPermissions["vessel:update"],
        createdPermissions["vessel:certificate:manage"],
        createdPermissions["crew:read"],
        createdPermissions["voyage:read"],
        createdPermissions["voyage:create"],
        createdPermissions["voyage:update"],
        createdPermissions["document:upload"],
        createdPermissions["document:read"],
      ].filter(Boolean),
    },
    {
      name: "CREWING_MANAGER",
      displayName: "Crewing Manager",
      description: "Manajer kru/crewing",
      isSystem: true,
      permissions: [
        createdPermissions["crew:create"],
        createdPermissions["crew:read"],
        createdPermissions["crew:update"],
        createdPermissions["crew:sign_on"],
        createdPermissions["crew:sign_off"],
        createdPermissions["crew:certificate:manage"],
        createdPermissions["vessel:read"],
        createdPermissions["document:upload"],
        createdPermissions["document:read"],
      ].filter(Boolean),
    },
    {
      name: "TECHNICAL_SUPER",
      displayName: "Technical Superintendent",
      description: "Superintendent teknis",
      isSystem: true,
      permissions: [
        createdPermissions["vessel:read"],
        createdPermissions["vessel:update"],
        createdPermissions["vessel:certificate:manage"],
        createdPermissions["document:upload"],
        createdPermissions["document:read"],
      ].filter(Boolean),
    },
    {
      name: "MASTER",
      displayName: "Master / Nakhoda",
      description: "Nakhoda kapal",
      isSystem: true,
      permissions: [
        createdPermissions["vessel:read"],
        createdPermissions["voyage:read"],
        createdPermissions["voyage:update"],
        createdPermissions["document:upload"],
        createdPermissions["document:read"],
      ].filter(Boolean),
    },
  ];

  const createdRoles: Record<string, string> = {};

  for (const roleData of roles) {
    const existing = await prisma.role.findUnique({
      where: { name: roleData.name },
    });

    if (existing) {
      createdRoles[roleData.name] = existing.id;
    } else {
      const role = await prisma.role.create({
        data: {
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: roleData.isSystem,
        },
      });
      createdRoles[roleData.name] = role.id;
    }

    // Assign permissions to role
    const roleId = createdRoles[roleData.name];
    if (roleData.permissions.length > 0) {
      for (const permissionId of roleData.permissions) {
        await prisma.rolePermission
          .create({
            data: { roleId, permissionId },
          })
          .catch(() => {
            // Skip if already exists
          });
      }
    }
  }

  console.log(`  ✅ ${roles.length} roles created`);

  // ─── DEFAULT COMPANY ──────────────────────────────────────
  console.log("Creating default company...");

  const defaultCompany = await prisma.company.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: {
      code: "ADMIN",
      name: "Administrator System",
      type: "HOLDING",
      country: "ID",
      isActive: true,
    },
  });

  console.log(`  ✅ Company: ${defaultCompany.name}`);

  // ─── SUPER ADMIN USER ─────────────────────────────────────
  console.log("Creating super admin user...");

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@maritime-erp.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!@#";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: "Super",
        lastName: "Admin",
        companyId: defaultCompany.id,
        isActive: true,
      },
    });

    // Assign SUPER_ADMIN role
    if (createdRoles["SUPER_ADMIN"]) {
      await prisma.userRole.create({
        data: {
          userId: admin.id,
          roleId: createdRoles["SUPER_ADMIN"],
          assignedBy: admin.id,
        },
      });
    }

    console.log(`  ✅ Admin user: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`  ✅ Admin user already exists: ${adminEmail}`);
  }

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
