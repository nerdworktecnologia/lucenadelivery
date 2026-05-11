import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { FileDown, Search, Clock, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AuditLog = {
  id: string;
  action_type: string;
  actor_id: string;
  target_id: string;
  details: unknown;
  created_at: string;
  actor_name?: string;
  target_name?: string;
};

export default function CPAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_audit_logs")
        .select(`
          *,
          actor:actor_id (full_name),
          target:target_id (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedLogs: AuditLog[] = (data || []).map((log) => {
        const row = log as AuditLog & {
          actor?: { full_name?: string | null } | null;
          target?: { full_name?: string | null } | null;
        };
        return {
          ...row,
          actor_name: row.actor?.full_name || "Sistema/Desconhecido",
          target_name: row.target?.full_name || "N/A",
        };
      });

      setLogs(formattedLogs);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Erro ao carregar logs: " + message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const exportCSV = () => {
    const headers = ["Data", "Ação", "Autor", "Alvo", "Detalhes"];
    const rows = logs.map(l => [
      format(new Date(l.created_at), "dd/MM/yyyy HH:mm"),
      l.action_type,
      l.actor_name,
      l.target_name,
      JSON.stringify(l.details)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `auditoria_lucena_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório de auditoria exportado!");
  };

  const filteredLogs = logs.filter(l => 
    l.action_type.toLowerCase().includes(search.toLowerCase()) ||
    l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.target_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">📜 Auditoria do Sistema</h1>
          <p className="text-sm text-muted-foreground">Histórico de ações administrativas e mudanças de acesso</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <FileDown className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por ação, autor ou alvo..." 
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {log.action_type.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">{log.actor_name}</span>
                    <span className="text-xs text-muted-foreground">realizou ação em</span>
                    <span className="text-sm font-medium">{log.target_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {log.details?.reason || "Nenhum detalhe adicional fornecido."}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && filteredLogs.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-xl opacity-40">
            <Clock className="h-12 w-12 mx-auto mb-3" />
            <p>Nenhum log encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
