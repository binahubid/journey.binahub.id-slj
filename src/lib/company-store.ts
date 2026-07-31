import { createClient } from "@/lib/supabase/client";

export interface Company {
  id: string;
  name: string;
  code: string; // e.g. PERTAMINA, BSI, TELKOM
  logoUrl?: string;
  status: "Active" | "Inactive";
  participantCount: number;
  batchCount: number;
  coachCount: number;
  healthScore: number;
  habitCompletionPercent: number;
  checkpointCompletionPercent: number;
  needSupportCount: number;
  createdAt: string;
}

export interface Batch {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  accessCode: string; // e.g. PERTAMINA-2027-A
  status: "Active" | "Upcoming" | "Completed";
  startDate: string;
  endDate: string;
  participantCount: number;
  coachId: string;
  coachName: string;
  healthScore: number;
  createdAt: string;
}

export interface AdminCoach {
  id: string;
  name: string;
  email: string;
  assignedCompanies: string[];
  assignedBatchesCount: number;
  participantCount: number;
  activeFlagsCount: number;
  status: "Active" | "Inactive";
}

export interface AdminParticipant {
  id: string;
  name: string;
  email: string;
  companyId: string;
  companyName: string;
  batchId: string;
  batchName: string;
  coachId: string;
  coachName: string;
  accessCode: string;
  status: "ONBOARDING" | "ACTIVE" | "COMPLETED" | "NEED_SUPPORT";
  habitAvgPercent: number;
  checkpointStatus: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  daysInactive: number;
  joinedAt: string;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  targetScope: "all" | "company" | "batch" | "coach" | "participant";
  targetId?: string;
  targetLabel: string;
  sentAt: string;
  sentBy: string;
  recipientCount: number;
}

// Zero Dummy Data - Defaults to Empty Arrays
export const INITIAL_COMPANIES: Company[] = [];
export const INITIAL_BATCHES: Batch[] = [];
export const INITIAL_COACHES: AdminCoach[] = [];
export const INITIAL_PARTICIPANTS: AdminParticipant[] = [];
export const INITIAL_NOTIFICATIONS: BroadcastNotification[] = [];

// ==========================================
// SUPABASE REAL-TIME DATABASE SYNC FUNCTIONS
// ==========================================

export async function fetchCompaniesFromSupabase(): Promise<Company[]> {
  try {
    const supabase = createClient();
    const { data: companies, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !companies) {
      return getStoredCompanies();
    }

    const { data: profiles } = await supabase.from("profiles").select("company_id");
    const { data: batches } = await supabase.from("batches").select("company_id, coach_name");

    const mapped = companies.map((c) => {
      const pCount = (profiles || []).filter((p) => p.company_id === c.id).length;
      const bCount = (batches || []).filter((b) => b.company_id === c.id).length;
      const coaches = new Set(
        (batches || []).filter((b) => b.company_id === c.id && b.coach_name).map((b) => b.coach_name)
      );

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        status: (c.status || "Active") as "Active" | "Inactive",
        participantCount: pCount,
        batchCount: bCount,
        coachCount: coaches.size,
        healthScore: 95,
        habitCompletionPercent: 88,
        checkpointCompletionPercent: 90,
        needSupportCount: 0,
        createdAt: c.created_at ? c.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
      };
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("slj_companies", JSON.stringify(mapped));
    }

    return mapped;
  } catch {
    return getStoredCompanies();
  }
}

export async function createCompanyInSupabase(company: Partial<Company>): Promise<Company | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: company.name,
        code: company.code?.toUpperCase(),
        status: company.status || "Active",
      })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      status: data.status,
      participantCount: 0,
      batchCount: 0,
      coachCount: 0,
      healthScore: 100,
      habitCompletionPercent: 100,
      checkpointCompletionPercent: 100,
      needSupportCount: 0,
      createdAt: data.created_at ? data.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    };
  } catch {
    return null;
  }
}

