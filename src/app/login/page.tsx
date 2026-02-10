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
import { ArrowLeft, LogIn, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Bienvenido", description: "Acceso concedido al portal ICSA." });
      router.push("/dashboard");
    } catch (error: any) {
      let message = "Error de conexión. Verifique sus datos.";
      if (error.code === 'auth/invalid-credential') message = "Credenciales inválidas. Asegúrese de haber configurado el acceso demo o contacte a un administrador.";
      if (error.code === 'auth/user-not-found') message = "Usuario no registrado. Use el botón de configuración demo abajo.";
      
      toast({ 
        variant: "destructive", 
        title: "Error de Acceso", 
        description: message 
      });
      setLoading(false);
    }
  };

  const setupAdminAccount = async () => {
    setSetupLoading(true);
    const auth = getAuth();
    const adminEmail = "admin@icsa.com";
    const adminPassword = "admin123456";

    try {
      let user;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        user = userCredential.user;
      } catch (signInError: any) {
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          try {
            const createCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            user = createCredential.user;
          } catch (createError: any) {
            if (createError.code === 'auth/email-already-in-use') {
              throw new Error("El usuario ya existe con otra contraseña. Por favor, use las credenciales correctas.");
            }
            throw createError;
          }
        } else {
          throw signInError;
        }
      }

      if (user && db) {
        const adminDocRef = doc(db, "roles_admin", user.uid);
        setDocumentNonBlocking(adminDocRef, {
          email: adminEmail,
          role: "administrator",
          setupDate: new Date().toISOString()
        }, { merge: true });

        toast({ 
          title: "Configuración Exitosa", 
          description: "Acceso admin@icsa.com preparado correctamente." 
        });
        
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error de Configuración", 
        description: error.message || "No se pudo preparar la cuenta de administrador."
      });
      setSetupLoading(false);
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
              <span className="font-bold text-xs">Volver</span>
            </Button>
          </Link>
        </div>
        
        <CardHeader className="text-center space-y-4 pt-16 pb-2">
          {logoImage && (
            <div className="mx-auto relative w-56 h-56 transition-transform hover:scale-105 duration-500 drop-shadow-2xl">
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
              Portal de Gestión Técnica
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8 pt-4">
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold ml-1 uppercase opacity-60">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@icsa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background border-muted focus:ring-primary rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" suppressHydrationWarning className="text-xs font-bold ml-1 uppercase opacity-60">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-background border-muted focus:ring-primary rounded-xl pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary h-14 text-lg font-black shadow-lg transition-all active:scale-95 rounded-xl" disabled={loading}>
              <LogIn className="mr-2" size={20} />
              {loading ? "Verificando..." : "Entrar al Portal"}
            </Button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground font-bold">Desarrollo</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-dashed border-primary/40 text-primary font-bold h-12 rounded-xl gap-2"
              onClick={setupAdminAccount}
              disabled={setupLoading}
            >
              <ShieldCheck size={18} />
              {setupLoading ? "Configurando..." : "Configurar Acceso Demo Admin"}
            </Button>

            <div className="pt-4">
              <p className="text-center text-[10px] text-muted-foreground font-medium opacity-60 px-8">
                Haga clic en el botón de configuración demo si es la primera vez que accede. Esto creará el usuario admin@icsa.com automáticamente.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}