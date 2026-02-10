
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
import { ArrowLeft, UserPlus, LogIn } from "lucide-react";
import Link from "next/link";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const auth = getAuth();
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Cuenta creada", description: "Ya puedes acceder al panel técnico." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Bienvenido", description: "Acceso concedido al panel técnico." });
      }
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = "Error de conexión. Verifique sus datos.";
      if (error.code === 'auth/weak-password') message = "La contraseña debe tener al menos 6 caracteres.";
      if (error.code === 'auth/email-already-in-use') message = "Este correo ya está registrado.";
      if (error.code === 'auth/invalid-credential') message = "Credenciales inválidas.";
      
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: message 
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
        
        <CardHeader className="text-center space-y-4 pt-16">
          {logoImage && (
            <div className="mx-auto relative w-48 h-48 transition-transform hover:scale-110 duration-500 drop-shadow-xl">
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
            <CardTitle className="text-4xl font-black text-primary flex flex-col items-center leading-none tracking-tighter">
              ICSA
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.3em] mt-2">ingeniería comunicaciones S.A.</span>
            </CardTitle>
            <CardDescription className="text-lg pt-2 font-medium">
              {isRegistering ? "Registro de Nuevo Técnico" : "Portal de Gestión Técnica"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8 pt-4">
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold ml-1">Correo Electrónico</Label>
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
              <Label htmlFor="password" suppressHydrationWarning className="text-sm font-bold ml-1">Contraseña</Label>
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
            <Button type="submit" className="w-full bg-primary h-12 text-lg font-black shadow-lg transition-all active:scale-95" disabled={loading}>
              {loading ? "Procesando..." : isRegistering ? "Crear Mi Cuenta" : "Entrar al Portal"}
            </Button>
            
            <div className="flex flex-col gap-3 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="text-primary font-bold gap-2"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isRegistering ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground font-medium opacity-60">
                Uso exclusivo para personal autorizado de ICSA.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
