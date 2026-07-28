import { z } from "zod";

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter."),
  companyName: z.string().min(2, "Nama perusahaan/organisasi minimal 2 karakter."),
  programCode: z.string().min(3, "Kode program harus diisi (diberikan oleh admin)."),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
