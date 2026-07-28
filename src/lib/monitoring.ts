import { MonitoringAlert, JourneyStatus } from "@/types/slj";

/**
 * Evaluates alert flag rules defined in MONITORING-SYSTEM.md §3:
 * 1. "Perlu Perhatian — Habit Terhenti": No habit logs filled for 5 consecutive days.
 * 2. "Perlu Perhatian — Checkpoint Belum Diisi": Monthly checkpoint open > 7 days without completion.
 * 3. "Perlu Tindak Lanjut Coach": Last checkpoint status = "NEED_SUPPORT" and no coach reply for > 3 days.
 * 4. "Tidak Aktif": User inactive > 14 days (escalated to admin).
 */
export function evaluateParticipantAlert(participant: {
  id: string;
  fullName: string;
  dayCount: number;
  journeyStatus: JourneyStatus;
  habitCompletionPercent: number;
  lastHabitLogDaysAgo: number;
  lastActiveDaysAgo: number;
  lastCheckpointStatus?: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  checkpointOpenDaysAgo?: number;
  coachRepliedDaysAgo?: number;
}): MonitoringAlert {
  let flag: MonitoringAlert["flag"] = undefined;

  if (participant.lastActiveDaysAgo > 14) {
    flag = {
      type: "INACTIVE",
      label: "Tidak Aktif (>14 hari)",
    };
  } else if (
    participant.lastCheckpointStatus === "NEED_SUPPORT" &&
    (participant.coachRepliedDaysAgo === undefined || participant.coachRepliedDaysAgo > 3)
  ) {
    flag = {
      type: "COACH_ACTION_NEEDED",
      label: "Perlu Tindak Lanjut Coach",
    };
  } else if (
    participant.checkpointOpenDaysAgo !== undefined &&
    participant.checkpointOpenDaysAgo > 7 &&
    participant.lastCheckpointStatus === "NOT_FILLED"
  ) {
    flag = {
      type: "CHECKPOINT_UNFILLED",
      label: "Checkpoint Belum Diisi (>7 hari)",
    };
  } else if (participant.lastHabitLogDaysAgo >= 5) {
    flag = {
      type: "HABIT_HALTED",
      label: "Habit Terhenti (5 hari)",
    };
  }

  return {
    participantId: participant.id,
    participantName: participant.fullName,
    dayCount: participant.dayCount,
    journeyStatus: participant.journeyStatus,
    habitCompletionPercent: participant.habitCompletionPercent,
    lastCheckpointStatus: participant.lastCheckpointStatus,
    lastActiveAt: `${participant.lastActiveDaysAgo} hari lalu`,
    flag,
  };
}
