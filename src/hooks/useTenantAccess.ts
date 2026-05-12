import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type TenantAccess = {
  loading: boolean;
  blocked: boolean;
  tenantId: string | null;
};

type TenantRow = {
  id: string;
  status: string;
  trial_ends_at: string | null;
  billing_status: string | null;
};

export function useTenantAccess(): TenantAccess {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setTenant(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const ownerId = (user.user_metadata as { owner_id?: string } | null)?.owner_id || user.id;
      const { data } = await supabase
        .from("tenants")
        .select("id, status, trial_ends_at, billing_status")
        .eq("owner_id", ownerId)
        .limit(1)
        .maybeSingle();
      setTenant((data as TenantRow) || null);
      setLoading(false);
    };
    load();
  }, [user]);

  const blocked = useMemo(() => {
    if (!tenant) return false;
    const status = (tenant.status || "").toLowerCase();
    const billing = (tenant.billing_status || "").toLowerCase();
    const trialEnds = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
    const now = new Date();

    if (status === "trial") {
      if (!trialEnds) return false;
      return now > trialEnds;
    }

    if (status === "inactive" || status === "canceled" || status === "cancelled") return true;
    if (["cancelled", "canceled", "rejected", "paused", "inactive", "expired"].includes(billing)) return true;
    return false;
  }, [tenant]);

  return { loading, blocked, tenantId: tenant?.id || null };
}

