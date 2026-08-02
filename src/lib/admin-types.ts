/** Shared types for Admin pages — canonical monitoring & lifecycle */

export interface MonitoringRow {
  userId: string;
  fullName: string;
  companyId: string;
  companyName: string;
  batchId: string;
  batchName: string;
  coachId: string;
  coachName: string;
  habitAvgPercent: number;
  daysInactive: number;
  needsSupport: boolean;
  monthsReviewed: number;
  journeyStatus: string;
  ptpStatus: string;
}

/** Shape of a single row returned by get_admin_monitoring RPC */
export interface RawMonitoringRow {
  user_id: string;
  full_name: string | null;
  company_id: string | null;
  company_name: string | null;
  batch_id: string | null;
  batch_name: string | null;
  coach_id: string | null;
  coach_name: string | null;
  habit_avg_percent: number | null;
  days_inactive: number | null;
  needs_support: boolean | null;
  months_reviewed: number | null;
  journey_status: string | null;
  ptp_status: string | null;
}

/** Shape of get_company_referential_status RPC result */
export interface ReferentialStatus {
  batch_count: number;
  active_batch_count: number;
  participant_count: number;
  active_participant_count: number;
  coach_count: number;
  can_deactivate: boolean;
  can_delete: boolean;
}

/** Shape of run_monitoring_automation RPC result */
export interface AutomationResult {
  locked_ptps: number;
  inactivity_alerts: number;
  coach_response_alerts: number;
  executed_at: string;
}

/** Broadcast notification scope type */
export type BroadcastScope = "all" | "company" | "batch" | "coach" | "participant";

/** Helper: map raw RPC row to MonitoringRow */
export function mapMonitoringRow(r: RawMonitoringRow): MonitoringRow {
  return {
    userId: r.user_id,
    fullName: r.full_name || "Peserta",
    companyId: r.company_id || "",
    companyName: r.company_name || "",
    batchId: r.batch_id || "",
    batchName: r.batch_name || "",
    coachId: r.coach_id || "",
    coachName: r.coach_name || "",
    habitAvgPercent: r.habit_avg_percent ?? 0,
    daysInactive: r.days_inactive ?? 0,
    needsSupport: r.needs_support === true,
    monthsReviewed: r.months_reviewed ?? 0,
    journeyStatus: r.journey_status || "NOT_ENROLLED",
    ptpStatus: r.ptp_status || "EDITABLE",
  };
}
