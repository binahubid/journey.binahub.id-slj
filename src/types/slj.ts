export enum JourneyStatus {
  DRAFT = "DRAFT",
  ONBOARDING = "ONBOARDING",
  ACTIVE = "ACTIVE",
  CHECKPOINT_1 = "CHECKPOINT_1",
  CHECKPOINT_2 = "CHECKPOINT_2",
  CHECKPOINT_3 = "CHECKPOINT_3",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export type UserRole = "participant" | "coach" | "admin";

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  companyName?: string;
  programCode?: string;
  avatarUrl?: string;
  role: UserRole;
  location: string;
  startDate?: string;
  endDate?: string;
  coachId?: string;
  createdAt: string;
}

export interface Journey {
  id: string;
  userId: string;
  status: JourneyStatus;
  muhasabah?: string;
  niat?: string;
  areaTransformasi: string[];
  mainTarget?: string;
  successIndicators: string[];
  finalReflection?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  actionPlanId?: string;
  title: string;
  category: string;
  frequency: "daily" | "weekly" | "custom";
  reminderTime?: string;
  target?: number;
  source: "action_plan" | "manual";
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  note?: string;
  createdAt: string;
}

export interface Journal {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  content: string;
  isPrivate: boolean;
  aiPolishedContent?: string;
  createdAt: string;
}

export interface MonthlyReview {
  id: string;
  userId: string;
  monthNumber: 1 | 2 | 3;
  status: "ON_TRACK" | "NEED_SUPPORT";
  participantNote?: string;
  coachNote?: string;
  coachRepliedAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  category: "reminder" | "checkpoint" | "coach" | "system";
  createdAt: string;
}

export interface MonitoringAlert {
  participantId: string;
  participantName: string;
  dayCount: number;
  journeyStatus: JourneyStatus;
  habitCompletionPercent: number; // 7-day avg
  lastCheckpointStatus?: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  lastActiveAt: string;
  flag?: {
    type: "HABIT_HALTED" | "CHECKPOINT_UNFILLED" | "COACH_ACTION_NEEDED" | "INACTIVE";
    label: string;
  };
}
