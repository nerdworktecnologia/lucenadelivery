import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, Building2, Pencil, Trash2, Phone, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Tenant = {
  id: string; name: string; email: string; phone: string;
  plan: string; status: string; monthly_revenue: number;
  orders_count: number; products_count: number; created_at: string; notes: string;
  slug: string | null;
};

const planLabels: Record<string, string> = {
  starter: "Starter",
  profissional: "Profissional",
  enterprise: "Enterprise",
};

const planColors: Record<string, string> = {
  starter: "bg-secondary text-secondary-foreground",
  profissional: "bg-primary/10 text-primary",
  enterprise: "bg-accent/20 text-accent-foreground",
};

const planPrices: Record<string, number> = {
  starter: 97,
  profissional: 197,
  enterprise: 397,
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  trial: "Trial",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  trial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function CPEmpresas() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan: "starter", status: "active", monthly_revenue: 97, notes: "" });

  const load = async () => {
    const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    if (data) setTenants(data as Tenant[]);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", plan: "starter", status: "active", monthly_revenue: 97, notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({
      name: t.name, email: t.email, phone: t.phone,
      plan: t.plan, status: t.status,
      monthly_revenue: t.monthly_revenue,
      notes: t.notes,
    });
    setDialogOpen(true);
  };

  const handlePlanChange = (plan: string) => {
    setForm({ ...form, plan, monthly_revenue: planPrices[plan] || form.monthly_revenue });
  };

  const save = async () => {
    if (!form.name) { toast.error("Nome da loja é obrigatório"); return; }
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      plan: form.plan,
      status: form.status,
      monthly_revenue: form.monthly_revenue,
      notes: form.notes,
    };

    if (editing) {
      const { error } = await supabase.from("tenants").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Cliente atualizado!");
    } else {
      const { error } = await supabase.from("tenants").insert(payload);
      if (error) { toast.error("Erro ao adicionar"); return; }
      toast.success("Cliente adicionado!");
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (t: Tenant) => {
    if (!confirm(`Remover "${t.name}" da lista de clientes?`)) return;
    const { error } = await supabase.from("tenants").delete().eq("id", t.id);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Cliente removido!");
    load();
  };

  const filtered = tenants.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search);
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchPlan = filterPlan === "all" || t.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  const totalMRR = filtered.reduce((sum, t) => t.status === "active" ? sum + t.monthly_revenue : sum, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">🏪 Clientes / Lojas</h1>
          <p className="text-sm text-muted-foreground">
            {tenants.length} clientes • MRR dos filtrados: <span className="font-semibold text-primary">R$ {totalMRR.toLocaleString("pt-BR")}</span>
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome da Loja / Restaurante</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pizzaria do João" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@loja.com" />
                </div>
                <div>
                  <Label>Telefone / WhatsApp</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Plano</Label>
                  <Select value={form.plan} onValueChange={handlePlanChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter - R$97/mês</SelectItem>
                      <SelectItem value="profissional">Profissional - R$197/mês</SelectItem>
                      <SelectItem value="enterprise">Enterprise - R$397/mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Valor Mensal (R$)</Label>
                <Input type="number" value={form.monthly_revenue} onChange={(e) => setForm({ ...form, monthly_revenue: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Anotações sobre o cliente..." />
              </div>
              <Button className="w-full" onClick={save}>{editing ? "Salvar Alterações" : "Adicionar Cliente"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Planos</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="profissional">Profissional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client list */}
      <div className="space-y-2">
        {filtered.map((t) => (
          <Card key={t.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{t.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {t.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{t.email}</span>}
                      {t.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right mr-2 hidden sm:block">
                    <p className="text-sm font-bold text-primary">R$ {t.monthly_revenue.toLocaleString("pt-BR")}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                  </div>
                  <Badge variant="secondary" className={planColors[t.plan] || ""}>{planLabels[t.plan] || t.plan}</Badge>
                  <Badge variant="secondary" className={statusColors[t.status] || ""}>{statusLabels[t.status] || t.status}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(t)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {t.notes && <p className="text-xs text-muted-foreground mt-2 pl-13 italic">📝 {t.notes}</p>}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
