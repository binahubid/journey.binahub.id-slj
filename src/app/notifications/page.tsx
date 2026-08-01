"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NotificationCard } from "@/components/domain/NotificationCard";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Inbox, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ParticipantLayout } from "@/components/layout/ParticipantLayout";

interface NotificationItemData {
  id: string;
  title: string;
  message: string;
  category: "reminder" | "checkpoint" | "coach" | "system";
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error: queryError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (queryError) throw queryError;

        if (data && data.length > 0) {
          setNotifications(
            data.map((n) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              category: n.category || "reminder",
              isRead: n.is_read || false,
              createdAt: new Date(n.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))
          );
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error("Gagal memuat notifikasi:", err);
        setError("Notifikasi belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);
      if (updateError) {
        setError("Notifikasi belum berhasil ditandai sudah dibaca.");
        return;
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    const { error: updateError } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (updateError) {
      setError("Notifikasi belum berhasil diperbarui.");
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center font-sans">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ParticipantLayout activePath="/notifications" pageTitle="Notifikasi • Pengingat & Info Program">

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-5 md:px-6 md:pt-7">
        <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"><Bell className="h-4 w-4" /></div>
            <div><h1 className="text-base font-extrabold text-navy-900">Notifikasi</h1><p className="text-[11px] text-slate-500">Pengingat dan kabar penting perjalanan Anda.</p></div>
          </div>
          {notifications.some(n => !n.isRead) && <Button type="button" variant="outline" onClick={markAllRead} className="h-9 rounded-lg border-slate-200 text-[11px] font-bold"><CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Tandai dibaca</Button>}
        </div>
        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"><AlertCircle className="h-4 w-4" />{error}</div>}
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center"><Inbox className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">Belum ada notifikasi</p><p className="mt-1 text-xs text-slate-400">Kabar penting dari perjalanan Anda akan muncul di sini.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationCard
              key={item.id}
              {...item}
              onMarkRead={() => markRead(item.id)}
            />
          ))
        )}
      </main>
    </ParticipantLayout>
  );
}
