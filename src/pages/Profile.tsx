import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", company_name: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, company_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({ full_name: data.full_name || "", company_name: data.company_name || "" });
        }
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, company_name: form.company_name })
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar perfil.");
    } else {
      toast.success("Perfil atualizado com sucesso!");
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Meu Perfil
      </h1>
      <p className="text-muted-foreground mb-8">Gerencie suas informações pessoais e da empresa.</p>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input className="mt-1.5" value={user?.email || ""} disabled />
            </div>
            <div>
              <Label>Nome Completo</Label>
              <Input className="mt-1.5" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Seu nome completo" />
            </div>
            <div>
              <Label>Nome da Empresa</Label>
              <Input className="mt-1.5" value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} placeholder="Razão social ou nome fantasia" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
