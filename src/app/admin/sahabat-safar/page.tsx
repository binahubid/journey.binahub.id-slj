"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  HeartHandshake,
  Users,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
  MapPin,
  Building,
  Briefcase,
  Phone,
  Clock,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

// ── TYPES ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SafarProfileData = Record<string, any>;

interface ParticipantProfile {
  id: string;
  user_id: string;
  full_name: string;
  company_name: string | null;
  batch_id: string | null;
  batch_name?: string | null;
  location: string | null;
  avatar_url: string | null;
  sahabat_safar_user_id: string | null;
  sahabat_safar_name: string | null;
  safarData?: SafarProfileData;
  journey_id?: string;
}

interface MatchCandidate {
  profile: ParticipantProfile;
  score: number; // 0 - 100%
  genderMatch: boolean;
  layer2Score: number;
  layer1Score: number;
  layer3Score: number;
  reasons: string[];
}

// ── MATCHING ALGORITHM ──────────────────────────────────────────────────────

function calculateCompatibility(
  target: ParticipantProfile,
  candidate: ParticipantProfile
): MatchCandidate {
  const t1 = target.safarData?.layer1 || {};
  const c1 = candidate.safarData?.layer1 || {};
  const t2 = target.safarData?.layer2 || {};
  const c2 = candidate.safarData?.layer2 || {};
  const t3 = target.safarData?.layer3 || {};
  const c3 = candidate.safarData?.layer3 || {};
  const tp = target.safarData?.preferences || {};
  const cp = candidate.safarData?.preferences || {};

  // 1. STRICT GENDER CHECK (100% Mandatory Requirement)
  const targetGender = (t1.gender || "").trim().toLowerCase();
  const candidateGender = (c1.gender || "").trim().toLowerCase();
  const genderMatch = targetGender !== "" && targetGender === candidateGender;

  if (!genderMatch) {
    return {
      profile: candidate,
      score: 0,
      genderMatch: false,
      layer2Score: 0,
      layer1Score: 0,
      layer3Score: 0,
      reasons: ["Beda jenis kelamin (Wajib sesama jenis kelamin)"],
    };
  }

  const reasons: string[] = ["Sesama " + (t1.gender || "Jenis Kelamin")];

  // 2. LAYER 2: 5 FOCUS AREAS DISTANCE (Max 40 pts)
  const keys = [
    "spiritual_growth",
    "personal_development",
    "leadership_excellence",
    "relationship",
    "community_impact",
  ];
  let totalDiff = 0;
  keys.forEach((k) => {
    const valT = Number(t2[k]) || 0;
    const valC = Number(c2[k]) || 0;
    totalDiff += Math.abs(valT - valC);
  });
  const layer2Pct = Math.max(0, 1 - totalDiff / 200);
  const layer2Score = Math.round(layer2Pct * 40);
  if (layer2Score >= 30) {
    reasons.push("Prioritas 5 Area Transformasi Sangat Seirama (+ " + layer2Score + "%)");
  } else if (layer2Score >= 20) {
    reasons.push("Fokus Pertumbuhan Saling Melengkapi (+ " + layer2Score + "%)");
  }

  // 3. LAYER 1: DEMOGRAPHICS & COMM (Max 30 pts)
  let layer1Score = 0;
  const yearT = parseInt(t1.birthYear, 10);
  const yearC = parseInt(c1.birthYear, 10);
  if (!isNaN(yearT) && !isNaN(yearC)) {
    const ageDiff = Math.abs(yearT - yearC);
    if (ageDiff <= 3) {
      layer1Score += 10;
      reasons.push("Sebaya / Generasi Sama (" + yearT + " vs " + yearC + ")");
    } else if (ageDiff <= 7) {
      layer1Score += 6;
      reasons.push("Rentang Usia Dekat (Selisih " + ageDiff + " tahun)");
    }
  }

  if (t1.city && c1.city && t1.city.toLowerCase() === c1.city.toLowerCase()) {
    layer1Score += 10;
    reasons.push("Satu Kota Domisili (" + t1.city + ")");
  }

  if (t1.commTime && c1.commTime && t1.commTime === c1.commTime) {
    layer1Score += 5;
    reasons.push("Waktu Preferensi Diskusi Sama (" + t1.commTime + ")");
  }
  const commTMedia = t1.commMedia || [];
  const commCMedia = c1.commMedia || [];
  const sharedMedia = commTMedia.filter((m: string) => commCMedia.includes(m));
  if (sharedMedia.length > 0) {
    layer1Score += 5;
    reasons.push("Media Diskusi Favorit: " + sharedMedia.join(", "));
  }

  // 4. LAYER 3 & PREFERENCES (Max 30 pts)
  let layer3Score = 0;
  const sponT = t3.spontaneousSupport || [];
  const expC = c3.expectedSupport || [];
  const exchangeMatch = sponT.filter((s: string) => expC.includes(s));
  if (exchangeMatch.length > 0) {
    layer3Score += 15;
    reasons.push("Dukungan Saling Melengkapi: " + exchangeMatch.slice(0, 2).join(", "));
  } else {
    layer3Score += 8;
  }

  if (tp.commFrequency && cp.commFrequency && tp.commFrequency === cp.commFrequency) {
    layer3Score += 15;
    reasons.push("Ritme Komunikasi Sama (" + tp.commFrequency + ")");
  } else {
    layer3Score += 7;
  }

  const finalScore = Math.min(100, layer2Score + layer1Score + layer3Score);

  return {
    profile: candidate,
    score: finalScore,
    genderMatch: true,
    layer2Score,
    layer1Score,
    layer3Score,
    reasons,
  };
}

