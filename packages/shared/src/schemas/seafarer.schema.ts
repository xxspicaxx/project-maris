import { z } from "zod";

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
