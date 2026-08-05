import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum, uniqueIndex, date, numeric, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
  ptpDraft: jsonb("ptp_draft"),
  ptpDraftUpdatedAt: timestamp("ptp_draft_updated_at"),
  ptpPublishedAt: timestamp("ptp_published_at"),
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
  frequencyKind: text("frequency_kind").default("daily").notNull(),
  customSchedule: jsonb("custom_schedule"),
  reminderTime: text("reminder_time"),
  target: integer("target").default(1),
  quantity: integer("quantity").default(1),
  areaCategory: text("area_category"),
  source: text("source").default("manual").notNull(), // 'action_plan' | 'manual'
  syncSource: text("sync_source").default("manual").notNull(),
  syncKey: text("sync_key"),
  effectiveFrom: text("effective_from"),
  effectiveUntil: text("effective_until"),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  actionPlanIdUnique: uniqueIndex("habits_action_plan_id_unique").on(table.actionPlanId),
  syncIdentityUnique: uniqueIndex("habits_sync_identity_unique").on(table.userId, table.syncSource, table.syncKey).where(sql`${table.syncKey} IS NOT NULL`),
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
  activityDate: date("activity_date"),
  occurrenceStart: date("occurrence_start"),
  isCanonicalOccurrence: boolean("is_canonical_occurrence").default(true).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedCount: integer("completed_count").default(0).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  occurrenceIdentityUnique: uniqueIndex("habit_logs_occurrence_identity_unique").on(table.habitId, table.occurrenceStart).where(sql`${table.isCanonicalOccurrence}`),
}));

export const journals = pgTable("journals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  activityDate: date("activity_date"),
  isCanonicalDay: boolean("is_canonical_day").default(true).notNull(),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(true).notNull(),
  mood: text("mood"),
  location: text("location"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  aiPolishedContent: text("ai_polished_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userActivityDateUnique: uniqueIndex("journals_user_activity_date_unique").on(table.userId, table.activityDate).where(sql`${table.isCanonicalDay}`),
}));

export const monthlyReviews = pgTable("monthly_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  monthNumber: integer("month_number").notNull(), // 1, 2, or 3
  status: text("status").notNull(), // 'ON_TRACK' | 'NEED_SUPPORT'
  participantNote: text("participant_note"),
  coachNote: text("coach_note"),
  coachRepliedAt: timestamp("coach_replied_at"),
  firstSubmittedAt: timestamp("first_submitted_at"),
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

export const ptpIndicators = pgTable("ptp_indicators", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantUserId: uuid("participant_user_id").notNull(),
  journeyId: uuid("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  area: text("area").notNull(),
  indicatorKey: text("indicator_key").notNull(),
  indicatorType: text("indicator_type").default("quantity").notNull(), // quality | quantity | time | cost
  label: text("label").notNull(),
  active: boolean("active").default(true).notNull(),
  direction: text("direction").notNull(),
  baselineValue: numeric("baseline_value"),
  targetValue: numeric("target_value"),
  unit: text("unit"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  journeyAreaKeyUnique: uniqueIndex("ptp_indicators_journey_area_key_unique").on(table.journeyId, table.area, table.indicatorKey),
  activeAreaTypeIndex: index("ptp_indicators_active_area_type_idx").on(table.journeyId, table.area, table.indicatorType),
}));

export const ptpIndicatorActuals = pgTable("ptp_indicator_actuals", {
  id: uuid("id").primaryKey().defaultRandom(),
  indicatorId: uuid("indicator_id").notNull().references(() => ptpIndicators.id, { onDelete: "cascade" }),
  participantUserId: uuid("participant_user_id").notNull(),
  journeyId: uuid("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  monthNumber: integer("month_number").notNull(),
  actualValue: numeric("actual_value").notNull(),
  evidenceNote: text("evidence_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  indicatorMonthUnique: uniqueIndex("ptp_indicator_actuals_indicator_month_unique").on(table.indicatorId, table.monthNumber),
}));

export const sahabatSafarPairingPeriods = pgTable("sahabat_safar_pairing_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  partnerUserId: uuid("partner_user_id").notNull(),
  pairedAt: timestamp("paired_at").defaultNow().notNull(),
  unpairedAt: timestamp("unpaired_at"),
  periodSource: text("period_source").default("recorded").notNull(), // recorded | legacy_estimate
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userPeriodIndex: index("sahabat_safar_pairing_periods_user_idx").on(table.userId, table.pairedAt),
}));

export const coachAssessments = pgTable("coach_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantUserId: uuid("participant_user_id").notNull(),
  journeyId: uuid("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  coachUserId: uuid("coach_user_id").notNull(),
  participantOutcome: numeric("participant_outcome"),
  coachScore: numeric("coach_score"),
  validatedOutcome: numeric("validated_outcome"),
  validationStatus: text("validation_status").default("BELUM_DITINJAU").notNull(),
  evidenceNote: text("evidence_note"),
  methodologyVersion: text("methodology_version").default("1.0").notNull(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coachAssessmentScores = pgTable("coach_assessment_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessmentId: uuid("assessment_id").notNull().references(() => coachAssessments.id, { onDelete: "cascade" }),
  rubricKey: text("rubric_key").notNull(),
  score: integer("score").notNull(),
  weight: numeric("weight").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  assessmentRubricUnique: uniqueIndex("coach_assessment_scores_assessment_rubric_unique").on(table.assessmentId, table.rubricKey),
}));

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
