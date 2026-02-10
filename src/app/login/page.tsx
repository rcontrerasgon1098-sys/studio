"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Wifi } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock login for demo purposes
    setTimeout(() => {
      if (email && password) {
        toast({ title: "Bienvenido", description: "Acceso concedido al panel técnico." });
        router.push("/dashboard");
      } else {
        toast({ variant: "destructive", title: "Error", description: "Credenciales inválidas." });
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary w-12 h-12 rounded-xl flex items-center justify-center text-white mb-2">
            <Wifi className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold text-primary">ICSA ingeniería comunicaciones S.A.</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </Header>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tecnico@icsa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary h-11" disabled={loading}>
              {loading ? "Iniciando..." : "Entrar al Portal"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
