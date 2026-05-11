import { useState } from "react";
import { useOrders } from "@/contexts/OrderContext";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";

const COLORS = ["hsl(150,80%,38%)", "hsl(32,98%,50%)", "hsl(220,70%,50%)", "hsl(280,65%,55%)", "hsl(340,75%,55%)", "hsl(190,80%,45%)"];

const PBReports = () => {
  const { orders } = useOrders();
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const daysBack = period === "7d" ? 7 : 30;

  const validOrders = orders.filter((o) => o.status !== "cancelado");
  const cancelled = orders.filter((o) => o.status === "cancelado");

  // Sales by day
  const days: Record<string, number> = {};
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days[d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })] = 0;
  }
  validOrders.forEach((o) => {
    const key = new Date(o.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
    if (days[key] !== undefined) days[key] += o.total;
  });
  const salesByDay = Object.entries(days).map(([name, valor]) => ({ name, valor }));

  // Orders by hour
  const hours: Record<number, number> = {};
  for (let h = 8; h <= 23; h++) hours[h] = 0;
  orders.forEach((o) => { const h = new Date(o.created_at).getHours(); if (hours[h] !== undefined) hours[h]++; });
  const ordersByHour = Object.entries(hours).map(([h, count]) => ({ hora: `${h}h`, pedidos: count }));

  // Top products from real order data
  const prodCount: Record<string, number> = {};
  orders.forEach((o) => o.items.forEach((i) => { prodCount[i.product_name] = (prodCount[i.product_name] || 0) + i.quantity; }));
  const topProducts = Object.entries(prodCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name: name.length > 16 ? name.slice(0, 16) + "…" : name, value }));

  // Channel distribution
  const channelData = [
    { name: "📱 WhatsApp", value: orders.filter((o) => o.channel === "whatsapp").length },
    { name: "🔗 Link", value: orders.filter((o) => o.channel === "link").length },
    { name: "🏪 PDV", value: orders.filter((o) => o.channel === "pdv").length },
  ].filter(c => c.value > 0);

  const totalRevenue = validOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = validOrders.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análise de vendas e desempenho</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={period === "7d" ? "default" : "outline"} onClick={() => setPeriod("7d")} className="rounded-full">7 dias</Button>
          <Button size="sm" variant={period === "30d" ? "default" : "outline"} onClick={() => setPeriod("30d")} className="rounded-full">30 dias</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Faturamento</p><p className="text-2xl font-bold text-foreground">R$ {totalRevenue.toFixed(0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Pedidos</p><p className="text-2xl font-bold text-foreground">{totalOrders}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Ticket Médio</p><p className="text-2xl font-bold text-foreground">R$ {totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : "0"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Cancelados</p><p className="text-2xl font-bold text-destructive">{cancelled.length}</p></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4"><h3 className="font-semibold text-foreground mb-3">💰 Vendas por Dia</h3><ResponsiveContainer width="100%" height={200}><BarChart data={salesByDay}><XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} /><YAxis fontSize={10} tickLine={false} axisLine={false} /><Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} /><Bar dataKey="valor" fill="hsl(150,80%,38%)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardContent className="p-4"><h3 className="font-semibold text-foreground mb-3">🕐 Pedidos por Horário</h3><ResponsiveContainer width="100%" height={200}><LineChart data={ordersByHour}><XAxis dataKey="hora" fontSize={10} tickLine={false} axisLine={false} /><YAxis fontSize={10} tickLine={false} axisLine={false} /><Tooltip /><Line type="monotone" dataKey="pedidos" stroke="hsl(32,98%,50%)" strokeWidth={2} dot={{ fill: "hsl(32,98%,50%)" }} /></LineChart></ResponsiveContainer></CardContent></Card>
        {topProducts.length > 0 && <Card><CardContent className="p-4"><h3 className="font-semibold text-foreground mb-3">🏆 Mais Vendidos</h3><ResponsiveContainer width="100%" height={200}><BarChart data={topProducts} layout="vertical"><XAxis type="number" fontSize={10} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} width={120} /><Tooltip /><Bar dataKey="value" fill="hsl(150,80%,38%)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>}
        {channelData.length > 0 && <Card><CardContent className="p-4"><h3 className="font-semibold text-foreground mb-3">📊 Por Canal</h3><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} label={({ name, value }) => `${name} (${value})`}>{channelData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>}
      </div>
    </div>
  );
};

export default PBReports;
