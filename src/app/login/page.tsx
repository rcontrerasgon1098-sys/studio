"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-md shadow-2xl border-none bg-white/90 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4 pt-10">
          {logoImage && (
            <div className="mx-auto relative w-32 h-32 mb-2 transition-transform hover:scale-105 duration-300">
              <Image
                src={logoImage.imageUrl}
                alt="ICSA Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold text-primary flex flex-col items-center leading-none">
              ICSA
              <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest mt-1">ingeniería comunicaciones S.A.</span>
            </CardTitle>
            <CardDescription className="text-base pt-2">Portal de Gestión Técnica</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tecnico@icsa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background border-muted focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" suppressHydrationWarning className="text-sm font-semibold">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-background border-muted focus:ring-primary"
              />
            </div>
            <Button type="submit" className="w-full bg-primary h-12 text-lg font-bold shadow-lg hover:shadow-xl transition-all" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Entrar al Portal"}
            </Button>
            <p className="text-center text-xs text-muted-foreground pt-2">
              Si olvidaste tu acceso, contacta con soporte IT.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
