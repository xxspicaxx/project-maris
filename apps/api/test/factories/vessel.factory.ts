import {
  type Vessel,
  type VesselCertificate,
  VesselType,
  VesselStatus,
  FuelType,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { v4 as uuidv4 } from "uuid";

export function createMockVessel(overrides?: Partial<Vessel>): Vessel {
  return {
    id: uuidv4(),
    companyId: uuidv4(),
    imoNumber: `9${Math.floor(1000000 + Math.random() * 9000000)}`,
    mmsiNumber: `${Math.floor(100000000 + Math.random() * 900000000)}`,
    name: "MV Nusantara Pratama",
    formerNames: [],
    callSign: "YBDA",
    flagState: "ID",
    portOfRegistry: "Jakarta",
    vesselType: VesselType.BULK_CARRIER,
    status: VesselStatus.ACTIVE,
    grossTonnage: new Decimal(15000.5),
    netTonnage: new Decimal(8000.25),
    deadweightTonnage: new Decimal(25000),
    lengthOverall: new Decimal(180),
    breadth: new Decimal(28),
    depth: new Decimal(14),
    yearBuilt: 2018,
    shipyard: "Batam Shipyard",
    shipyardCountry: "ID",
    classNumber: "18A329",
    classSociety: "BKI",
    mainEngineType: "Wartsila 6RT-flex50D",
    mainEnginePower: new Decimal(9500),
    fuelType: FuelType.MDO,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: uuidv4(),
    updatedBy: uuidv4(),
    deletedAt: null,
    ...overrides,
  };
}

export function createMockCertificate(
  vesselId: string,
  overrides?: Partial<VesselCertificate>,
): VesselCertificate {
  return {
    id: uuidv4(),
    companyId: uuidv4(),
    vesselId,
    certificateType: "CLASS_CERTIFICATE",
    certificateNumber: `CERT-${uuidv4().substring(0, 8).toUpperCase()}`,
    issuingAuthority: "Biro Klasifikasi Indonesia",
    issueDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    status: "VALID",
    documentUrl: "https://minio.maritime-erp.com/certs/class-cert.pdf",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: uuidv4(),
    updatedBy: uuidv4(),
    deletedAt: null,
    ...overrides,
  };
}
