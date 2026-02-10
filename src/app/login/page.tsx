
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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

    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Bienvenido", description: "Acceso concedido al panel técnico." });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Credenciales inválidas o error de conexión. Verifique su correo y contraseña." 
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-primary/30" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
      
      <Card className="w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none bg-white/95 backdrop-blur-xl relative z-10 p-4">
        <div className="absolute top-6 left-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={18} />
              <span className="font-bold">Volver</span>
            </Button>
          </Link>
        </div>
        
        <CardHeader className="text-center space-y-6 pt-16">
          {logoImage && (
            <div className="mx-auto relative w-56 h-56 mb-4 transition-transform hover:scale-110 duration-500 drop-shadow-xl">
              <Image
                src={logoImage.imageUrl}
                alt="ICSA Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
          <div className="space-y-2">
            <CardTitle className="text-4xl font-headline font-black text-primary flex flex-col items-center leading-none tracking-tighter">
              ICSA
              <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-[0.3em] mt-2">ingeniería comunicaciones S.A.</span>
            </CardTitle>
            <CardDescription className="text-lg pt-4 font-medium">Portal de Gestión Técnica</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-12 pt-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold ml-1">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tecnico@icsa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 bg-background border-muted focus:ring-primary text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" suppressHydrationWarning className="text-sm font-bold ml-1">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 bg-background border-muted focus:ring-primary text-lg"
              />
            </div>
            <Button type="submit" className="w-full bg-primary h-14 text-xl font-black shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95" disabled={loading}>
              {loading ? "Verificando..." : "Entrar al Portal"}
            </Button>
            <p className="text-center text-xs text-muted-foreground pt-4 font-medium opacity-60">
              Uso exclusivo para personal autorizado de ICSA.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
