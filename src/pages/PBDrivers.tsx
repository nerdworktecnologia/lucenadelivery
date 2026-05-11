import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Trash2, Truck, Loader2, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";

interface Driver {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

export default function PBDrivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const fetchDrivers = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar entregadores");
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDrivers(); }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Preencha o nome do entregador");
      return;
    }
    setCreating(true);
    const { error } = await supabase
      .from("drivers")
      .insert({ name: name.trim(), phone: phone.trim(), user_id: user.id });

    if (error) {
      toast.error("Erro ao cadastrar entregador");
    } else {
      toast.success("Entregador cadastrado com sucesso!");
      setName("");
      setPhone("");
      fetchDrivers();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este entregador?")) return;
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover entregador");
    } else {
      toast.success("Entregador removido");
      fetchDrivers();
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">🚚 Entregadores Próprios</h1>
        <p className="text-sm text-muted-foreground">Cadastre sua equipe de entrega</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Novo Entregador
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="ex: João Silva" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input placeholder="21999999999" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
            Cadastrar Entregador
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Equipe ({drivers.length})
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : drivers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum entregador cadastrado</p>
          ) : (
            <div className="space-y-2">
              {drivers.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{d.name}</p>
                      {d.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {d.phone}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      
    </div>
  );
}
