import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Send, ShoppingBag, Zap, CheckCircle2, QrCode, ChefHat, Trash2, Plus, Minus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrderContext";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  from: string;
  phone: string;
  message: string;
  timestamp: Date;
  isBot: boolean;
}

interface DetectedItem {
  product_id: string | null;
  product_name: string;
  price: number;
  quantity: number;
}

const PBWhatsApp = () => {
  const { user } = useAuth();
  const { addOrder } = useOrders();
  const { settings: storeSettings } = useStoreSettings();
  const whatsappNumber = storeSettings.whatsapp_number || "5521990735286";
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá, gostaria de fazer um pedido")}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [products, setProducts] = useState<{ id: string; name: string; price: number }[]>([]);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Load products for matching
  useEffect(() => {
    if (!user) return;
    supabase.from("products").select("id, name, price").eq("user_id", user.id).eq("active", true)
      .then(({ data }) => { if (data) setProducts(data); });
  }, [user]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const addMessage = (from: string, phone: string, message: string, isBot: boolean) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      from, phone, message, timestamp: new Date(), isBot,
    };
    setMessages(prev => [...prev, msg]);

    // Try to detect products in customer messages
    if (!isBot && products.length > 0) {
      const found: DetectedItem[] = [];
      const lower = message.toLowerCase();
      products.forEach(p => {
        if (lower.includes(p.name.toLowerCase())) {
          // Try to detect quantity (e.g., "2 quentinhas de frango")
          const qtyMatch = lower.match(new RegExp(`(\\d+)\\s*(?:x\\s*)?${p.name.toLowerCase().split(" ")[0]}`));
          found.push({
            product_id: p.id,
            product_name: p.name,
            price: p.price,
            quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1,
          });
        }
      });
      if (found.length > 0) {
        setDetectedItems(prev => {
          const merged = [...prev];
          found.forEach(f => {
            const existing = merged.findIndex(m => m.product_id === f.product_id);
            if (existing >= 0) merged[existing].quantity += f.quantity;
            else merged.push(f);
          });
          return merged;
        });
        setShowOrderPanel(true);
        // Auto-set customer info from first message
        if (!customerName) setCustomerName(from);
        if (!customerPhone) setCustomerPhone(phone);
      }
    }
  };

  const handleSimulateMessage = () => {
    if (!input.trim()) return;
    addMessage(customerName || "Cliente", customerPhone || "5521999999999", input, false);
    setInput("");
  };

  const handleAddManualItem = () => {
    if (products.length === 0) { toast.error("Nenhum produto cadastrado"); return; }
    setDetectedItems(prev => [...prev, {
      product_id: products[0].id,
      product_name: products[0].name,
      price: products[0].price,
      quantity: 1,
    }]);
    setShowOrderPanel(true);
  };

  const handleChangeItem = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setDetectedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, product_id: product.id, product_name: product.name, price: product.price } : item
    ));
  };

  const handleRemoveItem = (index: number) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuantity = (index: number, delta: number) => {
    setDetectedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const total = detectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSendToKitchen = async () => {
    if (detectedItems.length === 0) { toast.error("Adicione itens ao pedido"); return; }
    if (!customerName.trim()) { toast.error("Informe o nome do cliente"); return; }

    // Get next order number
    const { data: lastOrder } = await supabase
      .from("orders")
      .select("number")
      .eq("user_id", user!.id)
      .order("number", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (lastOrder?.number || 0) + 1;

    addOrder({
      number: nextNumber,
      customer_id: null,
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: "",
      total,
      payment: "pix",
      status: "novo",
      created_at: new Date().toISOString(),
      address: "",
      channel: "whatsapp",
      delivery_type: "entrega",
      change_for: null,
      items: detectedItems.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        price: i.price,
        addons: [],
        notes: "",
      })),
    });

    // Bot response in chat
    addMessage("BrandDelivery", "", `✅ Pedido #${nextNumber} enviado para a cozinha!\n\n${detectedItems.map(i => `• ${i.quantity}x ${i.product_name}`).join("\n")}\n\nTotal: R$ ${total.toFixed(2)}`, true);

    toast.success(`Pedido #${nextNumber} enviado para a cozinha!`);
    setDetectedItems([]);
    setShowOrderPanel(false);
  };

  const stats = {
    total: messages.length,
    customers: messages.filter(m => !m.isBot).length,
    orders: messages.filter(m => m.isBot && m.message.includes("Pedido #")).length,
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">📱 WhatsApp Bot</h1>
        <p className="text-sm text-muted-foreground">Cole mensagens do WhatsApp Web • Detecte pedidos • Envie para a cozinha</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Número WhatsApp</p>
              <p className="font-bold text-foreground text-sm">{whatsappNumber.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mensagens na sessão</p>
              <p className="font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pedidos Criados</p>
              <p className="font-bold text-foreground">{stats.orders}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chat panel */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 flex flex-col h-[520px]">
            <div className="p-3 border-b border-border flex items-center justify-between bg-primary/5 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <span className="font-semibold text-foreground text-sm">WhatsApp → Cozinha</span>
                  <Badge className="bg-primary text-primary-foreground text-[10px] ml-2">Manual</Badge>
                </div>
              </div>
            </div>

            <div ref={chatRef} className="flex-1 overflow-auto p-4 space-y-3 bg-secondary/10">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
                  <MessageCircle className="h-10 w-10 opacity-30" />
                  <div>
                    <p className="font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-xs mt-1">Cole a mensagem do cliente abaixo.<br />O sistema detecta produtos automaticamente.</p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${msg.isBot ? "bg-card text-foreground border border-border rounded-bl-sm" : "bg-primary text-primary-foreground rounded-br-sm"}`}>
                    {!msg.isBot && <p className="text-xs opacity-75 mb-1 font-medium">{msg.from} • {msg.phone}</p>}
                    {msg.isBot && <p className="text-xs text-primary font-semibold mb-1 flex items-center gap-1"><Zap className="h-3 w-3" />BrandDelivery</p>}
                    <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-1.5 ${msg.isBot ? "text-muted-foreground" : "opacity-70"}`}>
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nome do cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} className="text-sm h-8" />
                <Input placeholder="Telefone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="text-sm h-8" />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Cole a mensagem do cliente aqui..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSimulateMessage()}
                  className="rounded-full"
                />
                <Button size="icon" className="rounded-full flex-shrink-0" onClick={handleSimulateMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right panel */}
        <div className="space-y-4">
          {/* QR Code */}
          <Card>
            <CardContent className="p-4 flex flex-col items-center gap-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <QrCode className="h-4 w-4 text-primary" />
                QR Code WhatsApp
              </h3>
              <QRCodeSVG value={waLink} size={160} bgColor="transparent" fgColor="currentColor" className="text-foreground rounded-lg" />
              <p className="text-xs text-muted-foreground text-center">Cliente escaneia para iniciar conversa no WhatsApp</p>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Phone className="h-3 w-3" />
                  Abrir WhatsApp Web
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Order builder */}
          <Card className={showOrderPanel && detectedItems.length > 0 ? "border-primary/30 shadow-md shadow-primary/5" : ""}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Montar Pedido
                </h3>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleAddManualItem}>
                  <Plus className="h-3 w-3" />
                  Item
                </Button>
              </div>

              {detectedItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Cole uma mensagem com nome de produto ou adicione itens manualmente
                </p>
              ) : (
                <div className="space-y-2">
                  {detectedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 text-sm">
                      <select
                        value={item.product_id || ""}
                        onChange={e => handleChangeItem(idx, e.target.value)}
                        className="flex-1 bg-transparent text-foreground text-xs border-none outline-none min-w-0"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - R${p.price.toFixed(2)}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleQuantity(idx, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleQuantity(idx, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveItem(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-sm font-bold text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full gap-2"
                disabled={detectedItems.length === 0}
                onClick={handleSendToKitchen}
              >
                <ChefHat className="h-4 w-4" />
                Enviar para Cozinha
              </Button>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-4">
              <h3 className="font-bold text-foreground text-sm mb-2">Como funciona</h3>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Cliente escaneia o QR Code e manda mensagem</li>
                <li>Você abre o WhatsApp Web e copia a mensagem</li>
                <li>Cola aqui — o sistema detecta produtos automaticamente</li>
                <li>Ajuste itens e clique <strong>"Enviar para Cozinha"</strong></li>
                <li>Pedido aparece no painel e na cozinha (KDS)</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PBWhatsApp;
