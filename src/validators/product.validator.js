import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required").toUpperCase(),
  name: z.string().min(1, "Name is required"),
  categoryId: z.number().int().optional(),
  unit: z.enum(["pcs", "box", "kg"]).optional(),
  quantityOnHand: z
    .number()
    .int()
    .min(0, "Quantity cannot be negative")
    .optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  unit: z.enum(["pcs", "box", "kg"]).optional(),
  isActive: z.boolean().optional(),
  categoryId: z.number().int().nullable().optional(),
});