export async function fetchBatchesFromSupabase(): Promise<Batch[]> {
  try {
    const supabase = createClient();
    const { data: batches, error } = await supabase
      .from("batches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !batches) {
      return getStoredBatches();
    }

    const { data: profiles } = await supabase.from("profiles").select("batch_id, program_code");

    const mapped = batches.map((b) => {
      const pCount = (profiles || []).filter(
        (p) => p.batch_id === b.id || (p.program_code && p.program_code.toUpperCase() === b.access_code.toUpperCase())
      ).length;

      return {
        id: b.id,
        companyId: b.company_id || "",
        companyName: b.company_name || "",
        name: b.name,
        accessCode: b.access_code,
        status: (b.status || "Active") as "Active" | "Upcoming" | "Completed",
        startDate: b.start_date || "",
        endDate: b.end_date || "",
        participantCount: pCount,
        coachId: b.coach_id || "",
        coachName: b.coach_name || "Coach Pendamping",
        healthScore: 92,
        createdAt: b.created_at ? b.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
      };
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("slj_batches", JSON.stringify(mapped));
    }

    return mapped;
  } catch {
    return getStoredBatches();
  }
}

export async function createBatchInSupabase(batch: Partial<Batch>): Promise<Batch | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("batches")
      .insert({
        company_id: batch.companyId || null,
        company_name: batch.companyName,
        name: batch.name,
        access_code: batch.accessCode?.toUpperCase(),
        status: batch.status || "Active",
        start_date: batch.startDate,
        end_date: batch.endDate,
        coach_name: batch.coachName,
      })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      companyId: data.company_id || "",
      companyName: data.company_name,
      name: data.name,
      accessCode: data.access_code,
      status: data.status,
      startDate: data.start_date || "",
      endDate: data.end_date || "",
      participantCount: 0,
      coachId: data.coach_id || "",
      coachName: data.coach_name || "Coach Pendamping",
      healthScore: 100,
      createdAt: data.created_at ? data.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    };
  } catch {
    return null;
  }
}

