import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ShoppingCart, MessageCircle, BarChart3, Clock, Smartphone, Zap,
  Check, ChevronDown, ChevronUp, Star, Users, TrendingUp,
  Utensils, Bell, CreditCard, ArrowRight, Play, Shield, Headphones,
  Download, X, Sun, Moon
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, type: "spring" as const, stiffness: 120 } },
};

// Floating particles for hero
function FloatingParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    emoji: ["🍕", "🍔", "☕", "🍣", "🧁", "🥩", "🍷", "🌮", "🍜", "🥗", "🍰", "🫐"][i],
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 5,
    size: 16 + Math.random() * 14,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute select-none opacity-20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 20, 0],
            rotate: [0, 10, -10, 5, 0],
            opacity: [0.15, 0.3, 0.15, 0.25, 0.15],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// Scroll indicator
function ScrollIndicator() {
  return (
    <motion.div
      className="flex flex-col items-center gap-1 mt-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
    >
      <span className="text-xs text-muted-foreground">Role para baixo</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      </motion.div>
    </motion.div>
  );
}

function useCountUp(target: number, duration = 1500, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started, startOnView]);

  useEffect(() => {
    if (!started) return;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(interval); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, target, duration]);

  return { count, ref };
}

function CountUpStat({ label, numValue, prefix, suffix, icon, trend, decimals = 0 }: {
  label: string; numValue: number; prefix?: string; suffix?: string; icon: string; trend: string; decimals?: number;
}) {
  const targetInt = decimals > 0 ? Math.round(numValue * Math.pow(10, decimals)) : numValue;
  const { count, ref } = useCountUp(targetInt);
  const display = decimals > 0
    ? (count / Math.pow(10, decimals)).toFixed(decimals).replace(".", ",")
    : count.toLocaleString("pt-BR");
  return (
    <div ref={ref} className="bg-card rounded-xl p-4 border border-border">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xl font-bold font-['Space_Grotesk'] text-primary">
        {prefix}{display}{suffix}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {trend && <p className="text-[10px] text-primary font-semibold mt-1">{trend}</p>}
    </div>
  );
}

const features = [
  { icon: Smartphone, title: "Cardápio Digital", desc: "Link compartilhável com QR Code. Seus clientes pedem direto do celular, sem app.", metric: "3x mais pedidos", tag: "Mais usado" },
  { icon: MessageCircle, title: "WhatsApp Bot", desc: "Receba e gerencie pedidos automaticamente pelo WhatsApp, 24h por dia.", metric: "80% menos tempo", tag: "Automação" },
  { icon: ShoppingCart, title: "PDV Completo", desc: "Registre vendas no balcão com agilidade. Simples e rápido como deve ser.", metric: "2x mais rápido", tag: "Vendas" },
  { icon: Utensils, title: "Painel da Cozinha", desc: "Pedidos aparecem em tempo real na cozinha. Sem papel, sem confusão.", metric: "Zero pedidos perdidos", tag: "Operação" },
  { icon: BarChart3, title: "Relatórios Inteligentes", desc: "Saiba o que mais vende, horários de pico e faturamento diário.", metric: "+25% faturamento", tag: "Insights" },
  { icon: Bell, title: "Notificações Instantâneas", desc: "Alertas sonoros e push a cada novo pedido. Nunca perca uma venda.", metric: "Tempo real", tag: "Alertas" },
];

const testimonials = [
  { name: "Ana Clara", role: "Dona da Doce Vida Confeitaria", text: "Triplicamos nossos pedidos no primeiro mês! O WhatsApp Bot é mágico. 🎂", rating: 5, avatar: "🧁", metric: "+200% pedidos" },
  { name: "Carlos Eduardo", role: "Gerente do Sabor & Grill", text: "A cozinha parou de reclamar de pedidos perdidos. O painel em tempo real mudou tudo!", rating: 5, avatar: "🍖", metric: "Zero erros" },
  { name: "Mariana Santos", role: "Proprietária do Café Aroma", text: "Super fácil de usar. Em 10 minutos já estava recebendo pedidos pelo cardápio digital.", rating: 5, avatar: "☕", metric: "Setup em 10min" },
  { name: "Roberto Lima", role: "Dono da Pizzaria Napoli", text: "O PDV é rápido demais! Atendemos o dobro de clientes no balcão agora.", rating: 5, avatar: "🍕", metric: "2x atendimento" },
  { name: "Fernanda Oliveira", role: "Chef do Bistrô La Table", text: "Os relatórios me ajudaram a entender o que realmente vende. Cortei custos em 30%!", rating: 5, avatar: "🍷", metric: "-30% custos" },
  { name: "Lucas Mendes", role: "Dono do Açaí Tropical", text: "Meus clientes adoram pedir pelo cardápio digital. As avaliações subiram demais!", rating: 5, avatar: "🫐", metric: "4.9⭐ avaliação" },
];

