import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, ShoppingCart, Utensils, BarChart3, MessageCircle, Bell,
  ArrowRight, ArrowLeft, Zap, Check, ChevronRight, Play, X
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Cardápio Digital",
    subtitle: "Seus clientes pedem pelo celular",
    icon: Smartphone,
    emoji: "📱",
    description: "Crie seu cardápio online em minutos. Compartilhe o link ou QR Code e receba pedidos sem precisar de app.",
    features: ["Link compartilhável", "QR Code para mesas", "Fotos e descrições", "Adicionais personalizáveis"],
    mockup: (
      <div className="bg-card rounded-2xl border border-border p-4 shadow-lg max-w-xs mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">Restaurante Demo</span>
        </div>
        <div className="space-y-2">
          {["🍔 Hambúrguer Clássico — R$ 28,90", "🍕 Pizza Margherita — R$ 42,00", "🥗 Salada Caesar — R$ 22,50"].map((item, i) => (
            <div key={i} className="p-3 rounded-xl bg-secondary/50 text-xs font-medium">{item}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Gestão de Pedidos",
    subtitle: "Tudo em tempo real no painel",
    icon: ShoppingCart,
    emoji: "📦",
    description: "Pedidos chegam instantaneamente no seu painel. Aceite, prepare e entregue com total controle.",
    features: ["Notificações sonoras", "Status em tempo real", "Filtro por canal", "Histórico completo"],
    mockup: (
      <div className="bg-card rounded-2xl border border-border p-4 shadow-lg max-w-sm mx-auto space-y-2">
        {[
          { status: "🟢 Novo", name: "Maria S.", total: "R$ 45,90" },
          { status: "🟡 Preparando", name: "João P.", total: "R$ 32,00" },
          { status: "🔵 Entregando", name: "Ana C.", total: "R$ 78,50" },
        ].map((o, i) => (
          <div key={i} className="p-3 rounded-xl bg-secondary/50 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium">{o.status}</span>
              <p className="text-sm font-semibold">{o.name}</p>
            </div>
            <span className="text-sm font-bold text-primary">{o.total}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 3,
    title: "Painel da Cozinha",
    subtitle: "Sem papel, sem confusão",
    icon: Utensils,
    emoji: "👨‍🍳",
    description: "Pedidos aparecem automaticamente na tela da cozinha. Marque como pronto com um toque.",
    features: ["Tela dedicada", "Timer por pedido", "Organização por prioridade", "Som de alerta"],
    mockup: (
      <div className="bg-card rounded-2xl border border-border p-4 shadow-lg max-w-sm mx-auto">
        <div className="grid grid-cols-2 gap-2">
          {[
            { num: "#047", items: "2x Hambúrguer, 1x Batata", time: "5 min", color: "border-primary" },
            { num: "#048", items: "1x Pizza Grande", time: "12 min", color: "border-accent" },
            { num: "#049", items: "3x Porção Frango", time: "2 min", color: "border-destructive" },
            { num: "#050", items: "1x Salada, 2x Suco", time: "8 min", color: "border-primary" },
          ].map((t, i) => (
            <div key={i} className={`p-3 rounded-xl bg-secondary/50 border-l-4 ${t.color}`}>
              <p className="text-xs font-bold">{t.num}</p>
              <p className="text-[10px] text-muted-foreground">{t.items}</p>
              <p className="text-[10px] text-primary mt-1">⏱ {t.time}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "WhatsApp Bot",
    subtitle: "Atendimento 24h automático",
    icon: MessageCircle,
    emoji: "🤖",
    description: "Nosso bot responde seus clientes, envia o cardápio e registra pedidos automaticamente pelo WhatsApp.",
    features: ["Respostas automáticas", "Envio de cardápio", "Registro de pedidos", "Mensagens personalizadas"],
    mockup: (
      <div className="bg-card rounded-2xl border border-border p-4 shadow-lg max-w-xs mx-auto space-y-2">
        {[
          { from: "client", msg: "Oi, quero fazer um pedido!" },
          { from: "bot", msg: "Olá! 😊 Seja bem-vindo! Veja nosso cardápio: comandafacil.app/demo" },
          { from: "client", msg: "Quero 2 hambúrgueres" },
          { from: "bot", msg: "✅ Pedido registrado! Total: R$ 57,80. Tempo estimado: 30 min" },
        ].map((m, i) => (
          <div key={i} className={`p-2.5 rounded-xl text-xs max-w-[80%] ${m.from === "bot" ? "bg-primary/10 ml-0" : "bg-secondary/70 ml-auto"}`}>
            {m.msg}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 5,
    title: "Relatórios",
    subtitle: "Dados para crescer",
    icon: BarChart3,
    emoji: "📊",
    description: "Saiba o que mais vende, horários de pico, ticket médio e faturamento diário. Tudo em gráficos simples.",
    features: ["Faturamento diário", "Produtos mais vendidos", "Horários de pico", "Comparativo mensal"],
    mockup: (
      <div className="bg-card rounded-2xl border border-border p-4 shadow-lg max-w-sm mx-auto">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "Hoje", value: "R$ 1.890" },
            { label: "Ticket Médio", value: "R$ 42,50" },
            { label: "Pedidos", value: "47" },
            { label: "Novos Clientes", value: "8" },
          ].map((s, i) => (
            <div key={i} className="p-2 rounded-lg bg-secondary/50 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-bold text-primary">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="h-16 flex items-end gap-1">
          {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
            <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
];

export default function DemoTour() {
  const [current, setCurrent] = useState(0);
  const step = steps[current];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold font-['Space_Grotesk']">LucenaDelivery</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Tour Interativo</Badge>
            <Link to="/signup">
              <Button size="sm" className="rounded-full px-5">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= current ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Passo {current + 1} de {steps.length}</p>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left - Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{step.emoji}</span>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']">{step.title}</h1>
                    <p className="text-sm text-muted-foreground">{step.subtitle}</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">{step.description}</p>
                <div className="space-y-2 mb-8">
                  {step.features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{f}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right - Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {step.mockup}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>

          {current < steps.length - 1 ? (
            <Button onClick={() => setCurrent(current + 1)} className="rounded-full">
              Próximo <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Link to="/signup">
              <Button className="rounded-full px-8 shadow-lg shadow-primary/25">
                Começar agora — é grátis 🚀
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