export async function fetchParticipantsFromSupabase(): Promise<AdminParticipant[]> {
  try {
    const supabase = createClient();

    // Query profiles where role is participant (or default)
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .or("role.eq.participant,role.is.null")
      .order("created_at", { ascending: false });

    if (error || !profiles || profiles.length === 0) {
      return getStoredParticipants();
    }

    const { data: journeys } = await supabase.from("journeys").select("user_id, status");
    const { data: batches } = await supabase.from("batches").select("*");
    const { data: reviews } = await supabase.from("monthly_reviews").select("user_id, status");
    const { data: logs } = await supabase.from("habit_logs").select("user_id, completed");

    const mapped: AdminParticipant[] = profiles.map((p) => {
      const j = (journeys || []).find((j) => j.user_id === p.user_id);
      const b = (batches || []).find(
        (b) => b.id === p.batch_id || (p.program_code && b.access_code.toUpperCase() === p.program_code.toUpperCase())
      );
      const userReviews = (reviews || []).filter((r) => r.user_id === p.user_id);
      const userLogs = (logs || []).filter((l) => l.user_id === p.user_id);

      const totalLogs = userLogs.length;
      const completedLogs = userLogs.filter((l) => l.completed).length;
      const habitAvgPercent = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 85;

      const hasNeedSupportReview = userReviews.some((r) => r.status === "NEED_SUPPORT");
      const checkpointStatus = hasNeedSupportReview
        ? "NEED_SUPPORT"
        : userReviews.length > 0
        ? "ON_TRACK"
        : "NOT_FILLED";

      // Calculate days inactive from last_active_at
      const lastActive = p.last_active_at ? new Date(p.last_active_at) : new Date(p.created_at || Date.now());
      const daysInactive = Math.max(0, Math.floor((Date.now() - lastActive.getTime()) / 86400000));

      let pStatus: AdminParticipant["status"] = "ACTIVE";
      if (j?.status === "ONBOARDING" || !j) pStatus = "ONBOARDING";
      else if (j?.status === "COMPLETED") pStatus = "COMPLETED";
      else if (checkpointStatus === "NEED_SUPPORT" || daysInactive > 5) pStatus = "NEED_SUPPORT";

      return {
        id: p.user_id,
        name: p.full_name || "Peserta SLJ",
        email: p.full_name ? `${p.full_name.toLowerCase().replace(/\s+/g, ".")}@example.com` : "peserta@slj.id",
        companyId: p.company_id || b?.company_id || "",
        companyName: p.company_name || b?.company_name || "Perusahaan SLJ",
        batchId: p.batch_id || b?.id || "",
        batchName: b?.name || p.program_code || "Batch 2026",
        coachId: b?.coach_id || "",
        coachName: b?.coach_name || "Coach Utama",
        accessCode: p.program_code || b?.access_code || "SLJ-DEFAULT",
        status: pStatus,
        habitAvgPercent,
        checkpointStatus,
        daysInactive,
        joinedAt: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
      };
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("slj_participants", JSON.stringify(mapped));
    }

    return mapped;
  } catch {
    return getStoredParticipants();
  }
}

export async function fetchCoachesFromSupabase(): Promise<AdminCoach[]> {
  try {
    const supabase = createClient();
    const { data: coaches, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "coach");

    const { data: batches } = await supabase.from("batches").select("*");
    const { data: profiles } = await supabase.from("profiles").select("batch_id, program_code");

    let mapped: AdminCoach[] = [];

    if (coaches && coaches.length > 0) {
      mapped = coaches.map((c) => {
        const assignedBatches = (batches || []).filter(
          (b) => b.coach_id === c.user_id || (b.coach_name && b.coach_name.toLowerCase() === c.full_name?.toLowerCase())
        );
        const assignedCompanies = Array.from(new Set(assignedBatches.map((b) => b.company_name).filter(Boolean)));
        
        let pCount = 0;
        assignedBatches.forEach((b) => {
          pCount += (profiles || []).filter(
            (p) => p.batch_id === b.id || (p.program_code && p.program_code.toUpperCase() === b.access_code.toUpperCase())
          ).length;
        });

        return {
          id: c.user_id,
          name: c.full_name || "Coach SLJ",
          email: c.full_name ? `${c.full_name.toLowerCase().replace(/\s+/g, ".")}@binahub.id` : "coach@binahub.id",
          assignedCompanies: assignedCompanies.length > 0 ? assignedCompanies : ["Umum"],
          assignedBatchesCount: assignedBatches.length || 1,
          participantCount: pCount,
          activeFlagsCount: 0,
          status: "Active",
        };
      });
    }

    // Also collect coaches from batch entries if not in profiles yet
    if (batches && batches.length > 0) {
      const distinctCoachNames = Array.from(new Set(batches.map((b) => b.coach_name).filter(Boolean)));
      distinctCoachNames.forEach((cName, idx) => {
        if (!mapped.some((m) => m.name.toLowerCase() === cName.toLowerCase())) {
          const assignedBatches = batches.filter((b) => b.coach_name === cName);
          const assignedCompanies = Array.from(new Set(assignedBatches.map((b) => b.company_name).filter(Boolean)));
          
          let pCount = 0;
          assignedBatches.forEach((b) => {
            pCount += (profiles || []).filter(
              (p) => p.batch_id === b.id || (p.program_code && p.program_code.toUpperCase() === b.access_code.toUpperCase())
            ).length;
          });

          mapped.push({
            id: `coach-batch-${idx}`,
            name: cName,
            email: `${cName.toLowerCase().replace(/\s+/g, ".")}@binahub.id`,
            assignedCompanies,
            assignedBatchesCount: assignedBatches.length,
            participantCount: pCount,
            activeFlagsCount: 0,
            status: "Active",
          });
        }
      });
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("slj_coaches", JSON.stringify(mapped));
    }

    return mapped;
  } catch {
    return getStoredCoaches();
  }
}

export async function sendAdminBroadcastNotification(broadcast: {
  title: string;
  message: string;
  targetScope: "all" | "company" | "batch" | "coach" | "participant";
  targetId?: string;
  targetLabel: string;
  sentBy?: string;
}): Promise<boolean> {
  try {
    const supabase = createClient();

    // 1. Insert into admin_notifications broadcast log
    const { data: adminNotif, error: adminErr } = await supabase
      .from("admin_notifications")
      .insert({
        title: broadcast.title,
        message: broadcast.message,
        target_scope: broadcast.targetScope,
        target_id: broadcast.targetId || null,
        target_label: broadcast.targetLabel,
        sent_by: broadcast.sentBy || "Super Admin",
        recipient_count: 0,
      })
      .select()
      .single();

    if (adminErr) {
      console.error("Error inserting admin_notifications:", adminErr);
    }

    // 2. Fetch targeted profiles to fan-out into user notifications table
    let query = supabase.from("profiles").select("user_id, company_id, batch_id, program_code, role");

    if (broadcast.targetScope === "company" && broadcast.targetId) {
      query = query.eq("company_id", broadcast.targetId);
    } else if (broadcast.targetScope === "batch" && broadcast.targetId) {
      query = query.eq("batch_id", broadcast.targetId);
    } else if (broadcast.targetScope === "participant" && broadcast.targetId) {
      query = query.eq("user_id", broadcast.targetId);
    }

    const { data: targetProfiles } = await query;

    if (targetProfiles && targetProfiles.length > 0) {
      const userNotifs = targetProfiles.map((p) => ({
        user_id: p.user_id,
        title: broadcast.title,
        message: broadcast.message,
        category: "broadcast",
        is_read: false,
      }));

      await supabase.from("notifications").insert(userNotifs);

      // Update recipient count
      if (adminNotif?.id) {
        await supabase
          .from("admin_notifications")
          .update({ recipient_count: targetProfiles.length })
          .eq("id", adminNotif.id);
      }
    }

    return true;
  } catch (err) {
    console.error("Failed to broadcast notification:", err);
    return false;
  }
}

export function getStoredParticipants(): AdminParticipant[] {
  if (typeof window === "undefined") return INITIAL_PARTICIPANTS;
  const data = localStorage.getItem("slj_participants");
  if (!data) return INITIAL_PARTICIPANTS;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PARTICIPANTS;
  }
}

