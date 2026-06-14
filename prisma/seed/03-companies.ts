/* eslint-disable no-console */
import { PrismaClient, Company } from "@prisma/client";

export async function seedCompanies(prisma: PrismaClient): Promise<Record<string, Company>> {
  console.log("Seeding companies...");

  const companiesData = [
    {
      code: "ADMIN",
      name: "System Administrator Holding",
      type: "HOLDING" as const,
      country: "ID",
      isActive: true,
      address: "Gedung Maritime Lt. 10, Jakarta",
      email: "info@maritime-erp.com",
      phone: "+62215000123",
    },
    {
      code: "NJM",
      name: "PT Nusantara Jaya Maritim",
      type: "SHIP_OWNER" as const,
      country: "ID",
      isActive: true,
      address: "Jl. Maritim Raya No. 45, Jakarta Utara",
      email: "info@njm.co.id",
      phone: "+622143900123",
    },
    {
      code: "ASL",
      name: "PT Armada Sentosa Lines",
      type: "SHIP_MANAGER" as const,
      country: "ID",
      isActive: true,
      address: "Sudirman Office Tower Plaza B, Jakarta Selatan",
      email: "operations@asl.co.id",
      phone: "+622151500456",
    },
  ];

  const companies: Record<string, Company> = {};

  for (const data of companiesData) {
    const company = await prisma.company.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        type: data.type,
        country: data.country,
        isActive: data.isActive,
        address: data.address,
        email: data.email,
        phone: data.phone,
        updatedBy: "SEED",
      },
      create: {
        code: data.code,
        name: data.name,
        type: data.type,
        country: data.country,
        isActive: data.isActive,
        address: data.address,
        email: data.email,
        phone: data.phone,
        createdBy: "SEED",
        updatedBy: "SEED",
      },
    });
    companies[data.code] = company;
    console.log(`  - Company ${company.code}: ${company.name}`);
  }

  console.log("  ✅ Seeded companies.");
  return companies;
}
