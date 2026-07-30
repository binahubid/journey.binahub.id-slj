"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Calendar, Building2, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";

interface UserProfileData {
  fullName: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  companyName: string;
  batchName: string;
  status: string;
  areaTransformasi: string[];
}

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData>({
    fullName: "Peserta SLJ",
    role: "Peserta Program (Jamaah / Leader)",
    location: "Jakarta",
    startDate: "-",
    endDate: "-",
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
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // 2. Fetch Journey
        const { data: journey } = await supabase
          .from("journeys")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Fetch Batch & Company info
        let companyName = userProfile?.company_name || "Corporate Mitra";
        let batchName = userProfile?.program_code || "Batch 1";

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

        const fullName = userProfile?.full_name || user.email?.split("@")[0] || "Peserta SLJ";
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

        setProfile({
          fullName,
          role: roleLabel,
          location: userProfile?.location || "Jakarta",
          startDate: formatDate(userProfile?.start_date),
          endDate: formatDate(userProfile?.end_date),
          companyName,
          batchName,
          status: journey?.status || "ONBOARDING",
          areaTransformasi: Array.isArray(journey?.area_transformasi) ? journey.area_transformasi : [],
        });
      } catch (err) {
        console.error("Gagal memuat profil:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center font-sans">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ParticipantLayout activePath="/profile" pageTitle="Profil Saya • Detail Peserta SLJ">

      <main className="max-w-wizard mx-auto px-4 md:px-6 pt-6 space-y-6">
        <Card className="bg-white border-warm-border p-6 space-y-6">
          <div className="flex items-center space-x-4 border-b border-warm-border pb-6">
            <div className="h-16 w-16 rounded-full bg-navy-900 text-accent font-bold flex items-center justify-center text-2xl shadow-md">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900">{profile.fullName}</h2>
              <p className="text-xs text-gray-500">{profile.role}</p>
              <Badge variant="accent" className="mt-2 text-[10px] uppercase font-semibold">
                Status: {profile.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-4 text-sm text-navy-900">
            <div className="flex items-center justify-between py-2 border-b border-warm-border">
              <span className="text-gray-500 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" /> Lokasi (Waktu Sholat)
              </span>
              <span className="font-semibold">{profile.location}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-warm-border">
              <span className="text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" /> Tanggal Program (90 Hari)
              </span>
              <span className="font-semibold">
                {profile.startDate} {profile.endDate !== "-" ? `s/d ${profile.endDate}` : ""}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-warm-border">
              <span className="text-gray-500 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" /> Perusahaan (Company)
              </span>
              <span className="font-semibold text-[#071A33]">{profile.companyName}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-warm-border">
              <span className="text-gray-500 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" /> Batch Rombongan
              </span>
              <span className="font-semibold text-[#0B2C6B]">{profile.batchName}</span>
            </div>

            <div className="py-2 space-y-2">
              <span className="text-gray-500 block">Area Transformasi Terpilih (PTP):</span>
              {profile.areaTransformasi.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Belum ada area transformasi terpilih.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.areaTransformasi.map((area, idx) => (
                    <Badge key={idx} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </main>
    </ParticipantLayout>
  );
}
