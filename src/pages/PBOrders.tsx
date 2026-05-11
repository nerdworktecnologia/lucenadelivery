import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useOrders, DbOrder } from "@/contexts/OrderContext";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { statusLabels, statusColors, OrderStatus, channelLabels, deliveryLabels } from "@/types/orders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Phone, MapPin, CreditCard, StickyNote, Printer, Eye, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { printComanda } from "@/utils/printComanda";
import { WhatsAppShareDialog } from "@/components/WhatsAppShareDialog";
import Footer from "@/components/Footer";

const allStatuses: OrderStatus[] = ['novo', 'confirmado', 'em_preparo', 'pronto', 'saiu_entrega', 'entregue', 'cancelado'];
const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  novo: 'confirmado', confirmado: 'em_preparo', em_preparo: 'pronto', pronto: 'saiu_entrega', saiu_entrega: 'entregue',
};

const PBOrders = () => {
  const { orders, updateStatus } = useOrders();
  const { settings } = useStoreSettings();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [detail, setDetail] = useState<string | null>(null);
  const [waOrder, setWaOrder] = useState<DbOrder | null>(null);

  useEffect(() => {
    if (detail && settings.auto_print_on_selection) {
      const order = orders.find(o => o.id === detail);
      if (order) {
        printComanda(order, "completo", settings.print_width);
      }
    }
  }, [detail, orders, settings.auto_print_on_selection, settings.print_width]);

  const filtered = orders
    .filter((o) => filter === "todos" || o.status === filter)
    .filter((o) => o.customer_name.toLowerCase().includes(search.toLowerCase()) || String(o.number).includes(search));

  const timeSince = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}min`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h`;
    return `${Math.floor(mins / 1440)}d`;
  };

  const detailOrder = orders.find((o) => o.id === detail);

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-xs md:text-sm text-muted-foreground">{filtered.length} pedido(s)</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar pedido ou cliente..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Button size="sm" variant={filter === "todos" ? "default" : "outline"} onClick={() => setFilter("todos")} className="rounded-full shrink-0 text-xs">Todos</Button>
        {allStatuses.map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="rounded-full shrink-0 text-xs">
              {statusLabels[s]} {count > 0 && <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full">{count}</Badge>}
            </Button>
          );
        })}
      </div>

      <div className="grid gap-3">
        {filtered.map((order) => (
          <Card key={order.id} className={`overflow-hidden transition-all hover:shadow-md ${order.status === 'novo' ? 'border-blue-500/50 shadow-blue-500/10 shadow-md' : ''}`}>
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">#{order.number}</span>
                      <Badge className={`${statusColors[order.status]} text-white border-0`}>{statusLabels[order.status]}</Badge>
                      <span className="text-xs text-muted-foreground">{channelLabels[order.channel]}</span>
                      <span className="text-xs text-muted-foreground">{deliveryLabels[order.delivery_type as keyof typeof deliveryLabels]}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Clock className="h-3.5 w-3.5" />{timeSince(order.created_at)}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-1.5 text-sm">
                    <span className="font-medium text-foreground">{order.customer_name}</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" />{order.customer_phone}</span>
                    {order.address && <span className="flex items-center gap-1.5 text-muted-foreground sm:col-span-2"><MapPin className="h-3 w-3" />{order.address}</span>}
                  </div>
                  <div className="border-t border-border pt-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-0.5">
                        <span className="text-foreground">{item.quantity}x {item.product_name}{item.addons.length > 0 && <span className="text-muted-foreground"> (+{item.addons.join(', ')})</span>}{item.notes && <span className="text-accent italic"> • {item.notes}</span>}</span>
                        <span className="font-medium text-foreground">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {order.notes && <div className="flex items-start gap-2 text-sm bg-accent/10 p-2 rounded-lg"><StickyNote className="h-3.5 w-3.5 mt-0.5 text-accent flex-shrink-0" /><span className="text-foreground">{order.notes}</span></div>}
                </div>
                <div className="lg:w-48 p-4 bg-secondary/30 flex flex-col justify-between gap-3 border-t lg:border-t-0 lg:border-l border-border">
                  <div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1"><CreditCard className="h-3.5 w-3.5" />{order.payment}</div>
                    <p className="text-2xl font-bold text-foreground">R$ {order.total.toFixed(2)}</p>
                    {order.change_for && <p className="text-xs text-muted-foreground">Troco para R$ {order.change_for.toFixed(2)}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Button size="sm" variant="outline" className="w-full gap-1" onClick={() => setDetail(order.id)}>
                      <Eye className="h-3 w-3" />Detalhes
                    </Button>
                    <div className="grid grid-cols-2 gap-1">
                      <Button size="sm" variant="ghost" className="gap-1 text-[10px] h-8" onClick={() => printComanda(order, "cozinha", settings.print_width)}>
                        <Printer className="h-3 w-3" />Cozinha
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 text-[10px] h-8" onClick={() => printComanda(order, "entrega", settings.print_width)}>
                        <Printer className="h-3 w-3" />Entrega
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 text-[10px] h-8" onClick={() => printComanda(order, "completo", settings.print_width)}>
                        <Printer className="h-3 w-3" />Pedido
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 text-[10px] h-8" onClick={() => setWaOrder(order)}>
                         <Share2 className="h-3 w-3" />WhatsApp
                       </Button>
                    </div>
                    {nextStatus[order.status] && (
                      <Button size="sm" className="w-full" onClick={() => updateStatus(order.id, nextStatus[order.status]!)}>
                        → {statusLabels[nextStatus[order.status]!]}
                      </Button>
                    )}
                    {order.status !== 'cancelado' && order.status !== 'entregue' && (
                      <Button size="sm" variant="destructive" className="w-full" onClick={() => updateStatus(order.id, 'cancelado')}>Cancelar</Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground">Nenhum pedido encontrado</div>}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Pedido #{detailOrder.number}
                  <Badge className={`${statusColors[detailOrder.status]} text-white border-0`}>{statusLabels[detailOrder.status]}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium text-foreground">{detailOrder.customer_name}</span></div>
                  <div><span className="text-muted-foreground">Tel:</span> <span className="font-medium text-foreground">{detailOrder.customer_phone}</span></div>
                  <div><span className="text-muted-foreground">Canal:</span> <span className="font-medium text-foreground">{channelLabels[detailOrder.channel]}</span></div>
                  <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium text-foreground">{deliveryLabels[detailOrder.delivery_type as keyof typeof deliveryLabels]}</span></div>
                  <div><span className="text-muted-foreground">Pagamento:</span> <span className="font-medium text-foreground">{detailOrder.payment}</span></div>
                  <div><span className="text-muted-foreground">Horário:</span> <span className="font-medium text-foreground">{new Date(detailOrder.created_at).toLocaleString("pt-BR")}</span></div>
                </div>
                {detailOrder.address && <div><span className="text-muted-foreground">Endereço:</span> <span className="font-medium text-foreground">{detailOrder.address}</span></div>}
                <div className="border-t border-border pt-2">
                  <h4 className="font-semibold text-foreground mb-1">Itens</h4>
                  {detailOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1">
                      <span>{item.quantity}x {item.product_name}{item.addons.length > 0 ? ` (+${item.addons.join(', ')})` : ''}{item.notes ? ` • ${item.notes}` : ''}</span>
                      <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                  <span>Total</span><span>R$ {detailOrder.total.toFixed(2)}</span>
                </div>
                {detailOrder.notes && <div className="bg-accent/10 p-2 rounded-lg">📝 {detailOrder.notes}</div>}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="gap-2 h-10 text-xs" onClick={() => printComanda(detailOrder, "cozinha", settings.print_width)}><Printer className="h-4 w-4" />Cozinha</Button>
                  <Button variant="outline" className="gap-2 h-10 text-xs" onClick={() => printComanda(detailOrder, "entrega", settings.print_width)}><Printer className="h-4 w-4" />Entrega</Button>
                  <Button variant="outline" className="gap-2 h-10 text-xs" onClick={() => printComanda(detailOrder, "completo", settings.print_width)}><Printer className="h-4 w-4" />Pedido</Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { setDetail(null); setWaOrder(detailOrder); }}><Share2 className="h-4 w-4" />WhatsApp</Button>
                </div>
    </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <WhatsAppShareDialog order={waOrder} open={!!waOrder} onOpenChange={(o) => !o && setWaOrder(null)} />
      
    </div>
  );
};


export default PBOrders;
