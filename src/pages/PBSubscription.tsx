import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PlanId = "starter" | "profissional" | "enterprise";

const planCards: Array<{ id: PlanId; label: string; price: number; features: string[] }> = [
  { id: "starter", label: "Starter", price: 97, features: ["Cardápio", "Pedidos", "Cozinha", "Relatórios"] },
  { id: "profissional", label: "Profissional", price: 197, features: ["Tudo do Starter", "Equipe", "PDV", "Impressão"] },
  { id: "enterprise", label: "Enterprise", price: 397, features: ["Tudo do Profissional", "Multi-loja", "Suporte prioritário", "Customizações"] },
];

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
  const location = useLocation();
  const [tenant, setTenant] = useState<TenantRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<PlanId | null>(null);
  const [provisioning, setProvisioning] = useState(false);

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const billingResult = query.get("billing");

  useEffect(() => {
    if (billingResult === "success") toast.success("Quase lá! Confirme o pagamento no Mercado Pago.");
    if (billingResult === "cancel") toast.error("Pagamento cancelado.");
  }, [billingResult]);

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

  const startSubscription = async (plan: PlanId) => {
    if (!tenant) {
      toast.error("Crie sua loja antes de assinar");
      return;
    }
    setStarting(plan);
    const { data, error } = await supabase.functions.invoke("mercadopago-create-subscription", {
      body: { plan },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao iniciar assinatura");
      setStarting(null);
      return;
    }
    if (data?.init_point) {
      window.location.href = data.init_point;
      return;
    }
    toast.error("Não foi possível obter o link de pagamento");
    setStarting(null);
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>;

  const trialEnds = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
  const now = new Date();
  const trialActive = tenant?.status === "trial" && trialEnds && now <= trialEnds;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">💳 Assinatura</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Teste 7 dias grátis. Sem cartão de crédito no teste.
          </p>
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

      <div className="grid gap-3 sm:grid-cols-3">
        {planCards.map((p) => (
          <Card key={p.id} className="border-border/60">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{p.label}</p>
                <Badge variant="secondary">R$ {p.price}/mês</Badge>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button className="w-full" disabled={!tenant || starting !== null} onClick={() => startSubscription(p.id)}>
                {starting === p.id ? "Abrindo..." : "Assinar com Mercado Pago"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
