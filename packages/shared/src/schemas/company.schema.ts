import { z } from "zod";

import { CompanyType } from "../enums";

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
