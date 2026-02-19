
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, Hash, Mail, Phone, ShieldCheck, UserCog, KeyRound } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { validateRut } from "@/lib/rut-utils";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function NewTechnician() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
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
    if (!user || !db || !auth) return;
    
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

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email_t, formData.password);
      const newAuthUser = userCredential.user;
      
      const personnelId = newAuthUser.uid;
      const personnelData = {
        nombre_t: formData.nombre_t,
        rut_t: formData.rut_t,
        email_t: formData.email_t,
        cel_t: formData.cel_t,
        rol_t: formData.rol_t,
        estado_t: "Activo", // ESTADO POR DEFECTO
        id: personnelId,
        createdAt: new Date().toISOString(),
        registeredBy: user.email
      };

      const personnelRef = doc(db, "personnel", personnelId);
      setDocumentNonBlocking(personnelRef, personnelData, { merge: true });
      
      toast({ title: "Personal Registrado", description: "El perfil ha sido creado con éxito." });
      router.push("/dashboard");

    } catch (error: any) {
      setLoading(false);
      let message = "No se pudo registrar el perfil.";
      if (error.code === 'auth/email-already-in-use') {
        message = "El correo ya existe. Si es un reingreso, use el perfil previo.";
      }
      toast({ variant: "destructive", title: "Error", description: message });
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse bg-background">CARGANDO...</div>;

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
            <h1 className="font-bold text-lg text-primary">Agregar Personal</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold uppercase text-xs">
            <Save className="h-4 w-4 mr-2" /> {loading ? "Guardando..." : "Guardar Personal"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="bg-secondary/20 p-6 rounded-t-lg border-b">
              <CardTitle className="text-primary flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Datos del Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_t" className="font-bold">Nombre Completo</Label>
                  <Input 
                    id="nombre_t"
                    placeholder="Ej: Rodrigo Tapia" 
                    value={formData.nombre_t}
                    onChange={e => setFormData({...formData, nombre_t: e.target.value})}
                    className="h-12"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rut_t" className="font-bold">RUT</Label>
                    <Input id="rut_t" value={formData.rut_t} onChange={e => setFormData({...formData, rut_t: e.target.value})} className="h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rol_t" className="font-bold">Rol</Label>
                    <Select value={formData.rol_t} onValueChange={v => setFormData({...formData, rol_t: v})}>
                      <SelectTrigger className="h-12">
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
                    <Label htmlFor="email_t" className="font-bold">Correo Corporativo</Label>
                    <Input id="email_t" type="email" value={formData.email_t} onChange={e => setFormData({...formData, email_t: e.target.value})} className="h-12" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cel_t" className="font-bold">Celular</Label>
                    <Input id="cel_t" value={formData.cel_t} onChange={e => setFormData({...formData, cel_t: e.target.value})} className="h-12" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <Label className="font-bold flex items-center gap-2 text-primary">
                  <KeyRound className="h-4 w-4" /> Credenciales de Acceso
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-12" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar</Label>
                      <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="h-12" required />
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
