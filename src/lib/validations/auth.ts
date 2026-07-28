import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid. Silakan periksa kembali."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter."),
  email: z.string().email("Format email tidak valid. Silakan periksa kembali."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
  role: z.enum(["participant", "coach", "admin"]).default("participant"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
