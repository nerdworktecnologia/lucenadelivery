import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, ExternalLink, Store, Clock, Link2, Palette, MessageCircle, Zap, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const PBSettings = () => {
  const { settings, loading, saveSettings, setSettings } = useStoreSettings();

  const menuUrl = window.location.origin + "/cardapio";
  const save = async () => {
    const ok = await saveSettings(settings);
    if (ok) toast.success("Configurações salvas com sucesso! ✅");
    else toast.error("Erro ao salvar configurações");
  };
  const copyLink = () => { navigator.clipboard.writeText(menuUrl); toast.success("Link copiado!"); };

  if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">⚙️ Configurações</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Gerencie as configurações da sua loja</p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base"><Store className="h-4 w-4 text-primary" /> Dados da Loja</h3>
          <div><Label>Nome da Loja</Label><Input value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label>Taxa Entrega (R$)</Label><Input type="number" value={settings.delivery_fee} onChange={(e) => setSettings({ ...settings, delivery_fee: Number(e.target.value) })} /></div>
            <div><Label>Pedido Mínimo (R$)</Label><Input type="number" value={settings.min_order} onChange={(e) => setSettings({ ...settings, min_order: Number(e.target.value) })} /></div>
            <div><Label>Preparo (min)</Label><Input type="number" value={settings.prep_time} onChange={(e) => setSettings({ ...settings, prep_time: Number(e.target.value) })} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base"><Clock className="h-4 w-4 text-primary" /> Horário de Funcionamento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Abertura</Label><Input type="time" value={settings.open_time} onChange={(e) => setSettings({ ...settings, open_time: e.target.value })} /></div>
            <div><Label>Fechamento</Label><Input type="time" value={settings.close_time} onChange={(e) => setSettings({ ...settings, close_time: e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base"><Link2 className="h-4 w-4 text-primary" /> Cardápio Digital</h3>
          <div className="flex gap-2">
            <Input value={menuUrl} readOnly className="bg-secondary/50 font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => window.open(menuUrl, "_blank")}><ExternalLink className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center justify-center p-4 sm:p-8 border-2 border-dashed border-border rounded-2xl bg-secondary/20">
            <div className="text-center">
              <QRCodeSVG value={menuUrl} size={112} bgColor="transparent" fgColor="currentColor" className="mx-auto text-foreground/80 mb-3" />
              <p className="text-sm font-medium text-foreground">QR Code do Cardápio</p>
              <p className="text-xs text-muted-foreground">Imprima e coloque nas mesas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base"><Palette className="h-4 w-4 text-primary" /> Aparência</h3>
          <div className="flex items-center gap-3">
            <Label>Cor Principal</Label>
            <input type="color" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
            <span className="text-sm text-muted-foreground font-mono">{settings.primary_color}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base"><MessageCircle className="h-4 w-4 text-primary" /> WhatsApp</h3>
          <div>
            <Label>Número do WhatsApp (com DDD e código do país)</Label>
            <Input placeholder="5521999999999" value={settings.whatsapp_number} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value.replace(/\D/g, "") })} className="font-mono" />
            <p className="text-xs text-muted-foreground mt-1">Ex: 5521990735286 (usado no QR Code e link do bot)</p>
          </div>
          <div>
            <Label>Mensagem automática</Label>
            <Textarea value={settings.whatsapp_msg} onChange={(e) => setSettings({ ...settings, whatsapp_msg: e.target.value })} rows={5} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground mt-1">Use {'{loja}'} para o nome da loja e {'{link}'} para o link do cardápio</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base"><Zap className="h-4 w-4 text-primary" /> Automação</h3>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <div>
              <p className="font-medium text-foreground">Aceitar pedidos automaticamente</p>
              <p className="text-xs text-muted-foreground">Pedidos confirmados sem aprovação manual</p>
            </div>
            <Switch checked={settings.auto_accept} onCheckedChange={(v) => setSettings({ ...settings, auto_accept: v })} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <div>
              <p className="font-medium text-foreground">Imprimir comanda de cozinha</p>
              <p className="text-xs text-muted-foreground">Imprime automaticamente ao mudar para "Em Preparo"</p>
            </div>
            <Switch checked={settings.auto_print_kitchen} onCheckedChange={(v) => setSettings({ ...settings, auto_print_kitchen: v })} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <div>
              <p className="font-medium text-foreground">Imprimir comanda de entrega</p>
              <p className="text-xs text-muted-foreground">Imprime automaticamente ao mudar para "Saiu p/ Entrega"</p>
            </div>
            <Switch checked={settings.auto_print_delivery} onCheckedChange={(v) => setSettings({ ...settings, auto_print_delivery: v })} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <div>
              <p className="font-medium text-foreground">Aviso sonoro</p>
              <p className="text-xs text-muted-foreground">Toca um alerta sonoro quando chega um novo pedido</p>
            </div>
            <Switch checked={settings.sound_enabled} onCheckedChange={(v) => setSettings({ ...settings, sound_enabled: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base"><Printer className="h-4 w-4 text-primary" /> Impressão</h3>
          <div className="space-y-3">
            <div>
              <Label>Largura do Papel</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <Button 
                  variant={settings.print_width === "58mm" ? "default" : "outline"} 
                  onClick={() => setSettings({ ...settings, print_width: "58mm" })}
                  className="h-9 text-xs"
                >
                  58mm (Padrão)
                </Button>
                <Button 
                  variant={settings.print_width === "80mm" ? "default" : "outline"} 
                  onClick={() => setSettings({ ...settings, print_width: "80mm" })}
                  className="h-9 text-xs"
                >
                  80mm (Larga)
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div>
                <p className="font-medium text-foreground">Imprimir ao selecionar</p>
                <p className="text-xs text-muted-foreground">Abre a janela de impressão automaticamente ao clicar num pedido</p>
              </div>
              <Switch checked={settings.auto_print_on_selection} onCheckedChange={(v) => setSettings({ ...settings, auto_print_on_selection: v })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-12 text-base font-semibold rounded-xl" onClick={save}>💾 Salvar Configurações</Button>
    </div>
  );
};

export default PBSettings;
