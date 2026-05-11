import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, GripVertical, Loader2, Upload, ImageIcon } from "lucide-react";
import { EmojiPicker } from "@/components/EmojiPicker";
import { toast } from "sonner";

interface DbCategory { id: string; name: string; icon: string; image: string; sort_order: number; }

const PBCategories = () => {
  const { user } = useAuth();
  const [cats, setCats] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState<DbCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "", image: "" });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCats = async () => {
    if (!user) return;
    const { data } = await supabase.from("categories").select("*").eq("user_id", user.id).order("sort_order");
    setCats(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, [user]);

  const openNew = () => {
    setEditCat(null);
    setForm({ name: "", icon: "🍽️", image: "" });
    setImagePreview(null);
    setOpen(true);
  };

  const openEdit = (c: DbCategory) => {
    setEditCat(c);
    setForm({ name: c.name, icon: c.icon, image: c.image || "" });
    setImagePreview(c.image || null);
    setOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione um arquivo de imagem"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/cat-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("product-images").upload(fileName, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar imagem"); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm((f) => ({ ...f, image: urlData.publicUrl }));
    setImagePreview(urlData.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada! ✅");
  };

  const save = async () => {
    if (!user || !form.name) { toast.error("Preencha o nome"); return; }
    const payload = { name: form.name, icon: form.icon, image: form.image || "" };
    if (editCat) {
      await supabase.from("categories").update(payload).eq("id", editCat.id);
      toast.success("Categoria atualizada!");
    } else {
      await supabase.from("categories").insert({ ...payload, user_id: user.id, sort_order: cats.length + 1 });
      toast.success("Categoria criada!");
    }
    setOpen(false);
    fetchCats();
  };

  const deleteCat = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    toast.success("Categoria removida");
    fetchCats();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <p className="text-sm text-muted-foreground">{cats.length} categorias</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editCat ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Emoji/Ícone</Label><EmojiPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} /></div>
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>

              {/* Image section */}
              <div className="space-y-2">
                <Label>Imagem da Categoria</Label>
                {imagePreview && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border bg-muted">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><Upload className="h-4 w-4" /> Enviar foto</>}
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">ou cole a URL</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <Input placeholder="https://..." value={form.image} onChange={(e) => { setForm({ ...form, image: e.target.value }); setImagePreview(e.target.value || null); }} />
              </div>

              <Button className="w-full" onClick={save}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cats.sort((a, b) => a.sort_order - b.sort_order).map((cat) => (
          <Card key={cat.id} className="overflow-hidden">
            {cat.image && (
              <div className="h-28 bg-muted overflow-hidden">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-semibold text-foreground">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(cat)}><Edit2 className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => deleteCat(cat.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {cats.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhuma categoria. Clique em "Nova" para adicionar.</div>}
      </div>
    </div>
  );
};

export default PBCategories;
