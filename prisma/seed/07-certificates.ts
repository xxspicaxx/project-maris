/* eslint-disable no-console */
import {
  PrismaClient,
  Company,
  Vessel,
  Seafarer,
  VesselCertType,
  SeafarerCertType,
  CertificateStatus,
} from "@prisma/client";

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export async function seedCertificates(
  prisma: PrismaClient,
  companies: Record<string, Company>,
  vessels: Record<string, Vessel>,
  seafarers: Seafarer[],
): Promise<void> {
  console.log("Seeding vessel and seafarer certificates...");

  const today = new Date();
  const njm = companies["NJM"];
  const asl = companies["ASL"];

  if (!njm || !asl) {
    throw new Error("NJM or ASL company not found. Cannot seed certificates.");
  }

  // Vessel list
  const vNJ1 = vessels["9100001"]; // MV Nusantara Jaya 1
  const vNJ2 = vessels["9100002"]; // MV Nusantara Jaya 2
  const vNJ3 = vessels["9100003"]; // MV Nusantara Jaya 3
  const vAS1 = vessels["9200001"]; // MV Sentosa Star
  const _vAS2 = vessels["9200002"]; // MV Sentosa Pearl (reserved for future certs)

  // Clean existing certificates
  await prisma.vesselCertificate.deleteMany({});
  await prisma.seafarerCertificate.deleteMany({});

  // 1. VESSEL CERTIFICATES
  const vesselCerts = [
    // MV Nusantara Jaya 1 Certs
    {
      companyId: njm.id,
      vesselId: vNJ1.id,
      certificateType: "SMC" as VesselCertType,
      certificateNumber: "SMC-NJ1-2026",
      issuingAuthority: "Ditjen Hubla",
      issueDate: addDays(today, -365),
      expiryDate: addDays(today, 180), // VALID (> 90 days)
      status: "VALID" as CertificateStatus,
    },
    {
      companyId: njm.id,
      vesselId: vNJ1.id,
      certificateType: "LOAD_LINE" as VesselCertType,
      certificateNumber: "LL-NJ1-2026",
      issuingAuthority: "Biro Klasifikasi Indonesia",
      issueDate: addDays(today, -300),
      expiryDate: addDays(today, 60), // EXPIRING_SOON (60 days)
      status: "EXPIRING_SOON" as CertificateStatus,
    },
    {
      companyId: njm.id,
      vesselId: vNJ1.id,
      certificateType: "ISSC" as VesselCertType,
      certificateNumber: "ISSC-NJ1-2026",
      issuingAuthority: "Ditjen Hubla",
      issueDate: addDays(today, -345),
      expiryDate: addDays(today, 20), // CRITICAL (20 days)
      status: "CRITICAL" as CertificateStatus,
    },
    {
      companyId: njm.id,
      vesselId: vNJ1.id,
      certificateType: "IOPP" as VesselCertType,
      certificateNumber: "IOPP-NJ1-2026",
      issuingAuthority: "Biro Klasifikasi Indonesia",
      issueDate: addDays(today, -365),
      expiryDate: addDays(today, -15), // EXPIRED (past)
      status: "EXPIRED" as CertificateStatus,
    },

    // MV Nusantara Jaya 2 Certs
    {
      companyId: njm.id,
      vesselId: vNJ2.id,
      certificateType: "DOC" as VesselCertType,
      certificateNumber: "DOC-NJ2-2026",
      issuingAuthority: "Ditjen Hubla",
      issueDate: addDays(today, -180),
      expiryDate: addDays(today, 185), // VALID
      status: "VALID" as CertificateStatus,
    },
    {
      companyId: njm.id,
      vesselId: vNJ2.id,
      certificateType: "CLASS_CERTIFICATE" as VesselCertType,
      certificateNumber: "CLS-NJ2-2026",
      issuingAuthority: "Biro Klasifikasi Indonesia",
      issueDate: addDays(today, -310),
      expiryDate: addDays(today, 55), // EXPIRING_SOON
      status: "EXPIRING_SOON" as CertificateStatus,
    },

    // MV Nusantara Jaya 3 Certs
    {
      companyId: njm.id,
      vesselId: vNJ3.id,
      certificateType: "RADIO_LICENSE" as VesselCertType,
      certificateNumber: "RAD-NJ3-2026",
      issuingAuthority: "Kemenkominfo",
      issueDate: addDays(today, -340),
      expiryDate: addDays(today, 25), // CRITICAL
      status: "CRITICAL" as CertificateStatus,
    },

    // MV Sentosa Star Certs
    {
      companyId: asl.id,
      vesselId: vAS1.id,
      certificateType: "SMC" as VesselCertType,
      certificateNumber: "SMC-SS-2026",
      issuingAuthority: "MPA Singapore",
      issueDate: addDays(today, -100),
      expiryDate: addDays(today, 265), // VALID
      status: "VALID" as CertificateStatus,
    },
    {
      companyId: asl.id,
      vesselId: vAS1.id,
      certificateType: "IOPP" as VesselCertType,
      certificateNumber: "IOPP-SS-2026",
      issuingAuthority: "DNV",
      issueDate: addDays(today, -380),
      expiryDate: addDays(today, -10), // EXPIRED
      status: "EXPIRED" as CertificateStatus,
    },
  ];

  for (const cert of vesselCerts) {
    await prisma.vesselCertificate.create({
      data: {
        ...cert,
        createdBy: "SEED",
        updatedBy: "SEED",
      },
    });
  }
  console.log(`  - Seeded ${vesselCerts.length} vessel certificates.`);

  // 2. SEAFARER CERTIFICATES
  if (seafarers.length > 0) {
    const seafarerCerts = [
      // Capt. Bambang Subianto (index 0) Certs
      {
        companyId: njm.id,
        seafarerId: seafarers[0].id,
        certificateType: "COC" as SeafarerCertType,
        certificateNumber: "COC-BAMB-001",
        issuingAuthority: "Ditjen Hubla",
        issuingCountry: "ID",
        issueDate: addDays(today, -720),
        expiryDate: addDays(today, 1000), // VALID
        status: "VALID" as CertificateStatus,
      },
      {
        companyId: njm.id,
        seafarerId: seafarers[0].id,
        certificateType: "STCW_GMDSS" as SeafarerCertType,
        certificateNumber: "GMDSS-BAMB-001",
        issuingAuthority: "Ditjen Hubla",
        issuingCountry: "ID",
        issueDate: addDays(today, -300),
        expiryDate: addDays(today, 65), // EXPIRING_SOON
        status: "EXPIRING_SOON" as CertificateStatus,
      },
      {
        companyId: njm.id,
        seafarerId: seafarers[0].id,
        certificateType: "MEDICAL_CERTIFICATE" as SeafarerCertType,
        certificateNumber: "MED-BAMB-001",
        issuingAuthority: "Balai Kesehatan Kerja Pelayaran",
        issuingCountry: "ID",
        issueDate: addDays(today, -345),
        expiryDate: addDays(today, 20), // CRITICAL
        status: "CRITICAL" as CertificateStatus,
      },

      // Chief Officer Hadi Wijaya (index 1) Certs
      {
        companyId: njm.id,
        seafarerId: seafarers[1].id,
        certificateType: "COC" as SeafarerCertType,
        certificateNumber: "COC-HADI-002",
        issuingAuthority: "Ditjen Hubla",
        issuingCountry: "ID",
        issueDate: addDays(today, -360),
        expiryDate: addDays(today, 1460), // VALID
        status: "VALID" as CertificateStatus,
      },
      {
        companyId: njm.id,
        seafarerId: seafarers[1].id,
        certificateType: "MEDICAL_CERTIFICATE" as SeafarerCertType,
        certificateNumber: "MED-HADI-002",
        issuingAuthority: "Balai Kesehatan Kerja Pelayaran",
        issuingCountry: "ID",
        issueDate: addDays(today, -380),
        expiryDate: addDays(today, -15), // EXPIRED
        status: "EXPIRED" as CertificateStatus,
      },

      // Chief Engineer Joko Susilo (index 2) Certs
      {
        companyId: njm.id,
        seafarerId: seafarers[2].id,
        certificateType: "COC" as SeafarerCertType,
        certificateNumber: "COC-JOKO-003",
        issuingAuthority: "Ditjen Hubla",
        issuingCountry: "ID",
        issueDate: addDays(today, -180),
        expiryDate: addDays(today, 1640), // VALID
        status: "VALID" as CertificateStatus,
      },
      {
        companyId: njm.id,
        seafarerId: seafarers[2].id,
        certificateType: "STCW_BST" as SeafarerCertType,
        certificateNumber: "BST-JOKO-003",
        issuingAuthority: "Pertamina Maritime Training Center",
        issuingCountry: "ID",
        issueDate: addDays(today, -1800),
        expiryDate: undefined, // BST basic doesn't expire
        status: "VALID" as CertificateStatus,
      },
    ];

    for (const cert of seafarerCerts) {
      await prisma.seafarerCertificate.create({
        data: {
          ...cert,
          createdBy: "SEED",
          updatedBy: "SEED",
        },
      });
    }
    console.log(`  - Seeded ${seafarerCerts.length} seafarer certificates.`);
  }

  console.log("  ✅ Seeded all certificates.");
}
