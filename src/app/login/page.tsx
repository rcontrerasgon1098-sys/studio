
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
import { ArrowLeft, LogIn, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@icsa.com");
  const [password, setPassword] = useState("admin123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);

    try {
      // 1. Authenticate user with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Special handling for the admin user to ensure their role is always correct.
      if (user.email === 'admin@icsa.com') {
          const personnelDocRef = doc(db, "personnel", user.uid);
          // This ensures the admin document exists and has the correct role.
          await setDoc(personnelDocRef, {
              id: user.uid,
              email_t: user.email,
              nombre_t: "Admin ICSA",
              role: "admin", // Guarantees the 'admin' role
              rut_t: "1-9",
              id_t: "A-001"
          }, { merge: true }); // Use merge: true to create or update without overwriting other fields.

          toast({ title: "Bienvenido, Admin", description: "Acceso de administrador concedido." });
          router.push("/dashboard");
          return; // Exit here for the admin user.
      }

      // 3. For all other users, fetch their profile from 'personnel'
      const personnelDocRef = doc(db, "personnel", user.uid);
      const personnelDoc = await getDoc(personnelDocRef);

      if (!personnelDoc.exists()) {
        // If not the admin and no profile exists, deny access.
        toast({ 
          variant: "destructive", 
          title: "Acceso Denegado", 
          description: "No tienes un perfil de personal asignado en el sistema." 
        });
        if(auth.currentUser) await signOut(auth);
        setLoading(false);
        return;
      }
      
      // 4. Profile exists, get the role
      const personnelData = personnelDoc.data();
      const userRole = personnelData.role; // e.g., 'admin', 'supervisor', 'tecnico'

      // 5. Check if the role is 'tecnico', which is not allowed to log in
      if (userRole === 'tecnico') {
        toast({ 
          variant: "destructive", 
          title: "Acceso Denegado", 
          description: "Tu rol de Técnico no tiene permisos para acceder a este portal." 
        });
        if(auth.currentUser) await signOut(auth);
        setLoading(false);
        return;
      }

      // Login successful for supervisor
      toast({ title: "Bienvenido", description: `Acceso concedido como ${personnelData.nombre_t || user.email}.` });
      router.push("/dashboard");

    } catch (error: any) {
      let message = "Error de conexión. Verifique sus datos.";
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = "Credenciales incorrectas. Verifique su correo y contraseña.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Acceso bloqueado temporalmente por demasiados intentos fallidos.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Error de red. Verifique su conexión a internet.";
      } else {
        console.error("Login error:", error);
      }
      
      toast({ 
        variant: "destructive", 
        title: "Error de Acceso", 
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
              <span className="font-bold text-xs">Volver</span>
            </Button>
          </Link>
        </div>
        
        <CardHeader className="text-center space-y-4 pt-16 pb-2">
          {logoImage && (
            <div className="mx-auto relative w-48 h-48 transition-transform hover:scale-105 duration-500 drop-shadow-2xl">
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
            <CardTitle className="text-3xl font-black text-primary flex flex-col items-center leading-none tracking-tighter">
              ICSA
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.3em] mt-2">ingeniería comunicaciones S.A.</span>
            </CardTitle>
            <CardDescription className="text-base pt-2 font-medium">
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
              <Label htmlFor="password" className="text-xs font-bold ml-1 uppercase opacity-60">Contraseña</Label>
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
          </form>
          <div className="mt-6 p-4 bg-muted/30 rounded-xl text-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Aviso Operativo</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
              Solo el personal con rol de Supervisor o Administrador puede acceder a este portal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
