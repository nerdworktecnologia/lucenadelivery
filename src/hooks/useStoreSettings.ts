import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StoreSettings {
  store_name: string;
  delivery_fee: number;
  min_order: number;
  prep_time: number;
  open_time: string;
  close_time: string;
  primary_color: string;
  auto_accept: boolean;
  auto_print_kitchen: boolean;
  auto_print_delivery: boolean;
  sound_enabled: boolean;
  whatsapp_number: string;
  whatsapp_msg: string;
  print_width: "58mm" | "80mm";
  auto_print_on_selection: boolean;
}

const defaults: StoreSettings = {
  store_name: "Minha Loja",
  delivery_fee: 5,
  min_order: 15,
  prep_time: 30,
  open_time: "11:00",
  close_time: "23:00",
  primary_color: "#16a34a",
  auto_accept: true,
  auto_print_kitchen: true,
  auto_print_delivery: true,
  sound_enabled: true,
  whatsapp_number: "",
  whatsapp_msg: "Olá! 😊 Seja bem-vindo ao {loja}!\n\n🍔 Faça seu pedido pelo cardápio digital:\n👉 {link}\n\nOu me diga o que deseja pedir!",
  print_width: "58mm",
  auto_print_on_selection: false,
};

export function useStoreSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setSettings({
        store_name: data.store_name,
        delivery_fee: Number(data.delivery_fee),
        min_order: Number(data.min_order),
        prep_time: data.prep_time,
        open_time: data.open_time,
        close_time: data.close_time,
        primary_color: data.primary_color,
        auto_accept: data.auto_accept,
        auto_print_kitchen: data.auto_print_kitchen,
        auto_print_delivery: data.auto_print_delivery,
        sound_enabled: data.sound_enabled,
        whatsapp_number: data.whatsapp_number || "",
        whatsapp_msg: data.whatsapp_msg,
        print_width: (data.print_width as "58mm" | "80mm") || "58mm",
        auto_print_on_selection: !!data.auto_print_on_selection,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = async (newSettings: StoreSettings) => {
    if (!user) return false;
    setSettings(newSettings);

    const payload = { ...newSettings, user_id: user.id, updated_at: new Date().toISOString() };
    const { error } = await supabase
      .from("store_settings")
      .upsert(payload, { onConflict: "user_id" });

    return !error;
  };

  return { settings, loading, saveSettings, setSettings };
}
