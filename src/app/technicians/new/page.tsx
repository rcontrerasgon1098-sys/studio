
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, collection } from "firebase/firestore";
import { validateRut } from "@/lib/rut-utils";
import { initializeApp, getApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

export default function NewTechnician() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre_t: "",
    rut_t: "",
    email_t: "",
    cel_t: "",
    rol_t: "tecnico",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    setLoading(true);

    if (!formData.nombre_t || !formData.rut_t || !formData.email_t || !formData.rol_t || !formData.password) {
      toast({ variant: "destructive", title: "Campos Requeridos", description: "Faltan datos obligatorios." });
      setLoading(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Contraseñas no coinciden." });
      setLoading(false);
      return;
    }

    if (!validateRut(formData.rut_t)) {
      toast({ variant: "destructive", title: "RUT Inválido", description: "Verifique el RUT ingresado." });
      setLoading(false);
      return;
    }

    // Para evitar que el administrador se desconecte al crear un usuario,
    // creamos una instancia secundaria de Firebase Auth temporal.
    let secondaryApp;
    try {
      const secondaryAppName = `Secondary-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email_t, formData.password);
      const newAuthUser = userCredential.user;
      
      const personnelId = newAuthUser.uid;
      const personnelData = {
        nombre_t: formData.nombre_t,
        rut_t: formData.rut_t,
        email_t: formData.email_t,
        cel_t: formData.cel_t,
        rol_t: formData.rol_t,
        estado_t: "Activo",
        id: personnelId,
        createdAt: new Date().toISOString(),
        registeredBy: user.email
      };

      const personnelRef = doc(db, "personnel", personnelId);
      await setDoc(personnelRef, personnelData);
      
      toast({ title: "Personal Registrado", description: "El perfil ha sido creado con éxito." });
      
      // Limpiar app secundaria
      if (secondaryApp) await deleteApp(secondaryApp);
      
      router.push("/dashboard");

    } catch (error: any) {
      setLoading(false);
      if (secondaryApp) await deleteApp(secondaryApp);
      
      let message = "No se pudo registrar el perfil.";
      if (error.code === 'auth/email-already-in-use') {
        message = "El correo ya existe. Si es un reingreso, use el perfil previo.";
      } else if (error.code === 'auth/weak-password') {
        message = "La contraseña es muy débil (mínimo 6 caracteres).";
      }
      toast({ variant: "destructive", title: "Error", description: message });
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse bg-background text-primary">CARGANDO...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg text-primary uppercase tracking-tighter">Agregar Personal</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold uppercase text-xs">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} 
            {loading ? "Guardando..." : "Guardar Personal"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="bg-secondary/20 p-6 rounded-t-lg border-b">
              <CardTitle className="text-primary flex items-center gap-2 uppercase tracking-tighter font-black">
                <ShieldCheck className="h-5 w-5" /> Datos del Colaborador
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Registro de nuevo personal administrativo o técnico.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_t" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Nombre Completo</Label>
                  <Input 
                    id="nombre_t"
                    placeholder="Ej: Rodrigo Tapia" 
                    value={formData.nombre_t}
                    onChange={e => setFormData({...formData, nombre_t: e.target.value})}
                    className="h-12 font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rut_t" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">RUT</Label>
                    <Input id="rut_t" placeholder="12.345.678-9" value={formData.rut_t} onChange={e => setFormData({...formData, rut_t: e.target.value})} className="h-12 font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rol_t" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Rol Asignado</Label>
                    <Select value={formData.rol_t} onValueChange={v => setFormData({...formData, rol_t: v})}>
                      <SelectTrigger className="h-12 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_t" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Correo Corporativo</Label>
                    <Input id="email_t" type="email" placeholder="usuario@icsa.com" value={formData.email_t} onChange={e => setFormData({...formData, email_t: e.target.value})} className="h-12 font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cel_t" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Celular de Contacto</Label>
                    <Input id="cel_t" placeholder="+56 9..." value={formData.cel_t} onChange={e => setFormData({...formData, cel_t: e.target.value})} className="h-12 font-bold" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <Label className="font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-2 text-primary">
                  <KeyRound className="h-4 w-4" /> Credenciales de Acceso
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[10px] font-bold uppercase text-muted-foreground">Contraseña</Label>
                      <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-12 font-bold" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase text-muted-foreground">Confirmar Contraseña</Label>
                      <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="h-12 font-bold" required />
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
