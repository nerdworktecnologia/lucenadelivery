import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  // Removed setMockUser

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Demo login logic removed

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let errorMessage = "Ocorreu um erro ao tentar entrar.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email ou senha incorretos. Verifique suas credenciais e tente novamente.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Seu email ainda não foi confirmado. Verifique sua caixa de entrada.";
      } else if (error.message.includes("Database error querying schema")) {
        errorMessage = "Erro de conexão com o banco de dados. Tente novamente em instantes.";
      } else {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Erro ao entrar", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } else {
      // Session verification and redirection
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({ 
          title: "Sessão inválida", 
          description: "Não foi possível validar sua sessão. Tente logar novamente.", 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      const { data: roleData, error: roleError } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "super_admin",
      });

      let isSuperAdmin = !!roleData;

      if (roleError) {
        const { data: userRoleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .limit(20);

        const roles = ((userRoleRows || []) as Array<{ role: AppRole }>).map((r) => r.role);
        isSuperAdmin = roles.includes("super_admin");
      }

      if (isSuperAdmin) {
        toast({ title: "Login realizado", description: "Bem-vindo ao Painel Super Admin" });
        navigate("/cpanel");
      } else {
        toast({ title: "Login realizado", description: "Bem-vindo ao LucenaDelivery" });
        navigate("/admin");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            LucenaDelivery
          </span>
        </div>

        <Card className="border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>Acesse sua conta para gerenciar seus pedidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Entrar
              </Button>
            </form>

            {/* Demo credentials section removed */}

            <p className="text-center text-sm text-muted-foreground mt-4">
              Não tem conta?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Criar conta grátis
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
