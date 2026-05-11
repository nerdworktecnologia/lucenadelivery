import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "super_admin" | "admin" | "user" | "cozinha" | "pedidos" | "entrega";

// Mock roles removed

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsSuperAdmin(false);
      setRole(null);
      setLoading(false);
      return;
    }

    // Mock user check removed

    const check = async () => {
      try {
        // Fetch the user's role from user_roles table
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const userRole = (data?.role as AppRole) || null;
        setRole(userRole);
        setIsSuperAdmin(userRole === "super_admin");
      } catch (err) {
        console.error("Error checking user role:", err);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user]);

  return { role, isSuperAdmin, loading };
}
