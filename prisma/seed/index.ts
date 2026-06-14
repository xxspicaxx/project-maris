/* eslint-disable no-console */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import "dotenv/config";
import { seedPermissions } from "./01-permissions";
import { seedRoles } from "./02-roles";
import { seedCompanies } from "./03-companies";
import { seedUsers } from "./04-users";
import { seedVessels } from "./05-vessels";
import { seedSeafarers } from "./06-seafarers";
import { seedCertificates } from "./07-certificates";

async function main(): Promise<void> {
  console.log("🚀 Starting database seeding...");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not defined!");
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    // 01. Seed permissions
    const permissions = await seedPermissions(prisma);

    // 02. Seed roles
    const roles = await seedRoles(prisma, permissions);

    // 03. Seed companies
    const companies = await seedCompanies(prisma);

    // 04. Seed users
    const _users = await seedUsers(prisma, roles, companies);

    // 05. Seed vessels
    const vessels = await seedVessels(prisma, companies);

    // 06. Seed seafarers
    const seafarers = await seedSeafarers(prisma, companies, vessels);

    // 07. Seed certificates
    await seedCertificates(prisma, companies, vessels, seafarers);

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
