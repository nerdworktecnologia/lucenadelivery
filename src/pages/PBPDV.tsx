import { useState, useEffect, useMemo } from "react";
import { printComanda } from "@/utils/printComanda";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrderContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard,
  Banknote, QrCode, Receipt, User, Phone, MapPin, X, Percent, StickyNote, Tag, Printer,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PDVProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category_id: string | null;
  category_name?: string;
}

interface PDVCartItem {
  product: PDVProduct;
  quantity: number;
  notes: string;
}

interface ReceiptData {
  number: number;
  customerName: string;
  customerPhone: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  payment: string;
  deliveryType: string;
  notes: string;
  date: Date;
  changeFor: number | null;
}

type PDVDeliveryType = "local" | "retirada";

const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "pix", label: "PIX", icon: QrCode },
  { value: "credito", label: "Crédito", icon: CreditCard },
  { value: "debito", label: "Débito", icon: CreditCard },
];

export default function PBPDV() {
  const { user } = useAuth();
  const { addOrder, orders } = useOrders();
  const { settings } = useStoreSettings();
  const [products, setProducts] = useState<PDVProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<PDVCartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string; address: string }[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [payment, setPayment] = useState("dinheiro");
  const [deliveryType, setDeliveryType] = useState<PDVDeliveryType>("local");
  const [changeFor, setChangeFor] = useState("");
  const [discountType, setDiscountType] = useState<"value" | "percent">("value");
  const [discountInput, setDiscountInput] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from("products").select("id, name, price, image, category_id").eq("user_id", user.id).eq("active", true),
        supabase.from("categories").select("id, name").eq("user_id", user.id).order("sort_order"),
      ]);
      setCategories(cats || []);
      const catMap = Object.fromEntries((cats || []).map(c => [c.id, c.name]));
      setProducts((prods || []).map(p => ({ ...p, category_name: p.category_id ? catMap[p.category_id] : undefined })));
    };
    load();
  }, [user]);

  // Fetch customers for autocomplete
  useEffect(() => {
    if (!user) return;
    const loadCustomers = async () => {
      const { data } = await supabase.from("customers").select("id, name, phone, address").eq("user_id", user.id);
      setCustomers(data || []);
    };
    loadCustomers();
  }, [user]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 5);
  }, [customerSearch, customers]);

  const selectCustomer = (c: { id: string; name: string; phone: string }) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setSelectedCustomerId(c.id);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const clearCustomer = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSelectedCustomerId(null);
    setCustomerSearch("");
  };

  const filtered = useMemo(() =>
    products
      .filter(p => selectedCategory === "todas" || p.category_id === selectedCategory)
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, selectedCategory, search]
  );

  const addToCart = (product: PDVProduct) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { product, quantity: 1, notes: "" }];
    });
  };

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const copy = [...prev];
      const newQty = copy[idx].quantity + delta;
      if (newQty <= 0) return copy.filter((_, i) => i !== idx);
      copy[idx] = { ...copy[idx], quantity: newQty };
      return copy;
    });
  };

  const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const discountAmount = useMemo(() => {
    const v = parseFloat(discountInput) || 0;
    if (v <= 0) return 0;
    if (discountType === "percent") return Math.min(subtotal, subtotal * v / 100);
    return Math.min(subtotal, v);
  }, [discountInput, discountType, subtotal]);
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const nextNumber = useMemo(() => {
    if (orders.length === 0) return 1;
    return Math.max(...orders.map(o => o.number)) + 1;
  }, [orders]);

  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error("Adicione itens ao pedido"); return; }
    if (!customerName.trim()) { toast.error("Informe o nome do cliente"); return; }
    setSubmitting(true);
    try {
      await addOrder({
        number: nextNumber,
        customer_id: selectedCustomerId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        notes: orderNotes.trim(),
        total,
        payment,
        status: "novo",
        created_at: new Date().toISOString(),
        address: "",
        channel: "pdv",
        delivery_type: deliveryType,
        change_for: payment === "dinheiro" && changeFor ? Number(changeFor) : null,
        items: cart.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
          addons: [],
          notes: i.notes,
        })),
      });
      setReceipt({
        number: nextNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map(i => ({ name: i.product.name, qty: i.quantity, price: i.product.price })),
        subtotal,
        discount: discountAmount,
        total,
        payment,
        deliveryType,
        notes: orderNotes.trim(),
        date: new Date(),
        changeFor: payment === "dinheiro" && changeFor ? Number(changeFor) : null,
      });
      toast.success(`Pedido #${nextNumber} registrado!`);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setSelectedCustomerId(null);
      setCustomerSearch("");
      setChangeFor("");
      setDiscountInput("");
      setOrderNotes("");
    } catch {
      toast.error("Erro ao registrar pedido");
    }
    setSubmitting(false);
  };

  const handlePrint = () => {
    if (!receipt) return;
    printComanda({
      id: "pdv-" + Date.now(),
      number: receipt.number,
      customer_id: null,
      customer_name: receipt.customerName,
      customer_phone: receipt.customerPhone,
      total: receipt.total,
      payment: receipt.payment,
      status: "novo",
      created_at: receipt.date.toISOString(),
      address: "",
      channel: "pdv",
      delivery_type: receipt.deliveryType,
      change_for: receipt.changeFor,
      notes: receipt.notes,
      items: receipt.items.map((i, idx) => ({
        id: "item-" + idx,
        order_id: "",
        product_id: null,
        product_name: i.name,
        quantity: i.qty,
        price: i.price,
        addons: [],
        notes: "",
      })),
    }, "completo", settings.print_width);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 md:gap-4 h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5rem)]">
      {/* Left: Product grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-1.5 md:gap-2">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex flex-col items-center p-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-center group"
              >
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-16 h-16 rounded-lg object-cover mb-2 group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mb-2 text-2xl">🍽️</div>
                )}
                <span className="text-xs font-medium line-clamp-2 leading-tight">{p.name}</span>
                <span className="text-sm font-bold text-primary mt-1">
                  R$ {p.price.toFixed(2).replace(".", ",")}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum produto encontrado</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Cart / Checkout */}
      <Card className="w-full lg:w-[380px] flex flex-col shrink-0">
        <CardHeader className="py-3 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-primary" />
            PDV — Novo Pedido
            {itemCount > 0 && <Badge variant="secondary" className="ml-auto">{itemCount} itens</Badge>}
          </CardTitle>
        </CardHeader>
        <Separator />

        <ScrollArea className="flex-1 px-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Toque em um produto para adicionar</p>
            </div>
          ) : (
            <div className="py-3 space-y-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {item.product.price.toFixed(2).replace(".", ",")} un.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(idx, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(idx, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-bold w-20 text-right">
                    R$ {(item.product.price * item.quantity).toFixed(2).replace(".", ",")}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {cart.length > 0 && (
          <div className="p-4 border-t border-border space-y-3">
            {/* Customer */}
            <div className="space-y-1.5">
              {selectedCustomerId ? (
                <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{customerName}</p>
                    {customerPhone && <p className="text-[10px] text-muted-foreground">{customerPhone}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearCustomer}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar cliente..."
                        value={customerSearch || customerName}
                        onChange={e => {
                          const v = e.target.value;
                          setCustomerName(v);
                          setCustomerSearch(v);
                          setShowCustomerDropdown(v.trim().length > 0);
                        }}
                        onFocus={() => { if (customerSearch.trim()) setShowCustomerDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                        className="pl-7 h-8 text-xs"
                      />
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                          {filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              onMouseDown={() => selectCustomer(c)}
                              className="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors"
                            >
                              <p className="text-xs font-medium text-foreground">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground">{c.phone}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Telefone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="pl-7 h-8 text-xs" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery type */}
            <RadioGroup value={deliveryType} onValueChange={v => setDeliveryType(v as PDVDeliveryType)} className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local" className="text-xs cursor-pointer">No local</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="retirada" id="retirada" />
                <Label htmlFor="retirada" className="text-xs cursor-pointer">Retirada</Label>
              </div>
            </RadioGroup>

            {/* Payment */}
            <div className="grid grid-cols-4 gap-1.5">
              {paymentMethods.map(m => (
                <button
                  key={m.value}
                  onClick={() => setPayment(m.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                    payment === m.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              ))}
            </div>

            {payment === "dinheiro" && (
              <Input
                placeholder="Troco para (R$)"
                type="number"
                value={changeFor}
                onChange={e => setChangeFor(e.target.value)}
                className="h-8 text-xs"
              />
            )}

            {/* Discount */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Tag className="h-3 w-3" />
                Desconto
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setDiscountType("value")}
                  className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${discountType === "value" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                >
                  R$
                </button>
                <button
                  onClick={() => setDiscountType("percent")}
                  className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${discountType === "percent" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                >
                  <Percent className="h-3 w-3" />
                </button>
                <Input
                  placeholder={discountType === "value" ? "Valor" : "Percentual"}
                  type="number"
                  value={discountInput}
                  onChange={e => setDiscountInput(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <StickyNote className="h-3 w-3" />
                Observações
              </div>
              <Textarea
                placeholder="Ex: sem cebola, mesa 5, etc."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="text-xs min-h-[60px] resize-none"
              />
            </div>

            {/* Total & Submit */}
            <Separator />
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-muted-foreground">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-green-600">
                <span>Desconto</span>
                <span>- R$ {discountAmount.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-primary">
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <Button className="w-full gap-2" onClick={handleSubmit} disabled={submitting}>
              <Receipt className="h-4 w-4" />
              {submitting ? "Registrando..." : "Finalizar Pedido"}
            </Button>
          </div>
        )}
      </Card>
      {/* Receipt Dialog */}
      <Dialog open={!!receipt} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Comanda / Recibo
            </DialogTitle>
          </DialogHeader>
          {receipt && (
            <>
              <div id="receipt-content" className="space-y-2 text-sm font-mono">
                <div className="text-center">
                  <p className="font-bold text-base">LucenaDelivery</p>
                  <p className="text-xs text-muted-foreground">Comanda de Pedido</p>
                </div>
                <Separator className="border-dashed" />
                <div className="flex justify-between">
                  <span className="font-bold">Pedido #{receipt.number}</span>
                  <span className="text-xs">{receipt.date.toLocaleString("pt-BR")}</span>
                </div>
                <p>Cliente: {receipt.customerName}</p>
                {receipt.customerPhone && <p>Tel: {receipt.customerPhone}</p>}
                <p>Tipo: {receipt.deliveryType === "local" ? "No local" : "Retirada"}</p>
                <Separator className="border-dashed" />
                <div className="space-y-1">
                  {receipt.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.qty}x {item.name}</span>
                      <span>R$ {(item.price * item.qty).toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                </div>
                <Separator className="border-dashed" />
                {receipt.discount > 0 && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span>Subtotal</span>
                      <span>R$ {receipt.subtotal.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Desconto</span>
                      <span>- R$ {receipt.discount.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL</span>
                  <span>R$ {receipt.total.toFixed(2).replace(".", ",")}</span>
                </div>
                <Separator className="border-dashed" />
                <p>Pagamento: {receipt.payment.charAt(0).toUpperCase() + receipt.payment.slice(1)}</p>
                {receipt.changeFor && <p>Troco para: R$ {receipt.changeFor.toFixed(2).replace(".", ",")}</p>}
                {receipt.notes && (
                  <>
                    <Separator className="border-dashed" />
                    <p className="text-xs">Obs: {receipt.notes}</p>
                  </>
                )}
                <div className="text-center text-xs text-muted-foreground pt-2">
                  Obrigado pela preferência!
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setReceipt(null)}>
                  Fechar
                </Button>
                <Button className="flex-1 gap-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