// ── MAIN ADMIN COMPONENT ────────────────────────────────────────────────────

export default function AdminSahabatSafarPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "Pria" | "Wanita">("ALL");
  const [tabView, setTabView] = useState<"UNPAIRED" | "PAIRED">("UNPAIRED");
  const [batchFilter, setBatchFilter] = useState<string>("ALL");
  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);

  // Selection & Matching Modal
  const [selectedTarget, setSelectedTarget] = useState<ParticipantProfile | null>(null);
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[]>([]);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingSuccess, setPairingSuccess] = useState<string | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);

  // Unpair Action Modal
  const [unpairTarget, setUnpairTarget] = useState<ParticipantProfile | null>(null);

  // ── LOAD DATA ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles (with batch_id)
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, company_name, batch_id, location, avatar_url, sahabat_safar_user_id, sahabat_safar_name")
        .eq("role", "participant")
        .order("full_name", { ascending: true });

      if (profErr) throw profErr;

      // 2. Fetch Sahabat Safar Profiles (Initial Process)
      const { data: safarProfiles } = await supabase
        .from("sahabat_safar_profiles")
        .select("*");

      const safarMap = new Map<string, any>();
      (safarProfiles || []).forEach((sp: any) => {
        safarMap.set(sp.user_id, sp);
      });

      // 3. Fetch Journeys
      const { data: journeys } = await supabase
        .from("journeys")
        .select("id, user_id");

      const journeyMap = new Map<string, string>();
      (journeys || []).forEach((j: any) => {
        journeyMap.set(j.user_id, j.id);
      });

      // 4. Fetch Batches (for names)
      const { data: batchData } = await supabase
        .from("batches")
        .select("id, name");

      const batchMap = new Map<string, string>();
      (batchData || []).forEach((b: any) => {
        batchMap.set(b.id, b.name);
      });
      setBatches(batchData || []);

      // Combine Data
      const combined: ParticipantProfile[] = (profs || []).map((p: any) => {
        const sData = safarMap.get(p.user_id);
        return {
          ...p,
          full_name: p.full_name || "Tanpa Nama",
          batch_name: batchMap.get(p.batch_id) || null,
          safarData: sData,
          journey_id: journeyMap.get(p.user_id),
        };
      });

      setParticipants(combined);
    } catch (err) {
      console.error("Gagal memuat data peserta admin Sahabat Safar:", err);
      setErrorMsg("Gagal memuat data. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── CALCULATE MATCH CANDIDATES ────────────────────────────────────────────

  const handleOpenMatchModal = (target: ParticipantProfile) => {
    setSelectedTarget(target);

    // Filter candidates: SAME GENDER + SAME BATCH + unpaired + filled initial process
    const candidates = participants.filter((p) => {
      if (p.user_id === target.user_id) return false;
      if (p.sahabat_safar_user_id) return false;
      if (!p.safarData?.is_completed) return false;
      if (p.batch_id !== target.batch_id) return false; // HARUS SATU BATCH
      return true;
    });

    const calculatedMatches: MatchCandidate[] = candidates
      .map((c) => calculateCompatibility(target, c))
      .filter((m) => m.genderMatch) // STRICT SAME GENDER ONLY
      .sort((a, b) => b.score - a.score);

    setMatchCandidates(calculatedMatches);
  };

  // ── PAIRING ACTION (SAVE BIDIRECTIONALLY TO DB & PROFILES) ───────────────────────────

  const handleExecutePairing = async (candidate: ParticipantProfile, matchScore: number) => {
    if (!selectedTarget) return;
    setPairingLoading(true);
    setPairingSuccess(null);
    setPairingError(null);

    try {
      const userA = selectedTarget;
      const userB = candidate;
      const { error } = await supabase.rpc("pair_sahabat_safar", {
        p_user_a: userA.user_id,
        p_user_b: userB.user_id,
      });
      if (error) throw error;

      setPairingSuccess(
        `Berhasil memasangkan ${userA.full_name} ↔ ${userB.full_name} (Skor Kecocokan ${matchScore}%)!`
      );
      await loadData();
      setTimeout(() => {
        setPairingSuccess(null);
        setSelectedTarget(null);
      }, 1800);
    } catch (err: any) {
      console.error("Gagal memasangkan Sahabat Safar:", err);
      setPairingError(err?.message || "Pasangan belum tersimpan. Silakan coba lagi.");
    } finally {
      setPairingLoading(false);
    }
  };

  // ── UNPAIR ACTION ─────────────────────────────────────────────────────────

  const handleExecuteUnpair = async () => {
    if (!unpairTarget) return;
    setPairingLoading(true);
    setPairingError(null);
    try {
      const { error } = await supabase.rpc("unpair_sahabat_safar", {
        p_user_id: unpairTarget.user_id,
      });
      if (error) throw error;

      setUnpairTarget(null);
      await loadData();
    } catch (err: any) {
      console.error("Gagal melepas pasangan:", err);
      setPairingError(err?.message || "Pasangan belum dapat dilepas. Silakan coba lagi.");
    } finally {
      setPairingLoading(false);
    }
  };

  // ── FILTERED DATA ─────────────────────────────────────────────────────────

  const filledCount = participants.filter((p) => p.safarData?.is_completed).length;
  const pairedCount = participants.filter((p) => p.sahabat_safar_user_id).length;
  const unpairedCount = filledCount - pairedCount;

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.company_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || "").toLowerCase().includes(searchQuery.toLowerCase());

    const pGender = p.safarData?.layer1?.gender || "";
    const matchesGender =
      genderFilter === "ALL" || pGender.toLowerCase() === genderFilter.toLowerCase();

    const matchesBatch =
      batchFilter === "ALL" || p.batch_id === batchFilter;

    const isPaired = Boolean(p.sahabat_safar_user_id);
    const matchesTab = tabView === "PAIRED" ? isPaired : !isPaired;

    return matchesSearch && matchesGender && matchesBatch && matchesTab;
  });

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* ─── HEADER BAR ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE5D9] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-[#C79A3C]" />
            <h1 className="text-2xl font-black text-[#071A33] tracking-tight">
              Sahabat Safar Pairing Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Kalkukator matching otomatis berbasis Initial Process (Sesama Jenis Kelamin & 5 Area Transformasi).
          </p>
        </div>

        <Button
          onClick={loadData}
          variant="outline"
          className="text-xs font-bold border-[#EAE5D9] text-[#071A33] hover:bg-[#FAF8F4]"
        >
          Refresh Data
        </Button>
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* ─── STAT KPI CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-[#EAE5D9] shadow-2xs space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Total Mengisi Initial Process
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#071A33]">{filledCount}</span>
            <span className="text-xs text-slate-500 font-semibold">
              dari {participants.length} Peserta
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Instrumen profil terdaftar di server.</p>
        </Card>

        <Card className="p-4 bg-emerald-50/60 border border-emerald-200 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
            Sudah Terpasangkan (Paired)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-900">{pairedCount}</span>
            <span className="text-xs font-bold text-emerald-700">
              {filledCount > 0 ? Math.round((pairedCount / filledCount) * 100) : 0}% Terhubung
            </span>
          </div>
          <p className="text-[11px] text-emerald-700">Tercatat 2-arah di profil & support_team.</p>
        </Card>

        <Card className="p-4 bg-amber-50/60 border border-amber-200 shadow-2xs space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">
            Belum Terpasangkan (Unpaired)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-900">{unpairedCount}</span>
            <span className="text-xs font-bold text-amber-800">Perlu Pairing</span>
          </div>
          <p className="text-[11px] text-amber-800">Siap dicarikan kandidat sesama jenis kelamin.</p>
        </Card>
      </div>

      {/* ─── TAB FILTER & SEARCH BAR ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EAE5D9] shadow-2xs">
        <div className="flex items-center gap-2 bg-[#FAF8F4] p-1 rounded-xl border border-[#EAE5D9]">
          <button
            type="button"
            onClick={() => setTabView("UNPAIRED")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              tabView === "UNPAIRED"
                ? "bg-[#071A33] text-amber-300 shadow-sm"
                : "text-slate-600 hover:text-[#071A33]"
            }`}
          >
            Belum Dipasangkan ({unpairedCount})
          </button>
          <button
            type="button"
            onClick={() => setTabView("PAIRED")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              tabView === "PAIRED"
                ? "bg-[#071A33] text-amber-300 shadow-sm"
                : "text-slate-600 hover:text-[#071A33]"
            }`}
          >
            Sudah Dipasangkan ({pairedCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Filter */}
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#EAE5D9] bg-white text-xs font-bold text-[#071A33] focus:outline-none focus:border-[#C79A3C]"
          >
            <option value="ALL">Semua Batch ({participants.length})</option>
            {batches.map((b) => {
              const count = participants.filter((p) => p.batch_id === b.id).length;
              return (
                <option key={b.id} value={b.id}>
                  {b.name} ({count})
                </option>
              );
            })}
          </select>

          <div className="flex items-center gap-1 bg-[#FAF8F4] p-1 rounded-xl border border-[#EAE5D9] text-xs">
            <button
              type="button"
              onClick={() => setGenderFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                genderFilter === "ALL" ? "bg-white text-[#071A33] shadow-xs" : "text-slate-500"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter("Pria")}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                genderFilter === "Pria" ? "bg-blue-600 text-white shadow-xs" : "text-slate-500"
              }`}
            >
              👨 Pria
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter("Wanita")}
              className={`px-2.5 py-1 rounded-lg font-bold ${
                genderFilter === "Wanita" ? "bg-rose-600 text-white shadow-xs" : "text-slate-500"
              }`}
            >
              👩 Wanita
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / kota / PT..."
              className="pl-9 text-xs h-9 border-[#EAE5D9] rounded-xl bg-white"
            />
          </div>
        </div>
      </div>

      {/* ─── PARTICIPANT LIST VIEW ──────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin h-8 w-8 border-3 border-[#071A33] border-t-transparent rounded-full" />
          <p className="text-xs text-slate-500 font-medium">Memuat instrumen & data peserta...</p>
        </div>
      ) : filteredParticipants.length === 0 ? (
        <Card className="p-12 text-center bg-white border-[#EAE5D9] rounded-2xl space-y-3">
          <HeartHandshake className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-[#071A33]">Tidak Ada Peserta Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {tabView === "UNPAIRED"
              ? "Semua peserta yang mengisi Initial Process sudah terpasangkan sebagai Sahabat Safar."
              : "Belum ada pasangan Sahabat Safar yang dibentuk."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredParticipants.map((p) => {
            const hasFilled = Boolean(p.safarData?.is_completed);
            const gender = p.safarData?.layer1?.gender || "Belum diisi";
            const birthYear = p.safarData?.layer1?.birthYear;
            const city = p.safarData?.layer1?.city || p.location || "Jakarta";

            return (
              <Card
                key={p.id}
                className="bg-white border-[#EAE5D9] p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-[#071A33] text-amber-300 font-black flex items-center justify-center text-sm shadow-sm">
                        {p.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#071A33] leading-snug">
                          {p.full_name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {p.company_name || "Perusahaan SLJ"}
                        </p>
                      </div>
                    </div>

                    <Badge
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 border-none ${
                        gender.toLowerCase() === "pria"
                          ? "bg-blue-100 text-blue-900"
                          : gender.toLowerCase() === "wanita"
                          ? "bg-rose-100 text-rose-900"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {gender === "Pria" ? "👨 Pria" : gender === "Wanita" ? "👩 Wanita" : "—"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1 bg-[#FAF8F4] px-2 py-0.5 rounded-lg border border-[#EAE5D9]">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {city}
                    </span>
                    {birthYear && (
                      <span className="flex items-center gap-1 bg-[#FAF8F4] px-2 py-0.5 rounded-lg border border-[#EAE5D9]">
                        Tahun {birthYear}
                      </span>
                    )}
                    {p.batch_name && (
                      <span className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-blue-700 font-bold">
                        <Building className="h-3 w-3 text-blue-400" />
                        {p.batch_name}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    {hasFilled ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Initial Process Terisi Lengkap</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Belum Mengisi Initial Process</span>
                      </div>
                    )}
                  </div>

                  {p.sahabat_safar_user_id && (
                    <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-1 text-xs">
                      <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">
                        Terpasangkan Dengan:
                      </span>
                      <p className="font-extrabold text-navy-900 flex items-center gap-1.5">
                        <HeartHandshake className="h-4 w-4 text-blue-600" />
                        {p.sahabat_safar_name || "Sahabat Safar"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  {p.sahabat_safar_user_id ? (
                    <Button
                      onClick={() => setUnpairTarget(p)}
                      variant="outline"
                      className="w-full text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50 h-9 rounded-xl gap-1.5"
                    >
                      <UserX className="h-3.5 w-3.5" /> Lepas Pasangan (Unpair)
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleOpenMatchModal(p)}
                      disabled={!hasFilled}
                      className="w-full text-xs font-bold bg-[#071A33] hover:bg-black text-amber-300 h-9 rounded-xl gap-1.5 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Cari Rekomendasi Pasangan
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── MODAL REKOMENDASI PAIRING MATCHING ENGINE ──────────────────────── */}
      {selectedTarget && (
        <Dialog open={!!selectedTarget} onOpenChange={() => setSelectedTarget(null)}>
          <DialogContent className="sm:max-w-3xl bg-white border border-[#EAE5D9] rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-[#EAE5D9] pb-4">
              <DialogTitle className="text-lg font-black text-[#071A33] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Rekomendasi Sahabat Safar untuk: {selectedTarget.full_name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Sistem secara otomatis memfilter kandidat **SESAMA JENIS KELAMIN ({selectedTarget.safarData?.layer1?.gender || "Pria/Wanita"})** dan mengurutkan berdasarkan persentase kecocokan 5 Area Transformasi & Preferensi.
              </DialogDescription>
            </DialogHeader>

            {pairingSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{pairingSuccess}</span>
              </div>
            )}
            {pairingError && (
              <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <span>{pairingError}</span>
              </div>
            )}

            <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#EAE5D9] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-extrabold text-[#071A33] block">
                  {selectedTarget.full_name} ({selectedTarget.safarData?.layer1?.gender})
                </span>
                <span className="text-slate-500 font-medium">
                  {selectedTarget.company_name} • {selectedTarget.safarData?.layer1?.city || selectedTarget.location}
                </span>
              </div>
              <Badge className="bg-[#071A33] text-amber-300 font-bold text-xs">
                Mencari Kandidat Sesama {selectedTarget.safarData?.layer1?.gender}
              </Badge>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-[#071A33] uppercase tracking-wider">
                Kandidat Terbaik ({matchCandidates.length} Orang Sesuai)
              </h3>

              {matchCandidates.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    Belum Ada Kandidat Sesama {selectedTarget.safarData?.layer1?.gender} yang Belum Dipasangkan
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pastikan peserta lain berjenis kelamin {selectedTarget.safarData?.layer1?.gender} telah mengisi Initial Process.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchCandidates.map((m, idx) => {
                    const c = m.profile;
                    const cGender = c.safarData?.layer1?.gender;
                    const cCity = c.safarData?.layer1?.city || c.location;

                    return (
                      <Card
                        key={c.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
                          idx === 0
                            ? "bg-amber-50/40 border-amber-300 shadow-xs"
                            : "bg-white border-[#EAE5D9] hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-2xl bg-[#071A33] text-amber-300 flex flex-col items-center justify-center shrink-0 shadow-sm border border-amber-400/40">
                              <span className="text-base font-black leading-none">{m.score}%</span>
                              <span className="text-[8px] font-extrabold uppercase text-amber-200/80 mt-0.5">Match</span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-[#071A33]">
                                  {c.full_name}
                                </h4>
                                {idx === 0 && (
                                  <Badge className="bg-emerald-600 text-white font-extrabold text-[9px] px-2">
                                    💡 Rekomendasi Teratas
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium">
                                {c.company_name} • {cCity} • {cGender}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {m.reasons.map((r, rIdx) => (
                              <span
                                key={rIdx}
                                className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                          <Button
                            onClick={() => handleExecutePairing(c, m.score)}
                            disabled={pairingLoading}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs h-10 px-5 rounded-xl gap-1.5 shadow-sm w-full sm:w-auto"
                          >
                            <HeartHandshake className="h-4 w-4" /> Pasangkan Sekarang
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-[#EAE5D9] pt-3">
              <Button
                variant="outline"
                onClick={() => setSelectedTarget(null)}
                className="text-xs font-bold rounded-xl h-9"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── MODAL UNPAIR CONFIRMATION ──────────────────────────────────────── */}
      {unpairTarget && (
        <Dialog open={!!unpairTarget} onOpenChange={() => setUnpairTarget(null)}>
          <DialogContent className="sm:max-w-md bg-white border border-[#EAE5D9] rounded-2xl shadow-2xl p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-base font-black text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                Lepas Pasangan Sahabat Safar?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin melepas hubungan Sahabat Safar antara{" "}
                <strong>{unpairTarget.full_name}</strong> dan{" "}
                <strong>{unpairTarget.sahabat_safar_name}</strong>?
                Data pasangan di profil kedua peserta akan dikosongkan secara 2-arah.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="border-t border-slate-100 pt-3 gap-2">
              <Button
                variant="outline"
                onClick={() => setUnpairTarget(null)}
                className="text-xs font-bold rounded-xl h-9 flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleExecuteUnpair}
                disabled={pairingLoading}
                className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl h-9 px-5 flex-1"
              >
                {pairingLoading ? "Memproses..." : "Ya, Lepas Pasangan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
