import { z } from "zod";

export const createStockMovementSchema = z
  .object({
    productId: z.number().int().min(1, "Product ID must be valid"),
    movementType: z.enum(["stock_in", "stock_out", "adjustment"]),
    quantity: z.number().int().min(0, "Quantity cannot be negative"),
    referenceNo: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine(
    (data) =>
      data.movementType !== "adjustment" ||
      (data.reason && data.reason.trim().length > 0),
    { message: "Reason is required for adjustments", path: ["reason"] },
  )
  .refine((data) => data.movementType === "adjustment" || data.quantity >= 1, {
    message: "Quantity must be greater than 0",
    path: ["quantity"],
  });
