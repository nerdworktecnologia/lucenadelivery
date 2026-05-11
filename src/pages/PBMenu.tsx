import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart, CartItem } from "@/contexts/CartContext";
import { DeliveryType } from "@/types/orders";
import logoTempero from "@/assets/logo-tempero-de-maria.jpeg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Plus, Minus, Trash2, Send, Search, Clock, Truck, MapPin, Store, UtensilsCrossed, LogIn, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const DELIVERY_FEE = 5.0;

interface DbCategory {
  id: string;
  name: string;
  icon: string;
  image: string;
  sort_order: number;
}

interface DbAddon {
  id: string;
  name: string;
  price: number;
  group?: string;
}

interface DbProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category_id: string | null;
  active: boolean;
  featured: boolean;
  addons: DbAddon[];
  prep_time: number | null;
  badge: string | null;
}

const PBMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, addItem, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();

  const [tenantName, setTenantName] = useState("Carregando...");
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
  const [addons, setAddons] = useState<DbAddon[]>([]);
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);
  const [search, setSearch] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("entrega");
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "", payment: "PIX", changeFor: "", notes: "" });

  useEffect(() => {
    const fetchMenu = async () => {
      const menuSlug = slug || "tempero-de-maria";

      // 1. Get tenant by slug
      const { data: tenant, error: tErr } = await supabase
        .from("tenants")
        .select("id, name, owner_id")
        .eq("slug", menuSlug)
        .single();

      if (tErr || !tenant || !tenant.owner_id) {
        setNotFound(true);
        setLoadingData(false);
        return;
      }

      setTenantName(tenant.name);
      const ownerId = tenant.owner_id;

      // 2. Fetch categories + products in parallel
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").eq("user_id", ownerId).order("sort_order"),
        supabase.from("products").select("*").eq("user_id", ownerId).eq("active", true),
      ]);

      setCategories((catRes.data || []) as DbCategory[]);
      setProducts(
        (prodRes.data || []).map((p) => {
          const row = p as Omit<DbProduct, "addons"> & { addons?: unknown };
          return {
            ...row,
            addons: Array.isArray(row.addons) ? (row.addons as DbAddon[]) : [],
          };
        }) as DbProduct[]
      );
      setLoadingData(false);
    };

    fetchMenu();
  }, [slug]);

  const activeProducts = products;
  const filtered = activeProducts
    .filter((p) => selectedCat === "all" || p.category_id === selectedCat)
    .filter((p) => search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));

  const openProduct = (p: DbProduct) => {
    setSelectedProduct(p);
    setAddons([]);
    setNotes("");
    setQty(1);
  };

  const toggleAddon = (addon: DbAddon) => {
    setAddons((prev) => prev.find((a) => a.id === addon.id) ? prev.filter((a) => a.id !== addon.id) : [...prev, addon]);
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    addItem({ productId: selectedProduct.id, productName: selectedProduct.name, price: selectedProduct.price, quantity: qty, addons, notes, image: selectedProduct.image });
    setSelectedProduct(null);
    toast.success("Adicionado ao carrinho! 🛒");
  };

  const itemTotal = (item: CartItem) => (item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity;
  const finalTotal = deliveryType === "entrega" ? total + DELIVERY_FEE : total;

  const submitOrder = async () => {
    if (!checkoutForm.name || !checkoutForm.phone) { toast.error("Preencha nome e telefone"); return; }
    if (deliveryType === "entrega" && !checkoutForm.address) { toast.error("Preencha o endereço de entrega"); return; }

    const menuSlug = slug || "tempero-de-maria";
    const { data: tenant } = await supabase.from("tenants").select("id, name, owner_id").eq("slug", menuSlug).single();
    if (!tenant) return;

    // Get next order number
    const { data: lastOrder } = await supabase.from("orders").select("number").eq("user_id", tenant.owner_id).order("number", { ascending: false }).limit(1).maybeSingle();
    const nextNumber = lastOrder ? lastOrder.number + 1 : 1;

    // Create the order in the database
    const { data: orderData, error: orderErr } = await supabase.from("orders").insert({
      user_id: tenant.owner_id,
      number: nextNumber,
      customer_name: checkoutForm.name,
      customer_phone: checkoutForm.phone,
      address: checkoutForm.address,
      payment: checkoutForm.payment,
      change_for: checkoutForm.payment === "Dinheiro" && checkoutForm.changeFor ? Number(checkoutForm.changeFor) : null,
      notes: checkoutForm.notes,
      total: finalTotal,
      status: "novo",
      channel: "link",
      delivery_type: deliveryType,
    }).select().single();

    if (orderErr) {
      toast.error("Erro ao processar pedido. Tente novamente.");
      console.error(orderErr);
      return;
    }

    // Insert order items
    if (items.length > 0) {
      await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: orderData.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          price: item.price,
          addons: item.addons.map((a) => a.name),
          notes: item.notes,
        }))
      );
    }

    toast.success("🎉 Pedido enviado com sucesso! Acompanhe o status agora.");
    clearCart();
    setCheckoutOpen(false);
    navigate(`/rastreio/${orderData.id}`);
  };

  const featuredProducts = activeProducts.filter((p) => p.featured);

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Cardápio não encontrado</h1>
          <p className="text-muted-foreground">O restaurante que você procura não existe ou não está disponível.</p>
          <Link to="/"><Button className="mt-4">Voltar ao início</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoTempero} alt={tenantName} className="w-10 h-10 rounded-xl object-cover shadow-lg" />
            <div>
              <span className="font-bold text-foreground text-lg leading-tight">{tenantName}</span>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />30-45 min</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><Truck className="h-3 w-3" />R$ {DELIVERY_FEE.toFixed(2)}</span>
                <span>•</span>
                <span className="text-primary font-medium">Aberto</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Painel</span>
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              </Link>
            )}
            <Sheet>
            <SheetTrigger asChild>
              <Button variant="default" size="sm" className="relative gap-1.5">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Carrinho</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
              <SheetHeader><SheetTitle className="text-left">🛒 Carrinho ({itemCount} itens)</SheetTitle></SheetHeader>
              <div className="flex-1 overflow-auto py-4 space-y-3">
                {items.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Seu carrinho está vazio</p>
                    <p className="text-sm text-muted-foreground/60">Adicione itens do cardápio</p>
                  </div>
                )}
                {items.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                    <img src={item.image} alt={item.productName} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">{item.productName}</h4>
                      {item.addons.length > 0 && <p className="text-xs text-muted-foreground truncate">+{item.addons.map((a) => a.name).join(', ')}</p>}
                      {item.notes && <p className="text-xs text-accent italic truncate">📝 {item.notes}</p>}
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <Button size="icon" variant="outline" className="h-6 w-6 rounded-full" onClick={() => item.quantity > 1 ? updateQuantity(i, item.quantity - 1) : removeItem(i)}>
                            {item.quantity > 1 ? <Minus className="h-3 w-3" /> : <Trash2 className="h-3 w-3 text-destructive" />}
                          </Button>
                          <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-6 w-6 rounded-full" onClick={() => updateQuantity(i, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-bold text-foreground text-sm">R$ {itemTotal(item).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {items.length > 0 && (
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
                    {deliveryType === "entrega" && <div className="flex justify-between text-muted-foreground"><span>Entrega</span><span>R$ {DELIVERY_FEE.toFixed(2)}</span></div>}
                    <div className="flex justify-between text-lg font-bold text-foreground pt-1 border-t border-border"><span>Total</span><span>R$ {finalTotal.toFixed(2)}</span></div>
                  </div>
                  <Button className="w-full h-12 text-base font-semibold" onClick={() => setCheckoutOpen(true)}>
                    <Send className="h-4 w-4 mr-2" /> Finalizar Pedido
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Bem-vindo ao {tenantName} ⚡</h1>
          <p className="text-primary-foreground/80 text-sm">Faça seu pedido online • Rápido e prático</p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar no cardápio..." className="pl-9 h-10 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-[69px] z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          <Button size="sm" variant={selectedCat === "all" ? "default" : "outline"} onClick={() => setSelectedCat("all")} className="flex-shrink-0 rounded-full">Todos</Button>
          {categories.map((cat) => (
            <Button key={cat.id} size="sm" variant={selectedCat === cat.id ? "default" : "outline"} onClick={() => setSelectedCat(cat.id)} className="flex-shrink-0 rounded-full">
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured */}
      {selectedCat === "all" && search === "" && featuredProducts.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <h2 className="text-lg font-bold text-foreground mb-3">🔥 Destaques</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {featuredProducts.map((p) => (
              <Card key={p.id} className="flex-shrink-0 w-60 overflow-hidden cursor-pointer hover:shadow-lg transition-all" onClick={() => openProduct(p)}>
                <div className="h-32 overflow-hidden relative">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  {p.badge && <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground border-0 text-xs">{p.badge}</Badge>}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-foreground text-sm truncate">{p.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-primary">R$ {p.price.toFixed(2)}</span>
                    <Button size="sm" className="h-7 w-7 p-0 rounded-full"><Plus className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {selectedCat === "all" && search === "" ? (
          categories.map((cat) => {
            const catProds = filtered.filter((p) => p.category_id === cat.id);
            if (catProds.length === 0) return null;
            return (
              <div key={cat.id} className="mb-6">
                <h2 className="text-lg font-bold text-foreground mb-3">{cat.icon} {cat.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catProds.map((product) => (
                    <Card key={product.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-all border-border/50" onClick={() => openProduct(product)}>
                      <CardContent className="p-0 flex h-28">
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-foreground text-sm line-clamp-1">{product.name}</h3>
                              {product.badge && <Badge variant="secondary" className="text-[10px] px-1 py-0">{product.badge}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.description}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary text-sm">R$ {product.price.toFixed(2)}</span>
                            <Button size="sm" className="h-7 w-7 p-0 rounded-full"><Plus className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                        <div className="w-28 h-28 flex-shrink-0">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((product) => (
              <Card key={product.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-all border-border/50" onClick={() => openProduct(product)}>
                <CardContent className="p-0 flex h-28">
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.description}</p>
                    </div>
                    <span className="font-bold text-primary text-sm">R$ {product.price.toFixed(2)}</span>
                  </div>
                  <div className="w-28 h-28 flex-shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-3 z-50 shadow-2xl shadow-primary/30">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="font-semibold">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
              <span className="text-primary-foreground/70 text-sm ml-2">no carrinho</span>
            </div>
            <span className="font-bold text-lg">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(o) => !o && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[90vh]">
          {selectedProduct && (
            <div className="overflow-auto max-h-[90vh]">
              <div className="h-52 overflow-hidden relative">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                {selectedProduct.badge && <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground border-0">{selectedProduct.badge}</Badge>}
              </div>
              <div className="p-4 space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-xl text-left">{selectedProduct.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground text-left">{selectedProduct.description}</p>
                  <div className="flex items-center gap-3 pt-1">
                    <p className="text-2xl font-bold text-primary">R$ {selectedProduct.price.toFixed(2)}</p>
                    {selectedProduct.prep_time && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{selectedProduct.prep_time} min</span>}
                  </div>
                </DialogHeader>

                {selectedProduct.addons.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Adicionais</Label>
                    <div className="space-y-2 mt-1.5">
                      {selectedProduct.addons.map((addon) => (
                        <label key={addon.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/50 cursor-pointer hover:bg-secondary transition-colors">
                          <div className="flex items-center gap-2.5">
                            <Checkbox checked={addons.some((a) => a.id === addon.id)} onCheckedChange={() => toggleAddon(addon)} />
                            <div>
                              <span className="text-sm text-foreground">{addon.name}</span>
                              {addon.group && <span className="text-xs text-muted-foreground ml-1">({addon.group})</span>}
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-primary">+ R$ {addon.price.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-semibold">Observações</Label>
                  <Textarea placeholder="Ex: sem cebola, ponto da carne, sem gelo..." value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" rows={2} />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="outline" className="rounded-full" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
                    <span className="font-bold text-xl w-8 text-center">{qty}</span>
                    <Button size="icon" variant="outline" className="rounded-full" onClick={() => setQty((q) => q + 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <Button onClick={addToCart} className="gap-2 h-11 px-5 rounded-xl font-semibold">
                    <ShoppingCart className="h-4 w-4" />
                    R$ {((selectedProduct.price + addons.reduce((s, a) => s + a.price, 0)) * qty).toFixed(2)}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Finalizar Pedido</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Tipo de pedido</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { type: 'entrega' as DeliveryType, icon: Truck, label: 'Entrega' },
                  { type: 'retirada' as DeliveryType, icon: Store, label: 'Retirada' },
                  { type: 'local' as DeliveryType, icon: UtensilsCrossed, label: 'No local' },
                ]).map(({ type, icon: Icon, label }) => (
                  <Button key={type} variant={deliveryType === type ? "default" : "outline"} size="sm" className="h-12 flex-col gap-0.5" onClick={() => setDeliveryType(type)}>
                    <Icon className="h-4 w-4" /><span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome *</Label><Input value={checkoutForm.name} onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })} /></div>
              <div><Label>Telefone *</Label><Input value={checkoutForm.phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
            </div>

            {deliveryType === "entrega" && (
              <div><Label>Endereço de entrega *</Label><Input value={checkoutForm.address} onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })} placeholder="Rua, número, bairro" /></div>
            )}

            <div>
              <Label className="text-sm font-semibold mb-2 block">Forma de pagamento</Label>
              <div className="flex gap-2 flex-wrap">
                {["PIX", "Cartão Crédito", "Cartão Débito", "Dinheiro"].map((p) => (
                  <Button key={p} size="sm" variant={checkoutForm.payment === p ? "default" : "outline"} onClick={() => setCheckoutForm({ ...checkoutForm, payment: p })} className="rounded-full">
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {checkoutForm.payment === "Dinheiro" && (
              <div><Label>Troco para</Label><Input type="number" value={checkoutForm.changeFor} onChange={(e) => setCheckoutForm({ ...checkoutForm, changeFor: e.target.value })} placeholder="Ex: 50.00" /></div>
            )}

            <div><Label>Observações do pedido</Label><Textarea value={checkoutForm.notes} onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })} placeholder="Alguma observação adicional?" rows={2} /></div>

            <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
              <h4 className="font-semibold text-foreground text-sm">Resumo do pedido</h4>
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-foreground">{item.quantity}x {item.productName}</span>
                  <span className="font-medium">R$ {itemTotal(item).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
                {deliveryType === "entrega" && <div className="flex justify-between text-sm text-muted-foreground"><span>Taxa de entrega</span><span>R$ {DELIVERY_FEE.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-foreground text-lg"><span>Total</span><span>R$ {finalTotal.toFixed(2)}</span></div>
              </div>
            </div>

            <Button className="w-full h-12 text-base font-semibold rounded-xl" onClick={submitOrder}>
              ✅ Confirmar Pedido • R$ {finalTotal.toFixed(2)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PBMenu;
