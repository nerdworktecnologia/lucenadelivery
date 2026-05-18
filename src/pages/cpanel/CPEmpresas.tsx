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
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  plan: string | null;
  status: string;
  monthly_revenue: number | null;
  orders_count: number | null;
  products_count: number | null;
  created_at: string;
  notes: string | null;
  slug: string | null;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan: "enterprise", status: "active", monthly_revenue: 0, notes: "" });

  // #region debug-point A:init
  const __dbgUrl = "http://127.0.0.1:7777/event";
  const __dbgSessionId = "cpanel-delete-client-error";
  const __dbgRunId = "pre-fix";
  const __dbg = (hypothesisId: string, msg: string, data: Record<string, unknown> = {}) => {
    fetch(__dbgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: __dbgSessionId,
        runId: __dbgRunId,
        hypothesisId,
        location: "CPEmpresas.tsx",
        msg: `[DEBUG] ${msg}`,
        data,
        ts: Date.now(),
      }),
    }).catch(() => {});
  };
  // #endregion

  // #region debug-point B:global-errors
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      __dbg("B", "window.onerror", {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: (e.error as Error | undefined)?.stack,
      });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason as unknown;
      __dbg("B", "window.unhandledrejection", {
        reasonType: typeof reason,
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  // #endregion

  const load = async () => {
    // #region debug-point C:load-start
    __dbg("C", "load:start", { at: new Date().toISOString() });
    // #endregion
    const { data, error } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    if (error) {
      // #region debug-point C:load-error
      __dbg("C", "load:error", { message: error.message, details: (error as unknown as { details?: unknown }).details });
      // #endregion
      toast.error("Erro ao carregar lojas");
      return;
    }
    if (data) {
      // #region debug-point C:load-ok
      const rows = data as Tenant[];
      __dbg("C", "load:ok", {
        count: rows.length,
        nullEmail: rows.filter((r) => !r.email).length,
        nullPhone: rows.filter((r) => !r.phone).length,
        nullName: rows.filter((r) => !r.name).length,
        invalidCreatedAt: rows.filter((r) => !r.created_at).length,
      });
      // #endregion
      setTenants(rows);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", plan: "enterprise", status: "active", monthly_revenue: 0, notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({
      name: t.name,
      email: t.email || "",
      phone: t.phone || "",
      plan: t.plan || "enterprise",
      status: t.status,
      monthly_revenue: Number(t.monthly_revenue || 0),
      notes: t.notes || "",
    });
    setDialogOpen(true);
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
      toast.success("Loja atualizada!");
    } else {
      const { error } = await supabase.from("tenants").insert(payload);
      if (error) { toast.error("Erro ao adicionar"); return; }
      toast.success("Loja adicionada!");
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (t: Tenant) => {
    if (!confirm(`Remover "${t.name}" da lista de lojas?`)) return;
    // #region debug-point D:delete-start
    __dbg("D", "delete:start", { id: t.id, name: t.name, email: t.email, phone: t.phone, status: t.status });
    // #endregion
    const { error } = await supabase.from("tenants").delete().eq("id", t.id);
    if (error) {
      // #region debug-point D:delete-error
      __dbg("D", "delete:error", { message: error.message, code: (error as unknown as { code?: unknown }).code, details: (error as unknown as { details?: unknown }).details });
      // #endregion
      toast.error("Erro ao remover");
      return;
    }
    // #region debug-point D:delete-ok
    __dbg("D", "delete:ok", { id: t.id });
    // #endregion
    toast.success("Loja removida!");
    load();
  };

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = t.name.toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q) ||
      (t.phone || "").includes(search);
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });
  // #region debug-point C:filtered
  __dbg("C", "filtered:computed", { total: tenants.length, filtered: filtered.length, filterStatus, hasSearch: !!search });
  // #endregion

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">🏪 Lojas</h1>
          <p className="text-sm text-muted-foreground">{tenants.length} lojas cadastradas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Nova Loja</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Loja" : "Nova Loja"}</DialogTitle>
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
              <div>
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Anotações sobre o cliente..." />
              </div>
              <Button className="w-full" onClick={save}>{editing ? "Salvar Alterações" : "Adicionar Loja"}</Button>
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
                        {(() => {
                          // #region debug-point E:format-date
                          try {
                            const v = format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR });
                            return v;
                          } catch (e) {
                            __dbg("E", "date-format:error", {
                              id: t.id,
                              created_at: t.created_at,
                              message: e instanceof Error ? e.message : String(e),
                              stack: e instanceof Error ? e.stack : undefined,
                            });
                            throw e;
                          }
                          // #endregion
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