const faqs = [
  { q: "Preciso instalar algum aplicativo?", a: "Não! O BrandDelivery funciona 100% no navegador. Seus clientes também não precisam baixar nada para fazer pedidos." },
  { q: "Como funciona o bot do WhatsApp?", a: "Nosso bot responde automaticamente as mensagens dos clientes, envia o cardápio e registra os pedidos no seu painel. Tudo sem você precisar digitar." },
  { q: "Posso testar antes de assinar?", a: "Sim! Oferecemos 7 dias grátis em qualquer plano, sem compromisso e sem cartão de crédito." },
  { q: "Funciona para qualquer tipo de restaurante?", a: "Sim! Restaurantes, lanchonetes, pizzarias, confeitarias, cafés, food trucks e qualquer negócio de alimentação." },
  { q: "Meus dados ficam seguros?", a: "Totalmente! Usamos criptografia de ponta e servidores seguros. Seus dados e os dos seus clientes estão protegidos." },
  { q: "Consigo cancelar a qualquer momento?", a: "Sim, sem multa e sem burocracia. Você pode cancelar direto pelo painel." },
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [theme, setThemeState] = useState(() => localStorage.getItem("theme") || "light");
  const setTheme = (t: string) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl font-['Space_Grotesk']">BrandDelivery</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="rounded-full px-5">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 10, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{ x: [0, -25, 15, 0], y: [0, 15, -25, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <FloatingParticles />
        <div className="max-w-6xl mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div custom={0} variants={fadeUp}>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium rounded-full">
                🚀 7 dias grátis • Sem cartão de crédito
              </Badge>
            </motion.div>
            <motion.h1
              custom={1}
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-['Space_Grotesk'] leading-tight tracking-tight"
            >
              Seu restaurante no{" "}
              <span className="text-primary relative">
                piloto automático
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8C50 2 150 2 298 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              {" "}🍽️
            </motion.h1>
            <motion.p custom={2} variants={fadeUp} className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Cardápio digital, pedidos por WhatsApp, PDV, cozinha em tempo real e muito mais.
              <strong className="text-foreground"> Tudo num só lugar.</strong>
            </motion.p>
            <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="rounded-full px-8 text-base h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Comece agora — é grátis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12">
                  <Play className="mr-2 h-4 w-4" /> Ver como funciona
                </Button>
              </Link>
            </motion.div>
            <motion.div custom={4} variants={fadeUp} className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> +2.000 restaurantes</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-primary" /> +500k pedidos/mês</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary fill-primary" /> 4.9/5 avaliação</span>
            </motion.div>
          </motion.div>

          {/* Hero Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
              <div className="h-8 bg-secondary/50 flex items-center gap-1.5 px-4">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                <span className="ml-3 text-[11px] text-muted-foreground font-mono">comandafacil.app/admin</span>
              </div>
              <div className="p-6 md:p-8 bg-gradient-to-br from-secondary/20 to-transparent">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <CountUpStat label="Pedidos Hoje" numValue={47} icon="📦" trend="+12%" />
                  <CountUpStat label="Faturamento" numValue={3240} prefix="R$ " icon="💰" trend="+8%" />
                  <CountUpStat label="Novos Clientes" numValue={12} icon="👥" trend="+5%" />
                  <CountUpStat label="Avaliação" numValue={4.9} decimals={1} suffix=" ⭐" icon="🌟" trend="" />
                </div>
              </div>
            </div>
          </motion.div>
          <ScrollIndicator />
        </div>
      </section>

      {/* Logos de Parceiros */}
      <section className="py-14 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground mb-8 font-medium"
          >
            Usado por mais de <span className="text-primary font-bold">2.000 restaurantes</span> em todo o Brasil
          </motion.p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { emoji: "🍕", name: "Pizzaria Napoli" },
              { emoji: "🍔", name: "Burger Station" },
              { emoji: "☕", name: "Café Aroma" },
              { emoji: "🍣", name: "Sushi House" },
              { emoji: "🧁", name: "Doce Vida" },
              { emoji: "🥩", name: "Sabor & Grill" },
            ].map((partner, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border/50"
              >
                <span className="text-2xl">{partner.emoji}</span>
                <span className="text-sm font-semibold text-muted-foreground font-['Space_Grotesk']">{partner.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl md:text-4xl font-bold font-['Space_Grotesk']">
              Tudo que você precisa, <span className="text-primary">nada que não precisa</span> ✨
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Ferramentas simples e poderosas para transformar seu restaurante
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5, type: "spring", stiffness: 120 }}
                whileHover={{ y: -8, scale: 1.03 }}
              >
                <Card className="h-full hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-border/50 group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-500" />
                   <CardContent className="p-6 relative">
                     <div className="flex items-center justify-between mb-4">
                       <motion.div
                         className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300"
                         whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                       >
                         <f.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                       </motion.div>
                       <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-full">{f.tag}</Badge>
                     </div>
                     <h3 className="font-bold text-lg font-['Space_Grotesk'] mb-2 group-hover:text-primary transition-colors duration-300">{f.title}</h3>
                     <p className="text-sm text-muted-foreground leading-relaxed mb-3">{f.desc}</p>
                     <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                       <TrendingUp className="h-3.5 w-3.5" />
                       {f.metric}
                     </div>
                   </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Antes vs Depois */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl md:text-4xl font-bold font-['Space_Grotesk']">
              Antes vs <span className="text-primary">Depois</span> do BrandDelivery 🔄
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Veja a transformação real de quem adotou nossa plataforma
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* ANTES */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-destructive/30 bg-destructive/5 overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <X className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg font-['Space_Grotesk'] text-destructive">Antes</h3>
                      <p className="text-xs text-muted-foreground">Sem BrandDelivery</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {[
                      { emoji: "📝", text: "Anotando pedidos no papel", detail: "Erros constantes e pedidos perdidos" },
                      { emoji: "📞", text: "Telefone tocando sem parar", detail: "Clientes desistindo na linha" },
                      { emoji: "😰", text: "Cozinha confusa e atrasada", detail: "Sem controle da fila de preparo" },
                      { emoji: "📊", text: "Zero controle financeiro", detail: "Não sabe o que mais vende" },
                      { emoji: "⏰", text: "Fechamento demorado", detail: "Horas contando comandas no final do dia" },
                      { emoji: "😤", text: "Clientes insatisfeitos", detail: "Pedidos errados e demora no atendimento" },
                    ].map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                        className="flex gap-3 items-start"
                      >
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div>
                          <p className="font-medium text-sm text-foreground">{item.text}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
            {/* DEPOIS */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-primary/30 bg-primary/5 overflow-hidden relative">
                <div className="absolute top-3 right-3">
                  <Badge className="rounded-full px-3 py-1 text-xs font-bold">✨ Recomendado</Badge>
                </div>
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg font-['Space_Grotesk'] text-primary">Depois</h3>
                      <p className="text-xs text-muted-foreground">Com BrandDelivery</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {[
                      { emoji: "📱", text: "Pedidos digitais automáticos", detail: "Zero erros, tudo registrado" },
                      { emoji: "🤖", text: "WhatsApp Bot 24h", detail: "Clientes pedem a qualquer hora" },
                      { emoji: "🍳", text: "Cozinha organizada em tempo real", detail: "Fila de preparo clara e eficiente" },
                      { emoji: "📈", text: "Relatórios completos", detail: "Saiba exatamente o que vende mais" },
                      { emoji: "⚡", text: "Fechamento instantâneo", detail: "Tudo calculado automaticamente" },
                      { emoji: "😍", text: "Clientes satisfeitos", detail: "Atendimento rápido e sem erros" },
                    ].map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                        className="flex gap-3 items-start"
                      >
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div>
                          <p className="font-medium text-sm text-foreground">{item.text}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          {/* Resultado */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 max-w-4xl mx-auto"
          >
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  {[
                    { value: "+200%", label: "Mais pedidos", emoji: "🚀" },
                    { value: "-80%", label: "Menos erros", emoji: "✅" },
                    { value: "3x", label: "Mais rápido", emoji: "⚡" },
                    { value: "+45%", label: "Mais lucro", emoji: "💰" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p className="text-2xl mb-1">{stat.emoji}</p>
                      <p className="text-2xl md:text-3xl font-extrabold font-['Space_Grotesk'] text-primary">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.h2 custom={0} variants={fadeUp} className="text-3xl md:text-4xl font-bold font-['Space_Grotesk']">
                Veja como é <span className="text-primary">simples</span> 🎯
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="mt-4 text-muted-foreground leading-relaxed">
                Em 3 passos você já está recebendo pedidos. Sem complicação, sem treinamento.
              </motion.p>
              <div className="mt-8 space-y-6">
                {[
                  { step: "1", title: "Cadastre seus produtos", desc: "Adicione fotos, preços e descrições em minutos." },
                  { step: "2", title: "Compartilhe o cardápio", desc: "Envie o link ou QR Code para seus clientes." },
                  { step: "3", title: "Receba e gerencie pedidos", desc: "Tudo aparece no painel em tempo real. Simples assim!" },
                ].map((s, i) => (
                  <motion.div key={i} custom={i + 2} variants={fadeUp} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-['Space_Grotesk'] text-lg shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{s.title}</h4>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div custom={5} variants={fadeUp} className="mt-8">
                <Link to="/signup">
                  <Button className="rounded-full px-6" size="lg">
                    Começar grátis <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
                <div className="relative bg-card border border-border rounded-2xl p-6 shadow-xl overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div className="space-y-3 relative" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    {[
                      { status: "🟢 Novo", customer: "Maria Silva", items: "2x Hambúrguer, 1x Refri", total: "R$ 45,90", time: "agora" },
                      { status: "🟡 Preparando", customer: "João Santos", items: "1x Pizza Grande", total: "R$ 52,00", time: "5 min" },
                      { status: "🔵 Saiu para entrega", customer: "Ana Costa", items: "3x Porção, 2x Suco", total: "R$ 78,50", time: "12 min" },
                    ].map((order, i) => (
                      <motion.div key={i} variants={staggerItem} className="p-4 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary/80 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{order.status}</span>
                          <span className="text-xs text-muted-foreground">{order.time}</span>
                        </div>
                        <p className="font-semibold text-sm">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">{order.items}</p>
                        <p className="text-sm font-bold text-primary mt-1">{order.total}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl md:text-4xl font-bold font-['Space_Grotesk']">
              Quem usa, <span className="text-primary">recomenda</span> 💬
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Veja como o BrandDelivery está transformando restaurantes por todo o Brasil
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, rotateX: 15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, type: "spring", stiffness: 100 }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Card className="h-full border-border/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <motion.div
                        className="text-3xl"
                        whileHover={{ scale: 1.3, rotate: [0, -15, 15, 0] }}
                        transition={{ duration: 0.4 }}
                      >
                        {t.avatar}
                      </motion.div>
                      <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full text-primary">
                        {t.metric}
                      </Badge>
                    </div>
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 + j * 0.06, type: "spring", stiffness: 200 }}
                        >
                          <Star className="h-4 w-4 text-primary fill-primary" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-secondary/30">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl md:text-4xl font-bold font-['Space_Grotesk']">
              Perguntas frequentes 🤔
            </motion.h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <Card
                  className="border-border/50 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-300"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm pr-4">{faq.q}</h4>
                      <motion.div
                        animate={{ rotate: openFaq === i ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="mt-3 text-sm text-muted-foreground leading-relaxed overflow-hidden"
                        >
                          {faq.a}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10" />
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 custom={0} variants={fadeUp} className="text-3xl md:text-5xl font-extrabold font-['Space_Grotesk']">
              Pronto para <span className="text-primary">simplificar</span> seu restaurante? 🚀
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
              Junte-se a mais de 2.000 restaurantes que já usam o BrandDelivery
            </motion.p>
            <motion.div custom={2} variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button size="lg" className="rounded-full px-10 text-base h-13 shadow-lg shadow-primary/25 relative overflow-hidden group">
                    <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    Criar conta grátis <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            <motion.div custom={3} variants={fadeUp} className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Sem cartão</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Setup em 5 min</span>
              <span className="flex items-center gap-1"><Headphones className="h-3 w-3" /> Suporte incluso</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
      {/* Floating Install Banner */}
      <InstallBanner />
    </div>
  );
};

function InstallBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  if (dismissed || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ delay: 3, duration: 0.4 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl">
          <img src="/pwa-icon-192.png" alt="BrandDelivery" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Instale o BrandDelivery</p>
            <p className="text-xs text-muted-foreground truncate">Acesso rápido direto do celular</p>
          </div>
          <Link to="/install">
            <Button size="sm" className="gap-1.5 rounded-xl">
              <Download className="h-4 w-4" />
              Instalar
            </Button>
          </Link>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default LandingPage;
