"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMsg("Tautan pemulihan belum bisa dikirimkan. Pastikan email yang dimasukkan benar.");
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorMsg("Terjadi gangguan sementara. Silakan coba lagi beberapa saat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3 mb-2">
          <Link href="/" className="inline-block">
            <img
              src="/BinaJourney_logo.webp"
              alt="BinaJourney Logo"
              className="h-10 sm:h-12 w-auto object-contain mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Atur Ulang Kata Sandi</h1>
        </div>

        <Card className="border border-warm-border shadow-sm">
          {submitted ? (
            <CardContent className="py-8 text-center space-y-4">
              <div className="p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
                Tautan pemulihan kata sandi telah dikirimkan ke <strong>{email}</strong>. Silakan periksa kotak masuk email Anda.
              </div>
              <Link href="/login">
                <Button variant="secondary" className="w-full">Kembali ke Halaman Masuk</Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Pemulihan Kata Sandi</CardTitle>
                <CardDescription>Masukkan email Anda untuk menerima instruksi pemulihan.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {errorMsg && (
                  <div className="p-3 text-xs text-status-danger bg-red-50 border border-red-200 rounded-md">
                    {errorMsg}
                  </div>
                )}
                <Input
                  label="Email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                <Button type="submit" variant="primary" className="w-full font-semibold" disabled={loading}>
                  {loading ? "Mengirim..." : "Kirim Tautan Pemulihan"}
                </Button>
                <Link href="/login" className="text-xs text-center text-navy-900 hover:underline">
                  Kembali ke Masuk
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
