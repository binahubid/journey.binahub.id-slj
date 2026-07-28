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

    // Filter and return real records from DB
    const mapped = companies.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      status: (c.status || "Active") as "Active" | "Inactive",
      participantCount: 0,
      batchCount: 0,
      coachCount: 0,
      healthScore: 100,
      habitCompletionPercent: 100,
      checkpointCompletionPercent: 100,
      needSupportCount: 0,
      createdAt: c.created_at ? c.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    }));

    // Update localStorage to reflect only real DB records
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

    if (error) {
      console.error("Supabase createCompanyInSupabase error:", error);
      return null;
    }
    if (!data) return null;

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

    const mapped = batches.map((b) => ({
      id: b.id,
      companyId: b.company_id || "",
      companyName: b.company_name || "",
      name: b.name,
      accessCode: b.access_code,
      status: (b.status || "Active") as "Active" | "Upcoming" | "Completed",
      startDate: b.start_date || "",
      endDate: b.end_date || "",
      participantCount: 0,
      coachId: b.coach_id || "",
      coachName: b.coach_name || "Coach Pendamping",
      healthScore: 100,
      createdAt: b.created_at ? b.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    }));

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
