import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardHome = () => {
  const { user } = useAuth();

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices-summary", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const thisMonth = invoices.filter(
    (inv) => new Date(inv.issued_at).getMonth() === new Date().getMonth()
  );

  const stats = [
    { label: "Total de Notas", value: invoices.length, icon: FileText, color: "text-primary" },
    { label: "Este Mês", value: thisMonth.length, icon: Clock, color: "text-accent" },
    { label: "Faturamento Total", value: `R$ ${totalAmount.toFixed(2)}`, icon: DollarSign, color: "text-primary" },
    { label: "Faturamento Mensal", value: `R$ ${thisMonth.reduce((s, i) => s + Number(i.total_amount), 0).toFixed(2)}`, icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Bem-vindo! 👋
      </h1>
      <p className="text-muted-foreground mb-8">Aqui está o resumo da sua conta.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/dashboard/emitir">
          <Card className="hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">📄</div>
              <div>
                <h3 className="font-bold text-foreground">Emitir Nova Nota</h3>
                <p className="text-sm text-muted-foreground">Crie uma nota fiscal rapidamente</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/notas">
          <Card className="hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl">📋</div>
              <div>
                <h3 className="font-bold text-foreground">Ver Histórico</h3>
                <p className="text-sm text-muted-foreground">Consulte todas as notas emitidas</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {invoices.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Últimas Notas</h2>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((inv) => (
              <Card key={inv.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{inv.client_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.invoice_number} • {inv.invoice_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">R$ {Number(inv.total_amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(inv.issued_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
