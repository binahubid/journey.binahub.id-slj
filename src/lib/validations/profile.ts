import { z } from "zod";

export const profileSettingsSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter."),
  location: z.string().min(2, "Lokasi kota harus diisi untuk jadwal sholat."),
  prayerNotificationsEnabled: z.boolean(),
  habitNotificationsEnabled: z.boolean(),
  journalPrivacyDefault: z.boolean(),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
