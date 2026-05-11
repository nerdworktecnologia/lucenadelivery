import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

const EmitirNota = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoice_type: "NFS-e",
    client_name: "",
    client_document: "",
    client_email: "",
    description: "",
    amount: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setLoading(true);
    const taxRate = 0.05;
    const taxAmount = amount * taxRate;
    const totalAmount = amount + taxAmount;
    const invoiceNumber = `NF-${Date.now().toString(36).toUpperCase()}`;

    const { error } = await supabase.from("invoices").insert({
      user_id: user.id,
      invoice_number: invoiceNumber,
      invoice_type: form.invoice_type,
      client_name: form.client_name,
      client_document: form.client_document,
      client_email: form.client_email || null,
      description: form.description,
      amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao emitir nota fiscal.");
      console.error(error);
    } else {
      toast.success("Nota fiscal emitida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["invoices-summary"] });
      queryClient.invalidateQueries({ queryKey: ["invoices-list"] });
      navigate("/dashboard/notas");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Emitir Nota Fiscal
      </h1>
      <p className="text-muted-foreground mb-8">Preencha os dados abaixo para gerar uma nova nota.</p>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Tipo de Nota</Label>
              <Select value={form.invoice_type} onValueChange={(v) => handleChange("invoice_type", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NFS-e">NFS-e (Serviço)</SelectItem>
                  <SelectItem value="NF-e">NF-e (Produto)</SelectItem>
                  <SelectItem value="NFC-e">NFC-e (Consumidor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Cliente *</Label>
                <Input className="mt-1.5" required value={form.client_name} onChange={(e) => handleChange("client_name", e.target.value)} placeholder="Razão social ou nome" />
              </div>
              <div>
                <Label>CPF/CNPJ *</Label>
                <Input className="mt-1.5" required value={form.client_document} onChange={(e) => handleChange("client_document", e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
            </div>

            <div>
              <Label>Email do Cliente</Label>
              <Input className="mt-1.5" type="email" value={form.client_email} onChange={(e) => handleChange("client_email", e.target.value)} placeholder="cliente@email.com" />
            </div>

            <div>
              <Label>Descrição do Serviço/Produto *</Label>
              <Textarea className="mt-1.5" required value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Descreva o serviço ou produto..." rows={3} />
            </div>

            <div>
              <Label>Valor (R$) *</Label>
              <Input className="mt-1.5" required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => handleChange("amount", e.target.value)} placeholder="0,00" />
            </div>

            {form.amount && !isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Valor base</span><span>R$ {parseFloat(form.amount).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Impostos (5%)</span><span>R$ {(parseFloat(form.amount) * 0.05).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-1 mt-1"><span>Total</span><span>R$ {(parseFloat(form.amount) * 1.05).toFixed(2)}</span></div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Emitindo..." : "Emitir Nota Fiscal"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmitirNota;
