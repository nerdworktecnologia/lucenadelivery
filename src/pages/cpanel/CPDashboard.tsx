import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Tenant = {
  id: string; name: string; status: string;
  created_at: string;
};

export default function CPDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
      if (data) setTenants(data as Tenant[]);
    };
    load();
  }, []);

  const active = tenants.filter((t) => t.status === "active");
  const trial = tenants.filter((t) => t.status === "trial");
  const inactive = tenants.filter((t) => t.status === "inactive");

  const cards = [
    { label: "Total Lojas", value: tenants.length, icon: Building2, desc: `${active.length} ativas` },
    { label: "Ativas", value: active.length, icon: Users, desc: "Em operação" },
    { label: "Em Trial", value: trial.length, icon: Users, desc: "Cadastro recente" },
    { label: "Inativas", value: inactive.length, icon: AlertTriangle, desc: "Desativadas" },
  ];

  // Recent clients
  const recent = tenants.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">📊 Painel BrandDelivery</h1>
          <p className="text-sm text-muted-foreground">Visão geral das lojas cadastradas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold font-['Space_Grotesk']">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-4">Últimas Lojas</h3>
          <div className="space-y-2">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t.name}</span>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    t.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]" :
                    t.status === "trial" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px]" :
                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]"
                  }
                >
                  {t.status === "active" ? "Ativa" : t.status === "trial" ? "Trial" : "Inativa"}
                </Badge>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma loja cadastrada</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
