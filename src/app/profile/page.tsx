"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, MapPin, Calendar, Building2, Layers, HeartHandshake, Mail, Shield, Briefcase, MessageCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";
import { getSljAccess, getTrialProgress } from "@/lib/program-access";
import { getProgramDay } from "@/lib/program-timeline";
import { resolveParticipantTimeZone } from "@/lib/local-date";
import Grainient from "@/components/Grainient";

interface UserProfileData {
  displayId: string;
  fullName: string;
  email: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  dayNumber: number;
  progressPct: number;
  companyName: string;
  batchName: string;
  status: string;
  areaTransformasi: string[];
  sahabatSafarName?: string | null;
  gender?: string;
  birthYear?: string;
  city?: string;
  division?: string;
  position?: string;
  commTime?: string;
  commMedia?: string[];
  umrahExperience?: string;
}

/* ── Digital Passport sub-components ─────────────────────────────────────── */

function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="py-1">
      <div className="flex items-center gap-2 pb-3">
        <span className="text-accent">{icon}</span>
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          {title}
        </h2>
      </div>
      <div className="divide-y divide-slate-200/60">
        {children}
      </div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 min-w-0">
      <span className="text-xs text-slate-600 flex items-center gap-2 font-medium shrink-0">
        <span className="text-slate-600">{icon}</span>
        {label}
      </span>
      <span className="text-[13px] font-semibold text-navy-900 text-right min-w-0 truncate">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { dot: string; label: string; cls: string }> = {
    EXPIRED: { dot: "bg-slate-300", label: "Trial berakhir", cls: "bg-white/10 text-slate-200 border-white/20" },
    ACTIVE: { dot: "bg-emerald-400", label: "Aktif", cls: "bg-emerald-400/15 text-emerald-300 border-emerald-300/25" },
    ONBOARDING: { dot: "bg-amber-400", label: "Onboarding", cls: "bg-amber-400/15 text-amber-300 border-amber-300/25" },
    COMPLETED: { dot: "bg-blue-400", label: "Selesai", cls: "bg-blue-400/15 text-blue-300 border-blue-300/25" },
  };
  const c = config[status] || { dot: "bg-slate-400", label: status, cls: "bg-slate-400/15 text-slate-300 border-slate-300/25" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${c.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function ProfilePage() {
  const supabase = createClient();
  const [duration, setDuration] = useState(90);
  const [hasTrial, setHasTrial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileData>({
    displayId: "-",
    fullName: "Peserta SLJ",
    email: "-",
    role: "Peserta Program (Jamaah / Leader)",
    location: "Jakarta",
    startDate: "-",
    endDate: "-",
    dayNumber: 1,
    progressPct: 0,
    companyName: "Perusahaan Mitra",
    batchName: "Batch Executive 2027",
    status: "ONBOARDING",
    areaTransformasi: [],
  });

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Profile
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        const access = await getSljAccess(supabase);
        const trial = access?.kind === "trial";
        setDuration(trial ? 14 : 90);
        const { data: enrollment } = await supabase.from("slj_trial_enrollments")
          .select("user_id").eq("user_id", user.id).maybeSingle();
        setHasTrial(trial || Boolean(enrollment));

        // 2. Fetch Journey
        const { data: journey, error: journeyError } = await supabase
          .from("journeys")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (journeyError) throw journeyError;

        // 3. Fetch Batch & Company info
        let companyName = userProfile?.company_name || "Belum ditentukan";
        let batchName = trial ? "Uji coba spiritual 14 hari" : userProfile?.program_code || "Belum ditentukan";

        if (userProfile?.program_code) {
          const { data: batchData } = await supabase
            .from("batches")
            .select("name, company_name")
            .eq("access_code", userProfile.program_code)
            .maybeSingle();

          if (batchData) {
            batchName = batchData.name;
            if (batchData.company_name) companyName = batchData.company_name;
          }
        }

        // 4. Fetch Support Team for Sahabat Safar name fallback
        const { data: teamData } = await supabase
          .from("support_team")
          .select("sahabat_safar_name")
          .eq("user_id", user.id)
          .maybeSingle();

        const sahabatSafarName =
          userProfile?.sahabat_safar_name || teamData?.sahabat_safar_name || null;

        // 5. Fetch Initial Process (Sahabat Safar Profile) Step 1
        const { data: safarData } = await supabase
          .from("sahabat_safar_profiles")
          .select("layer1")
          .eq("user_id", user.id)
          .maybeSingle();

        const layer1 = safarData?.layer1 as Record<string, unknown> | undefined;

        const fullName = userProfile?.full_name || user.email?.split("@")[0] || "Peserta SLJ";
        const email = user.email || "-";
        const roleLabel =
          userProfile?.role === "admin"
            ? "Administrator Program"
            : userProfile?.role === "coach"
            ? "Coach Pendamping"
            : "Peserta Program (Jamaah / Leader)";

        const formatDate = (dStr?: string) => {
          if (!dStr) return "-";
          return new Date(dStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        };

        // Hitung hari journey & progress (90 hari)
        let dayNumber = 1;
        let progressPct = 0;
        if (userProfile?.start_date) {
          dayNumber = Math.min(90, getProgramDay(userProfile.start_date, new Date(), resolveParticipantTimeZone(userProfile.timezone, userProfile.timezone_mode || "AUTO")));
          progressPct = Math.min(100, Math.round((dayNumber / 90) * 100));
        }

        if (trial && access) {
          const progress = getTrialProgress(access);
          dayNumber = progress.day;
          progressPct = Math.round(progress.percent);
          companyName = "Peserta mandiri";
        }
        setProfile({
          displayId: userProfile?.display_id || "-",
          fullName,
          email,
          role: roleLabel,
          location: userProfile?.location || "Jakarta",
          startDate: formatDate(trial ? access?.starts_at || undefined : userProfile?.start_date),
          endDate: formatDate(trial ? access?.expires_at || undefined : userProfile?.end_date),
          dayNumber,
          progressPct,
          companyName,
          batchName,
          status: trial && !access?.active ? "EXPIRED" : journey?.status || "ONBOARDING",
          areaTransformasi: Array.isArray(journey?.area_transformasi) ? journey.area_transformasi : [],
          sahabatSafarName,
          gender: (layer1?.gender as string) || undefined,
          birthYear: (layer1?.birthYear as string) || undefined,
          city: (layer1?.city as string) || undefined,
          division: (layer1?.division as string) || undefined,
          position: (layer1?.role as string) || undefined,
          commTime: (layer1?.commTime as string) || undefined,
          commMedia: Array.isArray(layer1?.commMedia) ? layer1.commMedia as string[] : undefined,
          umrahExperience: (layer1?.umrahExperience as string) || undefined,
        });
      } catch (err) {
        console.error("Gagal memuat profil:", err);
        setErrorMsg("Profil belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center font-sans">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ParticipantLayout activePath="/profile" pageTitle="Profil Saya • Detail Peserta SLJ">

      <div className="max-w-wizard mx-auto pt-6 pb-24 space-y-5">
        {errorMsg && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{errorMsg}</div>}

        {/* ─── HERO: DIGITAL PASSPORT ─────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl text-white shadow-lg min-h-[320px]">
          {/* Grainient animated background — SLJ theme */}
          <div className="absolute inset-0">
            <Grainient
              color1="#C79A3C"
              color2="#0A1628"
              color3="#F5ECCB"
              timeSpeed={0.2}
              colorBalance={0}
              warpStrength={1}
              warpFrequency={5}
              warpSpeed={1.5}
              warpAmplitude={50}
              blendAngle={0}
              blendSoftness={0.05}
              rotationAmount={400}
              noiseScale={2}
              grainAmount={0.08}
              grainScale={2}
              grainAnimated={false}
              contrast={1.4}
              gamma={1}
              saturation={1.2}
              centerX={0}
              centerY={0}
              zoom={0.85}
            />
          </div>

          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#071A33]/70 via-[#071A33]/40 to-[#071A33]/80 pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-8">
            {/* ID badge — top right */}
            <div className="flex justify-end">
              <span className="font-mono text-xs font-bold text-amber-200 bg-white/10 border border-white/15 px-2.5 py-1 rounded-md tracking-wider">
                ID {profile.displayId}
              </span>
            </div>

            {/* Avatar + identity */}
            <div className="mt-4 flex items-end gap-4 sm:gap-5">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[26px] bg-gradient-to-br from-amber-300 to-amber-500 text-navy-900 flex items-center justify-center text-3xl sm:text-4xl font-black shadow-xl shrink-0 ring-1 ring-white/20">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight truncate">
                  {profile.fullName}
                </h1>
                <p className="text-xs sm:text-xs text-blue-200/75 mt-0.5">{profile.role}</p>
                <div className="mt-2.5">
                  <StatusPill status={profile.status} />
                </div>
              </div>
            </div>

            {/* Journey progress */}
            <div className="mt-7 pt-5 border-t border-white/10">
              <div className="flex items-baseline justify-between text-xs mb-2">
                <span className="font-semibold text-blue-100/90">
                  Hari ke-{profile.dayNumber} <span className="text-blue-200/50 font-normal">dari {duration}</span>
                </span>
                <span className="font-mono font-bold text-amber-300 tabular-nums">{profile.progressPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-700"
                  style={{ width: `${profile.progressPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-blue-200/55 font-medium">
                <span>{profile.startDate}</span>
                <span>{profile.endDate}</span>
              </div>
            </div>
          </div>
        </section>

        {hasTrial && (
          <Link
            href="/trial/result"
            className="flex min-h-11 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-navy-900 hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4 text-amber-700" aria-hidden="true" />
            Lihat hasil uji coba 14 hari
          </Link>
        )}

        {/* ─── INFO SECTIONS (BORDERLESS) ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-start">

          {/* Akun & Program */}
          <InfoSection title="Akun & Program" icon={<Layers className="h-3.5 w-3.5" />}>
            <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email Akun" value={profile.email} />
            <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Lokasi (Waktu Sholat)" value={profile.location} />
            <InfoRow
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Tanggal Program"
              value={`${profile.startDate}${profile.endDate !== "-" ? ` — ${profile.endDate}` : ""}`}
            />
            <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Perusahaan" value={profile.companyName} />
            <InfoRow icon={<Layers className="h-3.5 w-3.5" />} label="Batch Rombongan" value={profile.batchName} />
          </InfoSection>

          {/* Koneksi */}
          <InfoSection title="Koneksi & Sahabat Safar" icon={<HeartHandshake className="h-3.5 w-3.5" />}>
            <InfoRow
              icon={<HeartHandshake className="h-3.5 w-3.5" />}
              label="Sahabat Safar"
              value={
                profile.sahabatSafarName ? (
                  <span className="text-amber-900 bg-amber-100 font-bold px-2.5 py-0.5 rounded-full text-xs border border-amber-300">
                    {profile.sahabatSafarName}
                  </span>
                ) : (
                  <span className="text-slate-600 font-normal italic text-xs">Belum dipasangkan</span>
                )
              }
            />
            {profile.commTime && (
              <InfoRow icon={<MessageCircle className="h-3.5 w-3.5" />} label="Waktu Komunikasi" value={profile.commTime} />
            )}
            {profile.commMedia && profile.commMedia.length > 0 && (
              <InfoRow icon={<MessageCircle className="h-3.5 w-3.5" />} label="Media Komunikasi" value={profile.commMedia.join(", ")} />
            )}
            {profile.umrahExperience && (
              <InfoRow icon={<Sparkles className="h-3.5 w-3.5" />} label="Pengalaman Umrah" value={profile.umrahExperience} />
            )}
            {!profile.sahabatSafarName && !profile.commTime && !profile.commMedia && !profile.umrahExperience && (
              <p className="text-xs text-slate-600 italic py-2">Belum ada data koneksi.</p>
            )}
          </InfoSection>

          {/* Informasi Diri */}
          {(profile.gender || profile.birthYear || profile.city || profile.division || profile.position) && (
            <InfoSection title="Informasi Diri" icon={<User className="h-3.5 w-3.5" />}>
              {profile.gender && <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Gender" value={profile.gender} />}
              {profile.birthYear && <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Tahun Lahir" value={profile.birthYear} />}
              {profile.city && <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Kota Domisili" value={profile.city} />}
              {profile.division && <InfoRow icon={<Briefcase className="h-3.5 w-3.5" />} label="Divisi" value={profile.division} />}
              {profile.position && <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label="Posisi / Jabatan" value={profile.position} />}
            </InfoSection>
          )}

          {/* Area Transformasi */}
          <InfoSection title="Area Transformasi (PTP)" icon={<Sparkles className="h-3.5 w-3.5" />}>
            {profile.areaTransformasi.length === 0 ? (
              <p className="text-xs text-slate-600 italic py-2">Belum ada area transformasi terpilih.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.areaTransformasi.map((area, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold text-navy-900 bg-navy-50 border border-navy-100 px-2.5 py-1 rounded-lg"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}
          </InfoSection>
        </div>
      </div>
    </ParticipantLayout>
  );
}
