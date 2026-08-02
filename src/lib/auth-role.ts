import { User } from "@supabase/supabase-js";
import { UserRole } from "@/types/slj";

/**
 * Resolves user role following the binahub-platform architecture:
 * 1. Primary: user.app_metadata.role (raw_app_meta_data)
 * 2. Secondary: Database profiles.role column
 * 3. Fallback: "participant"
 */
export function getUserRole(user?: User | null, dbProfileRole?: string | null): UserRole {
  if (!user) return "participant";

  // 1. Check app_metadata.role (raw_app_meta_data in Supabase)
  const appRole = user.app_metadata?.role;
  if (appRole === "admin" || appRole === "coach" || appRole === "participant") {
    return appRole as UserRole;
  }

  // Database profile role is used only after trusted app metadata.
  if (dbProfileRole === "admin" || dbProfileRole === "coach" || dbProfileRole === "participant") {
    return dbProfileRole as UserRole;
  }

  return "participant";
}

/**
 * Determines the target redirect path based on the classified role:
 * - admin -> /admin
 * - coach -> /coach
 * - participant (onboarding) -> /onboarding
 * - participant (active) -> /dashboard
 */
export function getRoleRedirectPath(role: UserRole, journeyStatus?: string | null): string {
  if (role === "admin") return "/admin";
  if (role === "coach") return "/coach";
  if (journeyStatus === "ONBOARDING") return "/onboarding";
  return "/dashboard";
}
