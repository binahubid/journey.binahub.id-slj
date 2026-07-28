import { z } from "zod";

export const journalSchema = z.object({
  content: z.string().min(5, "Tuliskan minimal 5 karakter untuk jurnal harian."),
  isPrivate: z.boolean().default(true),
});

export type JournalInput = z.infer<typeof journalSchema>;
