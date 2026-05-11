import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2 } from "lucide-react";
import { DbOrder } from "@/contexts/OrderContext";
import { shareComandaWhatsApp } from "@/utils/printComanda";

const STORAGE_KEY = "whatsapp_entregador_phone";

interface WhatsAppShareDialogProps {
  order: DbOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppShareDialog({ order, open, onOpenChange }: WhatsAppShareDialogProps) {
  const [phone, setPhone] = useState(() => localStorage.getItem(STORAGE_KEY) || "0000000000");

  const handleShare = () => {
    if (!order) return;
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10) return;
    localStorage.setItem(STORAGE_KEY, phone);
    shareComandaWhatsApp(order, clean);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-green-600" />
            Enviar Comanda via WhatsApp
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="wa-phone">Número do Entregador</Label>
            <Input
              id="wa-phone"
              placeholder="+55 21 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleShare()}
            />
            <p className="text-xs text-muted-foreground">
              O número será salvo para próximos envios
            </p>
          </div>
          {order && (
            <div className="rounded-lg bg-secondary/50 p-3 text-sm space-y-1">
              <p className="font-semibold text-foreground">Pedido #{order.number}</p>
              <p className="text-muted-foreground">{order.customer_name} • R$ {order.total.toFixed(2)}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleShare} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Share2 className="h-4 w-4" />Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
