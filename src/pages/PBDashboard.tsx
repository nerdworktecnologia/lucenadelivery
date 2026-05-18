import { useOrders } from "@/contexts/OrderContext";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, DollarSign, ChefHat, Truck, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, CartesianGrid, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const COLORS = ["hsl(150,80%,38%)", "hsl(32,98%,50%)", "hsl(220,70%,50%)", "hsl(280,65%,55%)", "hsl(340,75%,55%)", "hsl(190,80%,45%)"];

const PBDashboard = () => {
  const { orders } = useOrders();
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const delivered = todayOrders.filter((o) => o.status === "entregue");
  const newOrders = orders.filter((o) => o.status === "novo");
  const inPrep = orders.filter((o) => o.status === "em_preparo");
  const todayRevenue = todayOrders.filter((o) => o.status !== "cancelado").reduce((s, o) => s + o.total, 0);
  const ticket = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

  const productCount: Record<string, number> = {};
  orders.forEach((o) => o.items.forEach((i) => { productCount[i.product_name] = (productCount[i.product_name] || 0) + i.quantity; }));
  const topProducts = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, vendas: count }));

  const channelData = [
    { name: "📱 WhatsApp", value: orders.filter((o) => o.channel === "whatsapp").length },
    { name: "🔗 Link", value: orders.filter((o) => o.channel === "link").length },
    { name: "🏪 PDV", value: orders.filter((o) => o.channel === "pdv").length },
  ].filter(c => c.value > 0);

  const validOrders = orders.filter((o) => o.status !== "cancelado");

  // Monthly revenue from real orders
  const monthlyData: Record<string, number> = {};
  validOrders.forEach(o => {
    const d = new Date(o.created_at);
    const key = d.toLocaleDateString("pt-BR", { month: "short" });
    monthlyData[key] = (monthlyData[key] || 0) + o.total;
  });
  const monthlyRevenue = Object.entries(monthlyData).map(([mes, faturamento]) => ({ mes, faturamento }));

  const stats = [
    { label: "Pedidos Hoje", value: todayOrders.length, icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
    { label: "Faturamento", value: `R$ ${todayRevenue.toFixed(0)}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Em Preparo", value: inPrep.length, icon: ChefHat, color: "text-accent", bg: "bg-accent/10" },
    { label: "Concluídos", value: delivered.length, icon: Truck, color: "text-muted-foreground", bg: "bg-secondary" },
    { label: "Ticket Médio", value: `R$ ${ticket.toFixed(0)}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Novos", value: newOrders.length, icon: AlertCircle, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Visão geral do seu restaurante</p>
        </div>
        {newOrders.length > 0 && (
          <Link to="/admin/pedidos">
            <Button size="sm" className="gap-2 animate-pulse w-full sm:w-auto"><AlertCircle className="h-4 w-4" />{newOrders.length} novo(s)</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Marketing banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Do WhatsApp direto para a cozinha ⚡</h3>
            <p className="text-sm text-muted-foreground">Seus pedidos são recebidos automaticamente pelo BrandDelivery. Sem necessidade de atendimento manual.</p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">💰 Faturamento Mensal</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(150,80%,38%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(150,80%,38%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,92%)" />
                <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Faturamento"]} />
                <Area type="monotone" dataKey="faturamento" stroke="hsl(150,80%,38%)" strokeWidth={2.5} fill="url(#colorFat)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {topProducts.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">🏆 Mais Vendidos</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProducts}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="vendas" fill="hsl(150,80%,38%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {channelData.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">📊 Pedidos por Canal</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} label={({ name, value }) => `${name} (${value})`}>
                    {channelData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm md:text-base">📋 Últimos Pedidos</h3>
            <Link to="/admin/pedidos"><Button variant="ghost" size="sm">Ver todos →</Button></Link>
          </div>
          <div className="space-y-2">
            {orders.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhum pedido ainda</div>}
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <span className="font-bold text-foreground text-xs md:text-sm">#{o.number}</span>
                  <div className="min-w-0">
                    <span className="text-xs md:text-sm text-foreground truncate block">{o.customer_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <span className="text-xs md:text-sm font-semibold text-foreground">R$ {o.total.toFixed(2)}</span>
                  <Badge className={`text-white border-0 text-[10px] md:text-xs ${o.status === 'novo' ? 'bg-blue-500' : o.status === 'em_preparo' ? 'bg-orange-500' : o.status === 'pronto' ? 'bg-primary' : o.status === 'entregue' ? 'bg-muted-foreground' : o.status === 'cancelado' ? 'bg-destructive' : o.status === 'saiu_entrega' ? 'bg-purple-500' : 'bg-yellow-500'}`}>
                    {o.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
};

export default PBDashboard;
