import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type TenantRow = {
  id: string;
  owner_id: string | null;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  billing_status: string;
};

export default function PBSubscription() {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const ownerId = (user.user_metadata as { owner_id?: string } | null)?.owner_id || user.id;
      const { data, error } = await supabase
        .from("tenants")
        .select("id, owner_id, plan, status, trial_ends_at, billing_status")
        .eq("owner_id", ownerId)
        .limit(1)
        .maybeSingle();
      if (error) {
        const { data: fallback } = await supabase
          .from("tenants")
          .select("id, owner_id, plan, status")
          .eq("owner_id", ownerId)
          .limit(1)
          .maybeSingle();
        setTenant((fallback as TenantRow) || null);
      } else {
        setTenant((data as TenantRow) || null);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const provisionTenant = async () => {
    setProvisioning(true);
    const { data, error } = await supabase.functions.invoke("provision-tenant", { body: {} });
    if (error) {
      toast.error(error.message || "Erro ao criar loja");
      setProvisioning(false);
      return;
    }
    if (data?.error) {
      toast.error(String(data.error));
      setProvisioning(false);
      return;
    }
    setTenant((data?.tenant as TenantRow) || null);
    setProvisioning(false);
    toast.success("Loja criada com sucesso!");
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>;

  const trialEnds = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
  const now = new Date();
  const trialActive = tenant?.status === "trial" && trialEnds && now <= trialEnds;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">🏢 Plano</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Este sistema opera no modelo Enterprise.</p>
        </div>
        {tenant ? (
          <Badge variant="secondary" className="capitalize">
            {tenant.status}
          </Badge>
        ) : null}
      </div>

      {tenant ? (
        <Card>
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Plano atual</p>
              <p className="text-xs text-muted-foreground capitalize">{tenant.plan || "não definido"}</p>
              {trialActive && trialEnds ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Teste grátis até {trialEnds.toLocaleDateString("pt-BR")}
                </p>
              ) : null}
            </div>
            <Badge variant="outline" className="capitalize">
              {tenant.billing_status || "sem cobrança"}
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Não encontramos uma loja vincululada a este usuário.</p>
            <div className="mt-3">
              <Button onClick={provisionTenant} disabled={provisioning}>
                {provisioning ? "Criando..." : "Criar minha loja"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-1.5">
          <p className="text-sm font-semibold text-foreground">Ativação e faturamento</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Alterações de plano e cobrança são tratadas diretamente com o time comercial/suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
