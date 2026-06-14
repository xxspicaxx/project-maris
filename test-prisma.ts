import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

async function main(): Promise<void> {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const companies = await prisma.company.findMany();
    // eslint-disable-next-line no-console
    console.log("Koneksi sukses! Companies:", companies);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error query:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
