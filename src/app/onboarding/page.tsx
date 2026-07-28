"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      programCode: "",
    },
  });

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email || null);
      if (user.user_metadata?.full_name) {
        setValue("fullName", user.user_metadata.full_name);
      }
    }
    loadUser();
  }, [router, setValue, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const onSubmit = async (data: OnboardingInput) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Update user profile in Supabase with Identity, Company & Access Code
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 90);

        await supabase
          .from("profiles")
          .update({
            full_name: data.fullName,
            company_name: data.companyName,
            program_code: data.programCode,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          })
          .eq("user_id", user.id);

        // Update journey status to ACTIVE
        const { data: journey } = await supabase
          .from("journeys")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (journey) {
          await supabase
            .from("journeys")
            .update({
              status: "ACTIVE",
              updated_at: new Date().toISOString(),
            })
            .eq("id", journey.id);
        } else {
          await supabase.from("journeys").insert({
            user_id: user.id,
            status: "ACTIVE",
          });
        }
      } else {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Gagal menyimpan identitas onboarding:", err);
      setErrorMsg("Terjadi gangguan saat memverifikasi kode program. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4 font-sans py-12">
      <div className="w-full max-w-wizard space-y-6">
        {/* Back Link & Brand Logo Header */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
          </Link>
          <div className="flex items-center space-x-2">
            <Link href="/" className="inline-block py-1">
              <img
                src="/BinaJourney_logo.webp"
                alt="BinaJourney Logo"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </Link>
          </div>
        </div>

        {/* User Logged-in Info Bar (Solusi Kasus 2: Salah Pilihan Akun Google) */}
        {userEmail && (
          <div className="bg-white border border-warm-border rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-gray-500">Terhubung sebagai:</span>
              <span className="font-bold text-navy-900 truncate">{userEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-[11px] transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" /> Ganti Akun / Logout
            </button>
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Identitas Peserta SLJ</h1>
          <p className="text-sm text-gray-500">
            Lengkapi data diri dan masukkan Kode Program resmi dari admin BinaJourney.
          </p>
        </div>

        <Card className="border border-warm-border shadow-sm bg-white p-6 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader className="p-0 space-y-1">
              <CardTitle className="text-base font-bold text-navy-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" /> Registrasi Peserta Terdaftar
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Program ini khusus untuk peserta terdaftar yang telah memiliki Kode Program resmi.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs text-status-danger bg-red-50 border border-red-200 rounded-md">
                  {errorMsg}
                </div>
              )}

              <Input
                label="Nama Lengkap"
                placeholder="Ahmad Hidayat"
                error={errors.fullName?.message}
                {...register("fullName")}
              />

              <Input
                label="Nama Perusahaan / Organisasi"
                placeholder="PT Bina Hub Indonesia"
                error={errors.companyName?.message}
                {...register("companyName")}
              />

              <div className="space-y-1.5">
                <Input
                  label="Kode Program (Dari Admin)"
                  placeholder="Contoh: SLJ-90-2026"
                  error={errors.programCode?.message}
                  {...register("programCode")}
                />

              </div>
            </CardContent>

            <CardFooter className="p-0 border-t border-warm-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link href="/" className="w-full sm:w-auto">
                <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto text-xs text-gray-500">
                  Kembali ke Beranda
                </Button>
              </Link>
              <Button type="submit" variant="primary" className="w-full sm:w-auto font-semibold gap-2" disabled={loading}>
                {loading ? "Memproses Data..." : (<>Masuk ke Dashboard <ArrowRight className="h-4 w-4" /></>)}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
