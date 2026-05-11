import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Users } from "lucide-react";

type PlanStat = { plan: string; count: number; revenue: number };

export default function CPPlanos() {
  const [stats, setStats] = useState<PlanStat[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("tenants").select("plan, monthly_revenue");
      if (!data) return;
      const map: Record<string, PlanStat> = {};
      data.forEach((t) => {
        if (!map[t.plan]) map[t.plan] = { plan: t.plan, count: 0, revenue: 0 };
        map[t.plan].count++;
        map[t.plan].revenue += Number(t.monthly_revenue);
      });
      setStats(Object.values(map));
    };
    load();
  }, []);

  const planInfo: Record<string, { price: string; emoji: string }> = {
    starter: { price: "R$ 49/mês", emoji: "🌱" },
    profissional: { price: "R$ 99/mês", emoji: "⭐" },
    enterprise: { price: "R$ 199/mês", emoji: "🚀" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">💳 Gestão de Planos</h1>
        <p className="text-sm text-muted-foreground">Visão geral dos planos e assinaturas</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {["starter", "profissional", "enterprise"].map((plan) => {
          const info = planInfo[plan];
          const stat = stats.find((s) => s.plan === plan);
          return (
            <Card key={plan} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-3xl mb-2">{info.emoji}</div>
                <h3 className="font-bold text-lg font-['Space_Grotesk'] capitalize">{plan}</h3>
                <p className="text-sm text-muted-foreground mb-4">{info.price}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <span className="text-sm flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Empresas</span>
                    <span className="font-bold text-sm">{stat?.count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <span className="text-sm flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> MRR</span>
                    <span className="font-bold text-sm text-primary">R$ {(stat?.revenue || 0).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
