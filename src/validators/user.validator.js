import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Fullname is required"),
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "staff", "auditor"], { message: "Invalid role" }),
});