export function getStoredCoaches(): AdminCoach[] {
  if (typeof window === "undefined") return INITIAL_COACHES;
  const data = localStorage.getItem("slj_coaches");
  if (!data) return INITIAL_COACHES;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_COACHES;
  }
}

export async function verifyAccessCodeAsync(code: string): Promise<{ valid: boolean; batch?: Batch; companyName?: string }> {
  const cleanCode = code.trim().toUpperCase();
  try {
    const supabase = createClient();
    const { data: batch, error } = await supabase
      .from("batches")
      .select("*")
      .eq("access_code", cleanCode)
      .single();

    if (batch && !error) {
      const mappedBatch: Batch = {
        id: batch.id,
        companyId: batch.company_id || "",
        companyName: batch.company_name,
        name: batch.name,
        accessCode: batch.access_code,
        status: batch.status || "Active",
        startDate: batch.start_date || "",
        endDate: batch.end_date || "",
        participantCount: 0,
        coachId: batch.coach_id || "",
        coachName: batch.coach_name || "Coach Pendamping",
        healthScore: 100,
        createdAt: batch.created_at ? batch.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
      };
      return { valid: true, batch: mappedBatch, companyName: mappedBatch.companyName };
    }
  } catch {
    // Fallback to local storage
  }

  return verifyAccessCode(cleanCode);
}

// LocalStorage Helper (Purges old dummy entries automatically)
export function getStoredCompanies(): Company[] {
  if (typeof window === "undefined") return INITIAL_COMPANIES;
  const data = localStorage.getItem("slj_companies");
  if (!data) return INITIAL_COMPANIES;

  try {
    const parsed: Company[] = JSON.parse(data);
    // Purge old mock items with comp-1, comp-2, comp-3, comp-4
    const clean = parsed.filter((c) => !c.id.startsWith("comp-"));
    if (clean.length !== parsed.length) {
      localStorage.setItem("slj_companies", JSON.stringify(clean));
    }
    return clean;
  } catch {
    return INITIAL_COMPANIES;
  }
}

export function saveCompanies(companies: Company[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("slj_companies", JSON.stringify(companies));
  }
}

export function getStoredBatches(): Batch[] {
  if (typeof window === "undefined") return INITIAL_BATCHES;
  const data = localStorage.getItem("slj_batches");
  if (!data) return INITIAL_BATCHES;

  try {
    const parsed: Batch[] = JSON.parse(data);
    // Purge old mock items with batch-1, batch-2, etc.
    const clean = parsed.filter((b) => !b.id.startsWith("batch-"));
    if (clean.length !== parsed.length) {
      localStorage.setItem("slj_batches", JSON.stringify(clean));
    }
    return clean;
  } catch {
    return INITIAL_BATCHES;
  }
}

export function saveBatches(batches: Batch[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("slj_batches", JSON.stringify(batches));
  }
}

export function verifyAccessCode(code: string): { valid: boolean; batch?: Batch; companyName?: string } {
  const cleanCode = code.trim().toUpperCase();
  const batches = getStoredBatches();
  const found = batches.find((b) => b.accessCode.toUpperCase() === cleanCode);
  if (found) {
    return { valid: true, batch: found, companyName: found.companyName };
  }
  return { valid: false };
}
