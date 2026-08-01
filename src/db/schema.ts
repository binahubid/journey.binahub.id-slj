import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum, uniqueIndex, date } from "drizzle-orm/pg-core";

export const journeyStatusEnum = pgEnum("journey_status", [
  "DRAFT",
  "ONBOARDING",
  "ACTIVE",
  "CHECKPOINT_1",
  "CHECKPOINT_2",
  "CHECKPOINT_3",
  "COMPLETED",
  "ARCHIVED",
]);

export const userRoleEnum = pgEnum("user_role", ["participant", "coach", "admin"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  companyName: text("company_name"),
  programCode: text("program_code"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("participant").notNull(),
  location: text("location").default("Jakarta").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  coachId: uuid("coach_id"),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journeys = pgTable("journeys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  status: journeyStatusEnum("status").default("DRAFT").notNull(),
  ptpStatus: text("ptp_status").default("EDITABLE").notNull(), // 'EDITABLE' | 'LOCKED'
  lockedAt: timestamp("locked_at"),
  lockedBy: uuid("locked_by"),
  muhasabah: text("muhasabah"),
  niat: text("niat"),
  areaTransformasi: jsonb("area_transformasi").$type<string[]>().default([]).notNull(),
  mainTarget: text("main_target"),
  successIndicators: jsonb("success_indicators").$type<string[]>().default([]).notNull(),
  finalReflection: text("final_reflection"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const actionPlans = pgTable("action_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  journeyId: uuid("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  frequency: text("frequency").default("daily").notNull(),
  reminderTime: text("reminder_time"),
  target: integer("target").default(1),
  quantity: integer("quantity").default(1),
  areaCategory: text("area_category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  actionPlanId: uuid("action_plan_id"),
  title: text("title").notNull(),
  category: text("category").notNull(),
  frequency: text("frequency").default("daily").notNull(),
  reminderTime: text("reminder_time"),
  target: integer("target").default(1),
  quantity: integer("quantity").default(1),
  areaCategory: text("area_category"),
  source: text("source").default("manual").notNull(), // 'action_plan' | 'manual'
  effectiveFrom: text("effective_from"),
  effectiveUntil: text("effective_until"),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  actionPlanIdUnique: uniqueIndex("habits_action_plan_id_unique").on(table.actionPlanId),
}));

export const ptpSnapshots = pgTable("ptp_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  journeyId: uuid("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  version: integer("version").default(1).notNull(),
  triggerType: text("trigger_type").default("INITIAL").notNull(), // 'INITIAL' | 'REVISION' | 'LOCKED'
  snapshotData: jsonb("snapshot_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habitLogs = pgTable("habit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  habitId: uuid("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  completed: boolean("completed").default(false).notNull(),
  completedCount: integer("completed_count").default(0).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journals = pgTable("journals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(true).notNull(),
  mood: text("mood"),
  location: text("location"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  aiPolishedContent: text("ai_polished_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monthlyReviews = pgTable("monthly_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  monthNumber: integer("month_number").notNull(), // 1, 2, or 3
  status: text("status").notNull(), // 'ON_TRACK' | 'NEED_SUPPORT'
  participantNote: text("participant_note"),
  coachNote: text("coach_note"),
  coachRepliedAt: timestamp("coach_replied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportTeam = pgTable("support_team", {
  id: uuid("id").primaryKey().defaultRandom(),
  journeyId: uuid("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  coachName: text("coach_name"),
  sahabatSafarName: text("sahabat_safar_name"),
  sahabatSafarUserId: uuid("sahabat_safar_user_id").references(() => profiles.userId, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const safarReminders = pgTable("safar_reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  sahabatSafarUserId: uuid("sahabat_safar_user_id").references(() => profiles.userId, { onDelete: "set null" }),
  date: date("date").notNull(),
  remindedAt: timestamp("reminded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  category: text("category").default("reminder").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => profiles.userId, { onDelete: "cascade" }),
  prayerNotificationsEnabled: boolean("prayer_notifications_enabled").default(true).notNull(),
  habitNotificationsEnabled: boolean("habit_notifications_enabled").default(true).notNull(),
  journalPrivacyDefault: boolean("journal_privacy_default").default(true).notNull(),
  preferredPrayerCity: text("preferred_prayer_city").default("Jakarta").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});
