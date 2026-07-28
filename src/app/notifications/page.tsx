"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NotificationCard } from "@/components/domain/NotificationCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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

  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

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
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
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

      <main className="max-w-wizard mx-auto px-4 md:px-6 pt-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-warm-border">
            <p className="text-xs text-gray-400 italic">Belum ada notifikasi.</p>
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
