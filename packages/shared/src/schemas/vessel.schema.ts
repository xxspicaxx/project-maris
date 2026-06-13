import { z } from "zod";

import { FuelType, VesselType } from "../enums";

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
