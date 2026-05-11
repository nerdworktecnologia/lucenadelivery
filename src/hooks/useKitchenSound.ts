import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendPushNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const options: NotificationOptions & { renotify?: boolean } = {
        body,
        icon: "/pwa-icon-192.png",
        badge: "/pwa-icon-192.png",
        tag: "new-order",
      };
      options.renotify = true;
      new Notification(title, options);
    } catch {
      // Fallback: some browsers don't support Notification constructor in this context
    }
  }
}

export function useKitchenSound() {
  const { user } = useAuth();
  const audioRef = useRef<AudioContext | null>(null);
  type OrderChangeRow = { status?: string; number?: number };

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const playBeep = useCallback(() => {
    try {
      const ctx = audioRef.current || new AudioContext();
      audioRef.current = ctx;
      const now = ctx.currentTime;

      const playChime = (freq: number, start: number, dur: number, vol: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(vol, now + start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc2.type = "sine";
        osc2.frequency.value = freq * 2.5;
        gain2.gain.setValueAtTime(0, now + start);
        gain2.gain.linearRampToValueAtTime(vol * 0.12, now + start + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + start + dur * 0.6);

        osc.start(now + start);
        osc.stop(now + start + dur);
        osc2.start(now + start);
        osc2.stop(now + start + dur);
      };

      playChime(659, 0, 0.6, 0.25);
      playChime(880, 0.35, 0.8, 0.3);
      playChime(784, 0.9, 0.5, 0.12);

    } catch (e) {
      console.error("Error playing sound:", e);
    }
  }, []);

  const handleNewOrder = useCallback(async (orderNumber: number, status: string) => {
    const { data: s } = await supabase.from("store_settings").select("sound_enabled").eq("user_id", user!.id).maybeSingle();
    if (s && s.sound_enabled === false) return;

    playBeep();

    const description = status === "novo" ? "aguardando confirmação" : "aguardando preparo";

    toast("🔔 Novo pedido!", { description: `Pedido #${orderNumber} — ${description}` });

    sendPushNotification(
      "🔔 Novo pedido!",
      `Pedido #${orderNumber} — ${description}`
    );
  }, [user, playBeep]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("kitchen-new-orders")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as OrderChangeRow;
          const oldRow = payload.old as OrderChangeRow;
          const newStatus = newRow?.status;
          const oldStatus = oldRow?.status;
          if ((newStatus === "novo" || newStatus === "confirmado") && oldStatus !== newStatus) {
            handleNewOrder(newRow?.number ?? 0, newStatus);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as OrderChangeRow;
          const status = newRow?.status;
          if (status === "novo" || status === "confirmado") {
            handleNewOrder(newRow?.number ?? 0, status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, handleNewOrder]);
}
