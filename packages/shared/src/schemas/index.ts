/**
 * @maris/shared — Zod validation schemas
 */

import { z } from "zod";
import { CompanyType, FuelType, VesselType } from "../enums";

// ─── Pagination ─────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ─── Company ─────────────────────────────────────────────────

export const createCompanySchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(1).max(200),
  type: z.nativeEnum(CompanyType),
  country: z.string().length(2),
  address: z.string().max(500).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(30).optional(),
  taxId: z.string().max(50).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

// ─── Vessel ──────────────────────────────────────────────────

export const createVesselSchema = z.object({
  imoNumber: z.string().regex(/^IMO\d{7}$/, "Invalid IMO number format"),
  mmsiNumber: z
    .string()
    .regex(/^\d{9}$/, "Invalid MMSI number")
    .optional(),
  name: z.string().min(1).max(200),
  formerNames: z.array(z.string()).optional(),
  callSign: z.string().max(20).optional(),
  flagState: z.string().length(2),
  portOfRegistry: z.string().max(100).optional(),
  vesselType: z.nativeEnum(VesselType),
  grossTonnage: z.number().positive(),
  netTonnage: z.number().positive().optional(),
  deadweightTonnage: z.number().positive().optional(),
  lengthOverall: z.number().positive().optional(),
  breadth: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  yearBuilt: z.number().int().min(1900).max(2100).optional(),
  shipyard: z.string().max(200).optional(),
  shipyardCountry: z.string().length(2).optional(),
  classSociety: z.string().max(100).optional(),
  mainEngineType: z.string().max(200).optional(),
  mainEnginePower: z.number().positive().optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
});

export const updateVesselSchema = createVesselSchema.partial();

// ─── Seafarer ────────────────────────────────────────────────

export const createSeafarerSchema = z.object({
  seamanBookNumber: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  nationality: z.string().length(2),
  dateOfBirth: z.string().datetime(),
  placeOfBirth: z.string().max(100).optional(),
  passportNumber: z.string().max(50).optional(),
  passportExpiry: z.string().datetime().optional(),
  address: z.string().max(500).optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relation: z.string(),
    })
    .optional(),
  bankAccount: z
    .object({
      bankName: z.string(),
      accountNumber: z.string(),
      accountHolder: z.string(),
    })
    .optional(),
});

export const updateSeafarerSchema = createSeafarerSchema.partial();
