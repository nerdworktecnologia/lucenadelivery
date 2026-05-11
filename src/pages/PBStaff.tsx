import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Trash2, Users, ChefHat, ShoppingBag, Truck, Loader2, Link2, Copy, Check } from "lucide-react";

interface StaffUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

const roleLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "Administrador", icon: <Users className="h-4 w-4" />, color: "bg-primary/10 text-primary" },
  cozinha: { label: "Cozinha (KDS)", icon: <ChefHat className="h-4 w-4" />, color: "bg-orange-100 text-orange-600" },
  pedidos: { label: "Pedidos", icon: <ShoppingBag className="h-4 w-4" />, color: "bg-blue-100 text-blue-600" },
  entrega: { label: "Entrega", icon: <Truck className="h-4 w-4" />, color: "bg-green-100 text-green-600" },
  user: { label: "Funcionário", icon: <ShoppingBag className="h-4 w-4" />, color: "bg-accent text-accent-foreground" },
};

const PBStaff = () => {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cozinha");

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-staff", {
      body: { action: "list" },
    });
    if (error) {
      toast.error("Erro ao carregar usuários");
    } else {
      setStaff(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleCreate = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("Preencha usuário e senha");
      return;
    }
    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("manage-staff", {
      body: { action: "create", username: username.trim(), password, role },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao criar usuário");
    } else {
      toast.success(`Usuário "${username}" criado com sucesso! ✅`);
      setUsername("");
      setPassword("");
      fetchStaff();
    }
    setCreating(false);
  };

  const handleDelete = async (user: StaffUser) => {
    if (!confirm(`Tem certeza que deseja excluir "${user.username}"?`)) return;
    setDeleting(user.id);
    const { data, error } = await supabase.functions.invoke("manage-staff", {
      body: { action: "delete", user_id: user.id },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao excluir usuário");
    } else {
      toast.success(`Usuário "${user.username}" excluído! 🗑️`);
      fetchStaff();
    }
    setDeleting(null);
  };

  const handleGenerateLink = async (user: StaffUser) => {
    setGeneratingLink(user.id);
    const { data, error } = await supabase.functions.invoke("manage-staff", {
      body: { action: "generate_link", user_id: user.id },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao gerar link");
    } else {
      await navigator.clipboard.writeText(data.link);
      setCopiedLink(user.id);
      toast.success("Link de auto-login copiado! 📋 Envie para o funcionário.");
      setTimeout(() => setCopiedLink(null), 3000);
    }
    setGeneratingLink(null);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">👥 Equipe</h1>
        <p className="text-sm text-muted-foreground">Crie e gerencie os acessos da sua equipe</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Novo Usuário
          </h3>
          <div className="space-y-3">
            <div>
              <Label>Nome de Usuário</Label>
              <Input
                placeholder="ex: cozinhatemperosdemaria"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
              />
              <p className="text-xs text-muted-foreground mt-1">Sem espaços, sem @. Esse será o login do usuário.</p>
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cozinha">🍳 Cozinha — só vê o KDS</SelectItem>
                  <SelectItem value="pedidos">📋 Pedidos — só vê lista de pedidos</SelectItem>
                  <SelectItem value="entrega">🚚 Entrega — só vê entregas</SelectItem>
                  <SelectItem value="admin">👑 Administrador — acesso total</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Criar Usuário
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Usuários ({staff.length})
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum usuário criado ainda</p>
          ) : (
            <div className="space-y-2">
              {staff.map((u) => {
                const roleInfo = roleLabels[u.role] || roleLabels.user;
                return (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleInfo.color}`}>
                        {roleInfo.icon}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{u.username}</p>
                        <p className="text-xs text-muted-foreground">{roleInfo.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleGenerateLink(u)}
                        disabled={generatingLink === u.id}
                        className="text-muted-foreground hover:text-primary"
                        title="Copiar link de auto-login"
                      >
                        {generatingLink === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : copiedLink === u.id ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(u)}
                        disabled={deleting === u.id}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {deleting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PBStaff;
