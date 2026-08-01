'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRole } from '@/lib/auth-role';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose = () => {}, initialMode = 'signin' }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Sign up state
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeSkk, setAgreeSkk] = useState(false);
  const [agreeAi, setAgreeAi] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const allChecked = agreeSkk && agreeAi;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) { setError('Isi email dan password.'); setLoading(false); return; }
    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (signInData.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', signInData.user.id)
        .maybeSingle();
      if (profileError) { setError('Profil akun belum dapat dimuat. Coba masuk kembali.'); setLoading(false); return; }

      const role = getUserRole(signInData.user, profile?.role);
      if (role === 'admin') router.push('/admin');
      else if (role === 'coach') router.push('/coach');
      else router.push('/dashboard');

      onClose();
      router.refresh();
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!allChecked) { setError('Setujui Syarat, Kebijakan Privasi, dan penggunaan AI sebelum mendaftar.'); setLoading(false); return; }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError('Masukkan email yang valid.'); setLoading(false); return; }
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    try {
      const defaultName = normalizedEmail.split('@')[0] || 'Peserta SLJ';
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
      const supabase = createClient();

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: defaultName, role: 'participant' },
        },
      });

      if (signUpError) {
        console.error('Supabase signUp error:', signUpError);
        if (signUpError.message?.includes('already registered')) {
          setError('Email ini sudah terdaftar. Silakan masuk menggunakan akun terdaftar Anda.');
        } else {
          setError(signUpError.message || 'Gagal mendaftar');
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        if (authData.user.identities && authData.user.identities.length === 0) {
          setError('Email ini sudah terdaftar. Silakan masuk menggunakan akun terdaftar Anda.');
          setLoading(false);
          return;
        }

        if (!authData.session) {
          onClose();
          router.push(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
          return;
        }

        const role = getUserRole(authData.user, 'participant');
        const { error: profileError } = await supabase.from('profiles').upsert({
          user_id: authData.user.id,
          full_name: defaultName,
          role: role,
          location: 'Jakarta',
        });
        if (profileError) throw profileError;

        if (role === 'participant') {
          router.push('/onboarding');
        } else if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/coach');
        }
        onClose();
        router.refresh();
      }
    } catch (err: any) {
      console.error('Register unexpected error:', err);
      const errStr = String(err?.message || err || '');
      if (errStr.includes('AuthRetryableFetchError') || errStr.includes('500') || errStr === '{}') {
        setError('Server Supabase gagal mengirim email konfirmasi (HTTP 500). Hal ini terjadi karena kuota email bawaan Supabase habis atau SMTP belum disetting di Supabase Dashboard (Auth -> Providers -> Email).');
      } else {
        setError(errStr || 'Gagal mendaftar');
      }
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[420px] p-0 border-none bg-transparent shadow-none">
        <div className="relative w-full max-w-[400px] mx-auto">
          {/* Card matching binahub-platform */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl backdrop-blur sm:p-7">
            {/* Back to landing page button */}
            <Link
              href="/"
              onClick={onClose}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#C79A3C] transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Kembali ke Beranda</span>
            </Link>

            {/* Logo */}
            <div className="mb-4 flex items-center justify-center">
              <Link href="/" onClick={onClose}>
                <img
                  src="/BinaJourney_logo.webp"
                  alt="BinaJourney Logo"
                  className="h-9 sm:h-10 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {mode === 'signin' ? 'Masuk ke akun Anda' : 'Buat akun Anda'}
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  {mode === 'signin' ? 'Selamat datang kembali di SLJ Life OS.' : 'Satu profil untuk seluruh perjalanan SLJ 90 Hari.'}
                </p>
              </div>

              {/* Mode switch pills */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => { setMode('signin'); setError(''); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    mode === 'signin' ? 'bg-[#C79A3C] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Masuk
                </button>
                <button
                  onClick={() => { setMode('signup'); setError(''); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    mode === 'signup' ? 'bg-[#C79A3C] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Daftar
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs leading-relaxed text-red-700">{error}</p>
              </div>
            )}

            {/* Google */}
            <div className="relative">
              <button
                onClick={() => {
                  if (mode === 'signup' && !allChecked) {
                    setShowTooltip(true);
                    setTimeout(() => setShowTooltip(false), 3000);
                  } else {
                    handleGoogleAuth();
                  }
                }}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
              >
                {googleLoading ? (
                  <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span className="text-sm">{googleLoading ? 'Mengalihkan...' : mode === 'signin' ? 'Lanjutkan dengan Google' : 'Daftar dengan Google'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-slate-400">atau</span>
              </div>
            </div>

            {/* Email toggle */}
            <button
              type="button"
              onClick={() => setShowEmailForm((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{mode === 'signin' ? 'Masuk dengan Email' : 'Daftar dengan Email'}</span>
              <svg className={`h-4 w-4 text-slate-400 transition-transform ${showEmailForm ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expandable email form inputs */}
            <div className={`overflow-hidden transition-all duration-300 ${showEmailForm ? 'mt-4 max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {mode === 'signin' ? (
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#C79A3C] focus:outline-none focus:ring-2 focus:ring-[#C79A3C]/10"
                      placeholder="nama@email.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#C79A3C] focus:outline-none focus:ring-2 focus:ring-[#C79A3C]/10"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#C79A3C] to-[#A87E2A] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#C79A3C]/20 hover:from-[#B58A32] hover:to-[#966E22]"
                  >
                    {loading ? 'Memproses...' : 'Masuk'}
                  </button>
                </form>
              ) : (
                <form id="modal-register-form" className="space-y-3" onSubmit={handleRegisterSubmit}>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#C79A3C] focus:outline-none focus:ring-2 focus:ring-[#C79A3C]/10"
                      placeholder="nama@email.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#C79A3C] focus:outline-none focus:ring-2 focus:ring-[#C79A3C]/10"
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">Konfirmasi Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#C79A3C] focus:outline-none focus:ring-2 focus:ring-[#C79A3C]/10"
                      placeholder="Ulangi password"
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Checkboxes for signup mode - Always visible so user can agree before Google or Email signup */}
            {mode === 'signup' && (
              <div className="mt-4 space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeSkk}
                    onChange={(e) => setAgreeSkk(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#C79A3C] focus:ring-[#C79A3C]/20"
                  />
                  <span className="leading-relaxed text-slate-600">
                    Saya telah membaca dan menyetujui{' '}
                    <Link href="/terms" target="_blank" className="font-medium text-[#C79A3C] underline hover:text-[#A87E2A]">
                      Syarat & Ketentuan
                    </Link>{' '}
                    serta{' '}
                    <Link href="/terms#kebijakan-privasi" target="_blank" className="font-medium text-[#C79A3C] underline hover:text-[#A87E2A]">
                      Kebijakan Privasi
                    </Link>{' '}
                    SLJ Life OS.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeAi}
                    onChange={(e) => setAgreeAi(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#C79A3C] focus:ring-[#C79A3C]/20"
                  />
                  <span className="leading-relaxed text-slate-600">
                    Saya memahami bahwa SLJ dapat menggunakan AI pendamping untuk memproses refleksi harian dan perkembangan kebiasaan guna meningkatkan ketahanan spiritual dan kepemimpinan saya.
                  </span>
                </label>
              </div>
            )}

            {/* Expandable submit button for email signup */}
            {mode === 'signup' && (
              <div className={`overflow-hidden transition-all duration-300 ${showEmailForm ? 'mt-4 max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <button
                  type="submit"
                  form="modal-register-form"
                  disabled={loading || !allChecked}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#C79A3C] to-[#A87E2A] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#C79A3C]/20 hover:from-[#B58A32] hover:to-[#966E22] disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Buat Akun'}
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
