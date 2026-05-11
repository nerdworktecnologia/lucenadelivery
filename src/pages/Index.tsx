import { motion } from "framer-motion";
import {
  FileText,
  Zap,
  Shield,
  BarChart3,
  Check,
  ArrowRight,
  Clock,
  Building2,
  Receipt,
  Star,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              LucenaDelivery
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#recursos" className="hover:text-primary transition-colors">Recursos</a>
            <a href="#precos" className="hover:text-primary transition-colors">Preços</a>
            <a href="#depoimentos" className="hover:text-primary transition-colors">Depoimentos</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              Entrar
            </Button>
            <Button size="sm">
              Começar Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6"
            >
              <Zap className="h-3.5 w-3.5" />
              Pronto para a Reforma Tributária
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] mb-6"
            >
              Emitir nota fiscal nunca foi tão{" "}
              <span className="text-primary">fácil</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto"
            >
              Sistema completo, rápido e pronto para a Reforma Tributária. 
              Pensado para quem precisa emitir notas fiscais sem complicação e com o melhor custo-benefício do mercado.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" className="text-base px-8 gap-2">
                Comece Hoje Mesmo <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8">
                Ver Demonstração
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              {["Sem mensalidade mínima", "Teste grátis por 7 dias", "Suporte humanizado"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-accent" />
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "50k+", label: "Notas emitidas" },
            { value: "2.000+", label: "Empresas ativas" },
            { value: "99,9%", label: "Uptime garantido" },
            { value: "< 3s", label: "Tempo de emissão" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3">Recursos</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Do MEI à grande empresa, nosso sistema se adapta ao seu negócio com funcionalidades completas e intuitivas.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Receipt, title: "NF-e, NFS-e e NFC-e", desc: "Emita todos os tipos de nota fiscal eletrônica em poucos cliques, com validação automática." },
              { icon: Zap, title: "Emissão em Segundos", desc: "Interface otimizada para emitir notas em menos de 3 segundos. Sem travamentos." },
              { icon: Shield, title: "100% Seguro", desc: "Certificado digital integrado, criptografia de ponta a ponta e backup automático diário." },
              { icon: BarChart3, title: "Relatórios Inteligentes", desc: "Dashboards completos com faturamento, impostos e análises fiscais em tempo real." },
              { icon: Building2, title: "Multi-empresa", desc: "Gerencie múltiplos CNPJs em uma única conta, com permissões por usuário." },
              { icon: Clock, title: "Reforma Tributária", desc: "Sistema já adaptado às novas regras da Reforma Tributária. Atualizações automáticas." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardContent className="p-7">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3">Passo a passo</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Em apenas 4 passos simples, você já estará emitindo notas fiscais.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-border" />
            {[
              { step: "01", title: "Crie sua Conta", desc: "Cadastre-se em menos de 2 minutos. Sem burocracia, sem cartão de crédito.", icon: "🚀" },
              { step: "02", title: "Configure seu CNPJ", desc: "Insira os dados da empresa e o certificado digital. Nosso sistema valida tudo automaticamente.", icon: "⚙️" },
              { step: "03", title: "Emita sua Nota", desc: "Preencha os dados do cliente e do serviço/produto. O sistema calcula impostos automaticamente.", icon: "📄" },
              { step: "04", title: "Envie e Gerencie", desc: "A nota é enviada por email ao cliente e fica salva no painel para consulta e relatórios.", icon: "✅" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border-4 border-background flex items-center justify-center mx-auto mb-5 relative z-10 text-2xl">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-primary tracking-widest uppercase mb-2">Passo {item.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3">Planos</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O melhor custo-benefício do mercado
            </h2>
            <p className="text-muted-foreground">Escolha o plano ideal para o seu negócio. Cancele quando quiser.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "49",
                desc: "Ideal para MEI e autônomos",
                features: ["Até 50 notas/mês", "NF-e e NFS-e", "1 CNPJ", "Suporte por email", "Relatórios básicos"],
                popular: false,
              },
              {
                name: "Profissional",
                price: "99",
                desc: "Para pequenas e médias empresas",
                features: ["Notas ilimitadas", "NF-e, NFS-e e NFC-e", "Até 3 CNPJs", "Suporte prioritário", "Relatórios avançados", "API de integração"],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "199",
                desc: "Para grandes operações",
                features: ["Notas ilimitadas", "Todos os tipos de NF", "CNPJs ilimitados", "Suporte 24/7 dedicado", "Relatórios personalizados", "API completa", "SLA 99,99%"],
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <Card className={`h-full relative overflow-hidden ${plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border/50"}`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-xs font-semibold text-center py-1.5">
                      Mais Popular
                    </div>
                  )}
                  <CardContent className={`p-8 ${plan.popular ? "pt-12" : ""}`}>
                    <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-5">{plan.desc}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R${plan.price}</span>
                      <span className="text-muted-foreground text-sm">/mês</span>
                    </div>
                    <Button className="w-full mb-6" variant={plan.popular ? "default" : "outline"}>
                      Começar Agora
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-accent flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3">Depoimentos</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Quem usa, recomenda
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Roberto Almeida", role: "Contador", text: "Gerencio mais de 80 empresas pelo LucenaDelivery. A emissão em lote economiza horas do meu dia.", stars: 5 },
              { name: "Juliana Mendes", role: "MEI - Consultoria", text: "Finalmente um sistema simples e barato. Emito minhas notas em segundos, sem precisar de contador.", stars: 5 },
              { name: "André Costa", role: "Diretor Financeiro", text: "A integração via API com nosso ERP foi perfeita. Suporte excelente e sistema muito estável.", stars: 5 },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <Card className="h-full border-border/50">
                  <CardContent className="p-7">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
                    <div>
                      <p className="font-semibold text-foreground">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary font-medium tracking-widest uppercase text-sm mb-3">Dúvidas</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Perguntas Frequentes
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {[
                { q: "Preciso de certificado digital?", a: "Sim, para emitir NF-e e NFC-e é necessário certificado digital A1 ou A3. Para NFS-e, depende do município. Nosso sistema aceita todos os tipos de certificado." },
                { q: "O sistema está preparado para a Reforma Tributária?", a: "Sim! Nosso sistema é atualizado automaticamente conforme as novas regras são publicadas. Você não precisa se preocupar com mudanças na legislação." },
                { q: "Posso testar antes de assinar?", a: "Claro! Oferecemos 7 dias de teste grátis com todas as funcionalidades do plano Profissional, sem precisar de cartão de crédito." },
                { q: "Como funciona o suporte?", a: "Oferecemos suporte por email, chat e WhatsApp. No plano Enterprise, o suporte é 24/7 com gerente de conta dedicado." },
                { q: "Posso migrar de outro sistema?", a: "Sim! Nossa equipe ajuda na migração completa dos seus dados, incluindo cadastro de clientes, produtos e histórico de notas." },
                { q: "Emite nota para qualquer estado?", a: "Sim, nosso sistema é homologado para emissão de NF-e em todos os estados do Brasil e NFS-e nos principais municípios." },
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-background rounded-xl border border-border/50 px-6">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center bg-primary rounded-3xl p-12 md:p-16 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Comece a emitir notas hoje mesmo
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              7 dias grátis, sem compromisso. Configure em menos de 5 minutos e emita sua primeira nota.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-base px-10 gap-2">
                Criar Conta Grátis <ChevronRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="ghost" className="text-base px-8 text-primary-foreground hover:text-primary-foreground hover:bg-white/10">
                Falar com Vendas
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer className="border-t border-border" />
    </div>
  );
};

export default Index;
