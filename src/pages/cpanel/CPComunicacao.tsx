import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, Users } from "lucide-react";

export default function CPComunicacao() {
  const [tenantCount, setTenantCount] = useState(0);
  const [form, setForm] = useState({ target: "all", subject: "", message: "" });
  const [sent, setSent] = useState<{ subject: string; target: string; date: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase.from("tenants").select("*", { count: "exact", head: true });
      setTenantCount(count || 0);
    };
    load();
  }, []);

  const sendMessage = () => {
    if (!form.subject || !form.message) { toast.error("Preencha todos os campos"); return; }
    setSent((prev) => [{ subject: form.subject, target: form.target, date: new Date().toLocaleString("pt-BR") }, ...prev]);
    toast.success(`Mensagem enviada para ${form.target === "all" ? "todas as empresas" : `empresas ${form.target}`}! 📨`);
    setForm({ ...form, subject: "", message: "" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">📨 Comunicação</h1>
        <p className="text-sm text-muted-foreground">Envie mensagens e notificações para as empresas</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Nova Mensagem</h3>
          <div>
            <Label>Destinatários</Label>
            <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas ({tenantCount})</SelectItem>
                <SelectItem value="active">Apenas ativas</SelectItem>
                <SelectItem value="trial">Apenas em trial</SelectItem>
                <SelectItem value="inactive">Apenas inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Assunto</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Novidade no LucenaDelivery!" /></div>
          <div><Label>Mensagem</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Escreva sua mensagem aqui..." /></div>
          <Button className="w-full" onClick={sendMessage}><Send className="h-4 w-4 mr-2" /> Enviar Mensagem</Button>
        </CardContent>
      </Card>

      {sent.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Mensagens Enviadas</h3>
            {sent.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div>
                  <p className="font-medium text-sm">{s.subject}</p>
                  <p className="text-xs text-muted-foreground">{s.date}</p>
                </div>
                <Badge variant="secondary">{s.target === "all" ? "Todas" : s.target}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
