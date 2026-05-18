import { useState, useEffect } from "react";
import { Download, Share, MoreVertical, Plus, Smartphone, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (isStandalone || installed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">App instalado!</h1>
        <p className="text-muted-foreground mb-8">O BrandDelivery já está na sua tela inicial.</p>
        <Link to="/">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold text-foreground">Instalar App</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        {/* App Icon */}
        <div className="mb-8 text-center">
          <img src="/pwa-icon-192.png" alt="BrandDelivery" className="w-24 h-24 rounded-[22px] shadow-xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground">BrandDelivery</h2>
          <p className="text-sm text-muted-foreground mt-1">Comanda, gerencia, entrega</p>
        </div>

        {/* Install button (Android/Desktop) */}
        {deferredPrompt && (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2 mb-8 text-base h-14 rounded-xl shadow-lg shadow-primary/20">
            <Download className="h-5 w-5" />
            Instalar agora
          </Button>
        )}

        {/* iOS Instructions */}
        {isIOS && (
          <div className="w-full space-y-4 mb-8">
            <p className="text-sm font-medium text-foreground text-center">Para instalar no iPhone/iPad:</p>
            <div className="space-y-3">
              <Step number={1} icon={<Share className="h-5 w-5" />} text='Toque no botão "Compartilhar"' subtext="(ícone de compartilhar na barra do Safari)" />
              <Step number={2} icon={<Plus className="h-5 w-5" />} text='Toque em "Adicionar à Tela Inicial"' subtext="Role para baixo se não aparecer" />
              <Step number={3} icon={<CheckCircle2 className="h-5 w-5" />} text='Toque em "Adicionar"' subtext="O app aparecerá na sua tela inicial" />
            </div>
          </div>
        )}

        {/* Android fallback (no prompt captured) */}
        {!isIOS && !deferredPrompt && (
          <div className="w-full space-y-4 mb-8">
            <p className="text-sm font-medium text-foreground text-center">Para instalar no Android:</p>
            <div className="space-y-3">
              <Step number={1} icon={<MoreVertical className="h-5 w-5" />} text="Abra o menu do navegador" subtext="(três pontinhos no canto superior)" />
              <Step number={2} icon={<Smartphone className="h-5 w-5" />} text='Toque em "Instalar app"' subtext='Ou "Adicionar à tela inicial"' />
              <Step number={3} icon={<CheckCircle2 className="h-5 w-5" />} text="Confirme a instalação" subtext="O app aparecerá na sua tela inicial" />
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="w-full rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vantagens do app</p>
          <ul className="space-y-2 text-sm text-foreground">
            {["Acesso rápido pela tela inicial", "Funciona offline", "Notificações de novos pedidos", "Tela cheia, sem barra do navegador"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Step({ number, icon, text, subtext }: { number: number; icon: React.ReactNode; text: string; subtext: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{text}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </div>
      <div className="text-muted-foreground">{icon}</div>
    </div>
  );
}
