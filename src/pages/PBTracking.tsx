import { useState, useEffect, type ComponentType } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Clock, MapPin, CheckCircle2, Package, Search, Phone, ExternalLink } from "lucide-react";
import Footer from "@/components/Footer";
import { OrderStatus } from "@/types/orders";
import logoTempero from "@/assets/logo-tempero-de-maria.jpeg";

type TrackingDriver = { name: string; phone: string | null };
type TrackingOrder = {
  number: number;
  status: OrderStatus;
  created_at: string;
  delivery_type: string;
  address?: string | null;
  payment?: string | null;
  total: number;
  drivers?: TrackingDriver | null;
};

const statusConfig: Record<OrderStatus, { label: string; icon: ComponentType<{ className?: string }>; color: string; desc: string }> = {
  novo: { label: "Recebido", icon: Search, color: "text-blue-500", desc: "Seu pedido foi recebido pelo restaurante." },
  confirmado: { label: "Confirmado", icon: CheckCircle2, color: "text-yellow-500", desc: "O restaurante já confirmou seu pedido." },
  em_preparo: { label: "Em Preparo", icon: Package, color: "text-orange-500", desc: "Seu pedido está sendo preparado com carinho." },
  pronto: { label: "Pronto", icon: CheckCircle2, color: "text-green-500", desc: "Seu pedido está pronto!" },
  saiu_entrega: { label: "Saiu para Entrega", icon: Truck, color: "text-purple-500", desc: "O entregador já está a caminho." },
  entregue: { label: "Entregue", icon: CheckCircle2, color: "text-gray-500", desc: "Pedido entregue. Bom apetite!" },
  cancelado: { label: "Cancelado", icon: CheckCircle2, color: "text-red-500", desc: "Este pedido foi cancelado." },
};

export default function PBTracking() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          drivers (
            name,
            phone
          )
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        const row = data as Omit<TrackingOrder, "status"> & { status?: string };
        setOrder({ ...(row as TrackingOrder), status: (row.status as OrderStatus) || "novo" });
      }
      setLoading(false);
    };

    fetchOrder();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-tracking-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (payload) => {
        const newRow = payload.new as Partial<TrackingOrder> & { status?: string };
        setOrder((prev) => {
          if (!prev) return newRow as TrackingOrder;
          return { ...prev, ...newRow, status: (newRow.status as OrderStatus) || prev.status };
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <div>
          <h1 className="text-xl font-bold mb-2">Pedido não encontrado</h1>
          <p className="text-muted-foreground mb-4">Não conseguimos localizar as informações deste pedido.</p>
          <Link to="/cardapio"><Badge variant="outline">Voltar ao cardápio</Badge></Link>
        </div>
      </div>
    );
  }

  const currentStatus = (order.status as OrderStatus) || "novo";
  const config = statusConfig[currentStatus];

  return (
    <div className="min-h-screen bg-secondary/30 pb-12">
      <header className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoTempero} className="w-10 h-10 rounded-xl object-cover" alt="Logo" />
          <div>
            <h1 className="font-bold text-foreground">Acompanhar Pedido</h1>
            <p className="text-xs text-muted-foreground">#{order.number}</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Status Card */}
        <Card className="border-t-4 border-t-primary overflow-hidden">
          <CardContent className="p-6 text-center space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ${config.color}`}>
              <config.icon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{config.label}</h2>
              <p className="text-sm text-muted-foreground mt-1">{config.desc}</p>
            </div>
            
            <div className="flex items-center justify-center gap-4 pt-2">
               <div className="flex flex-col items-center">
                 <span className="text-[10px] text-muted-foreground uppercase font-bold">Iniciado em</span>
                 <span className="text-sm font-semibold">{new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
               </div>
               <div className="w-px h-8 bg-border" />
               <div className="flex flex-col items-center">
                 <span className="text-[10px] text-muted-foreground uppercase font-bold">Tipo</span>
                 <span className="text-sm font-semibold capitalize">{order.delivery_type === 'entrega' ? 'Entrega' : 'Retirada'}</span>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Card (if out for delivery) */}
        {order.status === 'saiu_entrega' && order.drivers && (
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs opacity-80 uppercase font-bold">Entregador</p>
                <h3 className="font-bold text-lg">{order.drivers.name}</h3>
              </div>
              {order.drivers.phone && (
                <a href={`https://wa.me/55${order.drivers.phone.replace(/\D/g, "")}`} target="_blank">
                  <Button size="icon" variant="secondary" className="rounded-full h-10 w-10">
                    <Phone className="h-5 w-5" />
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Details Card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" /> Detalhes do Pedido
            </h3>
            
            {order.address && (
              <div className="flex gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Endereço de Entrega</p>
                  <p className="text-muted-foreground">{order.address}</p>
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Pagamento</span>
                <Badge variant="secondary" className="capitalize">{order.payment}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-primary">R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full gap-2" asChild>
          <Link to="/cardapio">
            <ExternalLink className="h-4 w-4" /> Fazer novo pedido
          </Link>
        </Button>

        <Footer />
      </main>
    </div>
  );
}
