/* eslint-disable no-console */
import { PrismaClient, Company, Role, User } from "@prisma/client";
import * as bcrypt from "bcrypt";

const BCRYPT_SALT_ROUNDS = 12;

export async function seedUsers(
  prisma: PrismaClient,
  roles: Role[],
  companies: Record<string, Company>,
): Promise<Record<string, User>> {
  console.log("Seeding users and assigning roles...");

  const passwordHash = await bcrypt.hash("Password123!", BCRYPT_SALT_ROUNDS);

  // List of users to seed
  const usersData = [
    // Super Admin (Admin Holding)
    {
      email: "superadmin@maritime-erp.com",
      firstName: "Super",
      lastName: "Admin",
      companyCode: "ADMIN",
      roleName: "SUPER_ADMIN",
    },
    // NJM Users
    {
      email: "admin@njm.co.id",
      firstName: "Admin",
      lastName: "Nusantara",
      companyCode: "NJM",
      roleName: "COMPANY_ADMIN",
    },
    {
      email: "fleet@njm.co.id",
      firstName: "Fleet",
      lastName: "Manager NJM",
      companyCode: "NJM",
      roleName: "FLEET_MANAGER",
    },
    {
      email: "crewing@njm.co.id",
      firstName: "Crewing",
      lastName: "Manager NJM",
      companyCode: "NJM",
      roleName: "CREWING_MANAGER",
    },
    {
      email: "technical@njm.co.id",
      firstName: "Technical",
      lastName: "Super NJM",
      companyCode: "NJM",
      roleName: "TECHNICAL_SUPER",
    },
    {
      email: "ism@njm.co.id",
      firstName: "Safety",
      lastName: "Manager NJM",
      companyCode: "NJM",
      roleName: "ISM_MANAGER",
    },
    {
      email: "master@njm.co.id",
      firstName: "Master",
      lastName: "Nusantara",
      companyCode: "NJM",
      roleName: "MASTER",
    },
    {
      email: "chief_officer@njm.co.id",
      firstName: "Chief",
      lastName: "Officer NJM",
      companyCode: "NJM",
      roleName: "CHIEF_OFFICER",
    },
    {
      email: "port_agent@njm.co.id",
      firstName: "Port",
      lastName: "Agent NJM",
      companyCode: "NJM",
      roleName: "PORT_AGENT",
    },
    // ASL Users
    {
      email: "admin@asl.co.id",
      firstName: "Admin",
      lastName: "Armada",
      companyCode: "ASL",
      roleName: "COMPANY_ADMIN",
    },
    {
      email: "fleet@asl.co.id",
      firstName: "Fleet",
      lastName: "Manager ASL",
      companyCode: "ASL",
      roleName: "FLEET_MANAGER",
    },
    {
      email: "crewing@asl.co.id",
      firstName: "Crewing",
      lastName: "Manager ASL",
      companyCode: "ASL",
      roleName: "CREWING_MANAGER",
    },
    {
      email: "technical@asl.co.id",
      firstName: "Technical",
      lastName: "Super ASL",
      companyCode: "ASL",
      roleName: "TECHNICAL_SUPER",
    },
    {
      email: "ism@asl.co.id",
      firstName: "Safety",
      lastName: "Manager ASL",
      companyCode: "ASL",
      roleName: "ISM_MANAGER",
    },
    {
      email: "master@asl.co.id",
      firstName: "Master",
      lastName: "Armada",
      companyCode: "ASL",
      roleName: "MASTER",
    },
    {
      email: "chief_officer@asl.co.id",
      firstName: "Chief",
      lastName: "Officer ASL",
      companyCode: "ASL",
      roleName: "CHIEF_OFFICER",
    },
    {
      email: "port_agent@asl.co.id",
      firstName: "Port",
      lastName: "Agent ASL",
      companyCode: "ASL",
      roleName: "PORT_AGENT",
    },
  ];

  const seededUsers: Record<string, User> = {};
  const rolesMap = new Map(roles.map((r) => [r.name, r]));

  for (const u of usersData) {
    const company = companies[u.companyCode];
    if (!company) {
      console.warn(`  ⚠️ Company ${u.companyCode} not found for user ${u.email}. Skipping.`);
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        companyId: company.id,
        isActive: true,
        updatedBy: "SEED",
      },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        companyId: company.id,
        isActive: true,
        createdBy: "SEED",
        updatedBy: "SEED",
      },
    });

    seededUsers[u.email] = user;

    // Assign Role
    const role = rolesMap.get(u.roleName);
    if (!role) {
      console.warn(`  ⚠️ Role ${u.roleName} not found for user ${u.email}.`);
      continue;
    }

    // Clean existing user roles first to avoid duplicates
    await prisma.userRole.deleteMany({
      where: { userId: user.id },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        createdBy: "SEED",
        updatedBy: "SEED",
      },
    });

    console.log(`  - User ${user.email} (Company: ${u.companyCode}, Role: ${u.roleName})`);
  }

  console.log("  ✅ Seeded users.");
  return seededUsers;
}
