import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Edit2, Trash2, Loader2, Upload, ImageIcon, Sparkles, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AddonGroupEditor, { AddonGroup } from "@/components/AddonGroupEditor";

interface DbCategory { id: string; name: string; icon: string; }
interface DbProduct {
  id: string; name: string; description: string; price: number; image: string;
  category_id: string | null; active: boolean; featured: boolean; addons: unknown[];
  prep_time: number | null; badge: string | null;
}

const PBProducts = () => {
  const { user } = useAuth();
  const [prods, setProds] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [editProd, setEditProd] = useState<DbProduct | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", categoryId: "", image: "", addons: [] as AddonGroup[] });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0, name: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, icon").eq("user_id", user.id).order("sort_order"),
    ]);
    setProds(
      (p || []).map((prod) => {
        const row = prod as Omit<DbProduct, "addons"> & { addons?: unknown };
        return { ...row, addons: Array.isArray(row.addons) ? (row.addons as unknown[]) : [] };
      })
    );
    setCategories(c || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const filtered = prods
    .filter((p) => catFilter === "all" || p.category_id === catFilter)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => {
    setEditProd(null);
    setForm({ name: "", description: "", price: "", categoryId: categories[0]?.id || "", image: "", addons: [] });
    setImagePreview(null);
    setOpen(true);
  };

  const openEdit = (p: DbProduct) => {
    setEditProd(p);
    setForm({ name: p.name, description: p.description, price: String(p.price), categoryId: p.category_id || "", image: p.image, addons: (p.addons || []) as AddonGroup[] });
    setImagePreview(p.image || null);
    setOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("product-images").upload(fileName, file, { upsert: true });
    if (error) {
      toast.error("Erro ao enviar imagem");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    const url = urlData.publicUrl;
    setForm((f) => ({ ...f, image: url }));
    setImagePreview(url);
    setUploading(false);
    toast.success("Imagem enviada! ✅");
  };

  const save = async () => {
    if (!user || !form.name || !form.price) { toast.error("Preencha nome e preço"); return; }
    const payload = {
      name: form.name, description: form.description, price: Number(form.price),
      category_id: form.categoryId || null, image: form.image || "",
      user_id: user.id, addons: JSON.parse(JSON.stringify(form.addons.filter((g) => g.group && g.options.some((o) => o.name)))),
    };
    if (editProd) {
      const { error } = await supabase.from("products").update(payload).eq("id", editProd.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Produto atualizado!");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Produto criado!");
    }
    setOpen(false);
    fetchData();
  };

  const toggleActive = async (p: DbProduct) => {
    await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    fetchData();
  };

  const deleteProd = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast.success("Produto removido");
    fetchData();
  };

  const getCatName = (id: string | null) => categories.find((c) => c.id === id)?.name || "";

  const generateAllImages = async () => {
    const prodsWithoutImage = prods.filter((p) => !p.image);
    if (prodsWithoutImage.length === 0) {
      toast.info("Todos os produtos já possuem imagem!");
      return;
    }
    if (!confirm(`Gerar imagens com IA para ${prodsWithoutImage.length} produto(s) sem foto?`)) return;

    setGeneratingAll(true);
    setGenProgress({ current: 0, total: prodsWithoutImage.length, name: "" });

    for (let i = 0; i < prodsWithoutImage.length; i++) {
      const p = prodsWithoutImage[i];
      setGenProgress({ current: i + 1, total: prodsWithoutImage.length, name: p.name });

      try {
        const { data, error } = await supabase.functions.invoke("generate-product-image", {
          body: { product_id: p.id, product_name: p.name },
        });
        if (error || data?.error) {
          toast.error(`Erro em "${p.name}": ${data?.error || "falha"}`);
          // If rate limited, wait and continue
          if (data?.error?.includes("Limite")) {
            await new Promise((r) => setTimeout(r, 5000));
          }
        } else {
          toast.success(`✅ "${p.name}" — imagem gerada!`);
        }
      } catch (e) {
        toast.error(`Erro ao gerar imagem de "${p.name}"`);
      }

      // Small delay between requests to avoid rate limits
      if (i < prodsWithoutImage.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    setGeneratingAll(false);
    fetchData();
  };

  const generateSingleImage = async (p: DbProduct) => {
    toast.info(`Gerando imagem para "${p.name}"...`);
    const { data, error } = await supabase.functions.invoke("generate-product-image", {
      body: { product_id: p.id, product_name: p.name },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao gerar imagem");
    } else {
      toast.success(`Imagem gerada para "${p.name}"! ✅`);
      fetchData();
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-xs md:text-sm text-muted-foreground">{prods.length} produtos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9 w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button
            variant="outline"
            onClick={generateAllImages}
            disabled={generatingAll}
            className="gap-1"
          >
            {generatingAll ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {genProgress.current}/{genProgress.total}</>
            ) : (
              <><Sparkles className="h-4 w-4" />Gerar fotos IA</>
            )}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editProd ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Preço (R$)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                  <div><Label>Categoria</Label>
                    <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Image section */}
                <div className="space-y-2">
                  <Label>Imagem do Produto</Label>
                  
                  {/* Preview */}
                  {imagePreview && (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border bg-muted">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Upload button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Enviar foto</>
                    )}
                  </Button>

                  {/* URL input */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">ou cole a URL</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <Input
                    placeholder="https://..."
                    value={form.image}
                    onChange={(e) => {
                      setForm({ ...form, image: e.target.value });
                      setImagePreview(e.target.value || null);
                    }}
                  />
                </div>


                <AddonGroupEditor groups={form.addons} onChange={(addons) => setForm({ ...form, addons })} />

                <Button className="w-full" onClick={save}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {generatingAll && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Gerando imagens com IA... ({genProgress.current}/{genProgress.total})</p>
            <p className="text-xs text-muted-foreground truncate">Processando: {genProgress.name}</p>
            <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Button size="sm" variant={catFilter === "all" ? "default" : "outline"} onClick={() => setCatFilter("all")} className="shrink-0">Todos</Button>
        {categories.map((c) => (
          <Button key={c.id} size="sm" variant={catFilter === c.id ? "default" : "outline"} onClick={() => setCatFilter(c.id)} className="shrink-0">{c.icon} {c.name}</Button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((p) => (
          <Card key={p.id} className={`overflow-hidden ${!p.active ? "opacity-50" : ""}`}>
            <div className="h-36 bg-muted overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <button
                  onClick={() => generateSingleImage(p)}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-muted/80 transition-colors"
                >
                  <Wand2 className="h-8 w-8 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground/60">Gerar com IA</span>
                </button>
              )}
            </div>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{p.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                </div>
                {p.category_id && <Badge variant="secondary" className="text-xs">{getCatName(p.category_id)}</Badge>}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">R$ {Number(p.price).toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteProd(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum produto encontrado. Clique em "Novo" para adicionar.</div>}
      </div>
    </div>
  );
};

export default PBProducts;
