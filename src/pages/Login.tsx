import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PawPrint, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha email e senha.");
      return;
    }

    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Email ou senha incorretos.");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("Seu email ainda não foi confirmado. Verifique sua caixa de entrada ou spam.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    refreshSession();
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/perfil";
    navigate(redirect);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 caramelo-gradient rounded-full flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">
              <span className="caramelo-text-gradient">Caramelinho</span>
              <span className="text-foreground">.com</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo de volta ao Caramelinho!</p>
        </div>

        <Card className="p-6 sm:p-8 border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full caramelo-gradient text-white" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Ainda não tem conta?{" "}
              <Link to="/cadastro" className="text-amber-600 hover:text-amber-700 font-medium">
                Cadastre-se
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
