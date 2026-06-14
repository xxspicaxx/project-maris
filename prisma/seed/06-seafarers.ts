/* eslint-disable no-console */
import {
  PrismaClient,
  Company,
  Vessel,
  Seafarer,
  SeafarerStatus,
  Gender,
  CrewRank,
} from "@prisma/client";

export async function seedSeafarers(
  prisma: PrismaClient,
  companies: Record<string, Company>,
  vessels: Record<string, Vessel>,
): Promise<Seafarer[]> {
  console.log("Seeding seafarers and assignments...");

  const njmCompany = companies["NJM"];
  if (!njmCompany) {
    throw new Error("NJM Company not found. Cannot seed seafarers.");
  }

  const v1 = vessels["9100001"]; // MV Nusantara Jaya 1
  const v2 = vessels["9100002"]; // MV Nusantara Jaya 2

  const seafarersData = [
    {
      seamanBookNumber: "DIS-001234",
      firstName: "Bambang",
      lastName: "Subianto",
      nationality: "ID",
      dateOfBirth: new Date("1978-05-12"),
      placeOfBirth: "Surabaya",
      gender: "MALE" as Gender,
      passportNumber: "A-987654",
      passportExpiry: new Date("2030-01-01"),
      emergencyContact: { name: "Siti Subianto", phone: "+62812345678", relation: "Wife" },
      status: "ACTIVE" as SeafarerStatus,
      // Assignment details
      assignment: {
        vesselId: v1?.id,
        rank: "MASTER" as CrewRank,
        signOnDate: new Date("2026-02-15"),
        signOnPort: "Jakarta",
        contractDuration: 8,
        remarks: "Captain assignment",
      },
    },
    {
      seamanBookNumber: "DIS-001235",
      firstName: "Hadi",
      lastName: "Wijaya",
      nationality: "ID",
      dateOfBirth: new Date("1985-09-20"),
      placeOfBirth: "Semarang",
      gender: "MALE" as Gender,
      passportNumber: "A-987655",
      passportExpiry: new Date("2029-05-15"),
      emergencyContact: { name: "Budi Wijaya", phone: "+62812345679", relation: "Brother" },
      status: "ACTIVE" as SeafarerStatus,
      // Assignment details
      assignment: {
        vesselId: v1?.id,
        rank: "CHIEF_OFFICER" as CrewRank,
        signOnDate: new Date("2026-02-15"),
        signOnPort: "Jakarta",
        contractDuration: 8,
        remarks: "Chief Officer assignment",
      },
    },
    {
      seamanBookNumber: "DIS-001236",
      firstName: "Joko",
      lastName: "Susilo",
      nationality: "ID",
      dateOfBirth: new Date("1980-11-04"),
      placeOfBirth: "Cirebon",
      gender: "MALE" as Gender,
      passportNumber: "A-987656",
      passportExpiry: new Date("2031-03-22"),
      emergencyContact: { name: "Dewi Susilo", phone: "+62812345680", relation: "Wife" },
      status: "ACTIVE" as SeafarerStatus,
      // Assignment details
      assignment: {
        vesselId: v1?.id,
        rank: "CHIEF_ENGINEER" as CrewRank,
        signOnDate: new Date("2026-03-01"),
        signOnPort: "Jakarta",
        contractDuration: 6,
        remarks: "Chief Engineer assignment",
      },
    },
    {
      seamanBookNumber: "DIS-001237",
      firstName: "Eko",
      lastName: "Prasetyo",
      nationality: "ID",
      dateOfBirth: new Date("1992-07-18"),
      placeOfBirth: "Makassar",
      gender: "MALE" as Gender,
      passportNumber: "A-987657",
      passportExpiry: new Date("2028-10-12"),
      emergencyContact: { name: "Anisa Prasetyo", phone: "+62812345681", relation: "Wife" },
      status: "ACTIVE" as SeafarerStatus,
      // Assignment details
      assignment: {
        vesselId: v2?.id,
        rank: "BOSUN" as CrewRank,
        signOnDate: new Date("2026-04-10"),
        signOnPort: "Surabaya",
        contractDuration: 9,
        remarks: "Bosun assignment",
      },
    },
    {
      seamanBookNumber: "DIS-001238",
      firstName: "Agus",
      lastName: "Santoso",
      nationality: "ID",
      dateOfBirth: new Date("1995-12-05"),
      placeOfBirth: "Ambon",
      gender: "MALE" as Gender,
      passportNumber: "A-987658",
      passportExpiry: new Date("2029-12-05"),
      emergencyContact: { name: "Rina Santoso", phone: "+62812345682", relation: "Mother" },
      status: "ACTIVE" as SeafarerStatus,
      // Assignment details
      assignment: {
        vesselId: v2?.id,
        rank: "ABLE_SEAMAN" as CrewRank,
        signOnDate: new Date("2026-04-10"),
        signOnPort: "Surabaya",
        contractDuration: 9,
        remarks: "Able Seaman assignment",
      },
    },
  ];

  const seededSeafarers: Seafarer[] = [];

  for (const data of seafarersData) {
    const seafarer = await prisma.seafarer.upsert({
      where: { seamanBookNumber: data.seamanBookNumber },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        nationality: data.nationality,
        dateOfBirth: data.dateOfBirth,
        placeOfBirth: data.placeOfBirth,
        gender: data.gender,
        passportNumber: data.passportNumber,
        passportExpiry: data.passportExpiry,
        emergencyContact: data.emergencyContact,
        status: data.status,
        updatedBy: "SEED",
      },
      create: {
        companyId: njmCompany.id,
        seamanBookNumber: data.seamanBookNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        nationality: data.nationality,
        dateOfBirth: data.dateOfBirth,
        placeOfBirth: data.placeOfBirth,
        gender: data.gender,
        passportNumber: data.passportNumber,
        passportExpiry: data.passportExpiry,
        emergencyContact: data.emergencyContact,
        status: data.status,
        createdBy: "SEED",
        updatedBy: "SEED",
      },
    });

    seededSeafarers.push(seafarer);
    console.log(
      `  - Seafarer: ${seafarer.firstName} ${seafarer.lastName} (${data.assignment.rank})`,
    );

    // Add Assignment if vessel is specified
    if (data.assignment.vesselId) {
      // Clean existing assignments to avoid duplicates
      await prisma.crewAssignment.deleteMany({
        where: { seafarerId: seafarer.id },
      });

      await prisma.crewAssignment.create({
        data: {
          companyId: njmCompany.id,
          seafarerId: seafarer.id,
          vesselId: data.assignment.vesselId,
          rank: data.assignment.rank,
          signOnDate: data.assignment.signOnDate,
          signOnPort: data.assignment.signOnPort,
          contractDuration: data.assignment.contractDuration,
          remarks: data.assignment.remarks,
          createdBy: "SEED",
          updatedBy: "SEED",
        },
      });
      console.log(
        `    └─ Assigned to Vessel ID: ${data.assignment.vesselId} as ${data.assignment.rank}`,
      );
    }
  }

  console.log("  ✅ Seeded seafarers and assignments.");
  return seededSeafarers;
}
