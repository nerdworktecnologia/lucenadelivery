import { useOrders, DbOrder } from "@/contexts/OrderContext";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { OrderStatus, channelLabels } from "@/types/orders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Undo2, Printer, Volume2, Maximize, Minimize, Share2 } from "lucide-react";
import { printComanda } from "@/utils/printComanda";
import { WhatsAppShareDialog } from "@/components/WhatsAppShareDialog";

import { useIsMobile } from "@/hooks/use-mobile";
import { useCallback, useRef, useState, useEffect } from "react";

const columns: { status: OrderStatus; label: string; shortLabel: string; color: string; borderColor: string }[] = [
  { status: "confirmado", label: "⏳ Aguardando Preparo", shortLabel: "⏳ Aguardando", color: "bg-yellow-500/10", borderColor: "border-t-yellow-500" },
  { status: "em_preparo", label: "🔥 Em Preparo", shortLabel: "🔥 Preparo", color: "bg-orange-500/10", borderColor: "border-t-orange-500" },
  { status: "pronto", label: "✅ Pronto", shortLabel: "✅ Pronto", color: "bg-primary/10", borderColor: "border-t-primary" },
];

const PBKitchen = () => {
  const { orders, updateStatus } = useOrders();
  const { settings } = useStoreSettings();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<OrderStatus>("confirmado");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [waOrder, setWaOrder] = useState<DbOrder | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const audioRef = useRef<AudioContext | null>(null);
  const testSound = useCallback(() => {
    const ctx = audioRef.current || new AudioContext();
    audioRef.current = ctx;
    const now = ctx.currentTime;
    const playChime = (freq: number, start: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc.type = "triangle"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc2.type = "sine"; osc2.frequency.value = freq * 2.5;
      gain2.gain.setValueAtTime(0, now + start);
      gain2.gain.linearRampToValueAtTime(vol * 0.12, now + start + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + start + dur * 0.6);
      osc.start(now + start); osc.stop(now + start + dur);
      osc2.start(now + start); osc2.stop(now + start + dur);
    };
    playChime(659, 0, 0.6, 0.25);
    playChime(880, 0.35, 0.8, 0.3);
    playChime(784, 0.9, 0.5, 0.12);
  }, []);

  const timeSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / 60000);

  const renderOrderCard = (order: ReturnType<typeof useOrders>["orders"][0], colStatus: OrderStatus) => {
    const mins = timeSince(order.created_at);
    const urgent = mins > 30;
    return (
      <Card key={order.id} className={`overflow-hidden ${urgent ? "border-destructive/50 ring-1 ring-destructive/20" : ""}`}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">#{order.number}</span>
              <span className="text-xs text-muted-foreground">{channelLabels[order.channel]}</span>
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${urgent ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
              {urgent && <AlertCircle className="h-3 w-3" />}
              <Clock className="h-3 w-3" />{mins}min
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{order.customer_name}</p>
          <div className="space-y-1 border-t border-border pt-2">
            {order.items.map((item, i) => (
              <div key={i}>
                <span className="text-sm font-medium text-foreground">{item.quantity}x {item.product_name}</span>
                {item.addons.length > 0 && <p className="text-xs text-muted-foreground pl-4">+ {item.addons.join(', ')}</p>}
                {item.notes && <p className="text-xs text-accent pl-4 font-medium">📝 {item.notes}</p>}
              </div>
            ))}
          </div>
          {order.notes && <div className="text-xs bg-accent/10 text-accent p-2 rounded-lg font-medium">⚠️ {order.notes}</div>}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="ghost" className="gap-1 px-2" onClick={() => printComanda(order, "completo", settings.print_width)} title="Imprimir comanda completa">
              <Printer className="h-3.5 w-3.5" />
            </Button>
            {colStatus === "confirmado" && (
              <Button size="sm" className="flex-1" onClick={() => updateStatus(order.id, "em_preparo")}>🔥 Iniciar</Button>
            )}
            {colStatus === "em_preparo" && (
              <>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStatus(order.id, "confirmado")}><Undo2 className="h-3 w-3" /></Button>
                <Button size="sm" className="flex-1 bg-primary" onClick={() => updateStatus(order.id, "pronto")}>✅ Pronto</Button>
              </>
            )}
            {colStatus === "pronto" && (
              <>
                <Button size="sm" variant="outline" className="gap-1 px-2" onClick={() => printComanda(order, "completo", settings.print_width)} title="Imprimir pedido completo">
                  <Printer className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="gap-1 px-2" onClick={() => setWaOrder(order)} title="Enviar comanda via WhatsApp">
                  <Share2 className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => updateStatus(order.id, "saiu_entrega")}>🚗 Saiu p/ Entrega</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const visibleColumns = isMobile ? columns.filter(c => c.status === activeTab) : columns;

  return (
    <div ref={containerRef} className={`space-y-3 md:space-y-4 ${isFullscreen ? "bg-background p-4 md:p-6 overflow-auto" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">🍳 Cozinha {isFullscreen ? "(Tela Cheia)" : ""}</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {orders.filter((o) => ["confirmado", "em_preparo"].includes(o.status)).length} pendente(s)
          </p>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={testSound} className="gap-1 h-8 px-2 md:px-3">
            <Volume2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Testar Som</span>
          </Button>
          <Button size="sm" variant="outline" onClick={toggleFullscreen} className="gap-1 h-8 px-2 md:px-3" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {isFullscreen ? <Minimize className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Maximize className="h-3.5 w-3.5 md:h-4 md:w-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Sair" : "Tela Cheia"}</span>
          </Button>
          <Badge variant="secondary" className="text-xs md:text-sm font-mono">
            {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </Badge>
        </div>
      </div>

      {/* Mobile tabs */}
      {isMobile && (
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {columns.map((col) => {
            const count = orders.filter(o => o.status === col.status).length;
            return (
              <button
                key={col.status}
                onClick={() => setActiveTab(col.status)}
                className={`flex-1 text-xs font-semibold py-2 px-1 rounded-lg transition-all ${
                  activeTab === col.status
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {col.shortLabel}
                {count > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Columns */}
      <div className={`${isMobile ? "space-y-3" : "grid md:grid-cols-3 gap-4"} min-h-[calc(100vh-12rem)]`}>
        {visibleColumns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className={`rounded-2xl border-t-4 ${col.borderColor} ${col.color} p-3 md:p-4 space-y-3`}>
              {!isMobile && (
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">{col.label}</h2>
                  <Badge variant="outline" className="font-bold">{colOrders.length}</Badge>
                </div>
              )}
              {colOrders.map((order) => renderOrderCard(order, col.status))}
              {colOrders.length === 0 && (
                <div className="text-center py-8 md:py-12 text-muted-foreground/50 text-sm">Nenhum pedido</div>
              )}
            </div>
          );
        })}
      </div>

      <WhatsAppShareDialog order={waOrder} open={!!waOrder} onOpenChange={(o) => !o && setWaOrder(null)} />
    </div>
  );
};

export default PBKitchen;
