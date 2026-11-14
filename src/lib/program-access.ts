import type { SupabaseClient } from "@supabase/supabase-js";

export const TRIAL_DAYS = 14;
export const TRIAL_PROGRAM_CODE = "SLJ-TRIAL-14";

export type SljAccess = {
  kind: "none" | "program" | "trial" | "staff";
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  days: number;
  user_id: string;
  full_name: string;
  timezone: string;
  timezone_mode?: "AUTO" | "MANUAL";
  location?: string;
};

export async function getSljAccess(
  client: SupabaseClient,
): Promise<SljAccess | null> {
  const { data, error } = await client.rpc("slj_access_status");
  // Existing program accounts continue using their current onboarding during rollout.
  if (error?.code === "PGRST202") return null;
  if (error)
    throw new Error("Akses program belum dapat diperiksa. Silakan coba lagi.");
  if (
    !data ||
    !["none", "program", "trial", "staff"].includes(data.kind) ||
    typeof data.active !== "boolean"
  ) {
    throw new Error("Informasi akses program belum lengkap.");
  }
  return data as SljAccess;
}

export function getTrialDestination(
  access: SljAccess | null,
  pathname: string,
  programEnrollment = false,
) {
  if (access?.kind !== "trial") return null;
  if (pathname === "/onboarding" && programEnrollment) return null;
  if (
    ["/trial", "/profile", "/settings", "/notifications"].some(
      (path) => pathname === path || pathname.startsWith(path + "/"),
    )
  )
    return null;
  if (pathname === "/journal" && access.active) return null;
  return "/trial";
}

export function getTrialProgress(
  access: Pick<SljAccess, "starts_at" | "expires_at" | "active">,
  now = Date.now(),
) {
  const start = Date.parse(access.starts_at || "");
  const end = Date.parse(access.expires_at || "");
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return { day: 0, remainingDays: 0, percent: 0, expired: true };
  const expired = !access.active || now >= end;
  return {
    day: Math.min(
      TRIAL_DAYS,
      Math.max(1, Math.floor((now - start) / 86_400_000) + 1),
    ),
    remainingDays: expired
      ? 0
      : Math.max(1, Math.ceil((end - now) / 86_400_000)),
    percent: Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)),
    expired,
  };
}
