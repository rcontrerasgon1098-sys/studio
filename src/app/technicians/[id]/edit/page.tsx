
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, ShieldCheck, KeyRound, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase, useUserProfile } from "@/firebase";
import { doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { validateRut } from "@/lib/rut-utils";
import { updateUserPassword } from "@/ai/flows/update-user-password-flow";

export default function EditTechnician({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const db = useFirestore();
  
  const personnelRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "personnel", id);
  }, [db, id]);

  const { data: personnel, isLoading: isPersonnelLoading } = useDoc(personnelRef);
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_t: "",
    rut_t: "",
    email_t: "",
    cel_t: "",
    rol_t: "tecnico",
    estado_t: "Activo"
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (personnel && !isInitialized) {
      // Normalizar el rol para que coincida con el Select
      const rawRole = personnel.rol_t || "tecnico";
      let normalizedRole = "tecnico";
      if (rawRole.toLowerCase().includes("admin")) normalizedRole = "admin";
      else if (rawRole.toLowerCase().includes("supervisor")) normalizedRole = "supervisor";
      else if (rawRole.toLowerCase().includes("tecnico") || rawRole.toLowerCase().includes("técnico")) normalizedRole = "tecnico";

      setFormData({
        nombre_t: personnel.nombre_t || "",
        rut_t: personnel.rut_t || "",
        email_t: personnel.email_t || "",
        cel_t: personnel.cel_t || "",
        rol_t: normalizedRole,
        estado_t: personnel.estado_t || "Activo"
      });
      setIsInitialized(true);
    }
  }, [personnel, isInitialized]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !id) return;
    
    setLoading(true);

    if (!formData.nombre_t || !formData.rut_t || !formData.email_t) {
      toast({ variant: "destructive", title: "Error", description: "Faltan campos requeridos." });
      setLoading(false);
      return;
    }

    if (!validateRut(formData.rut_t)) {
      toast({ variant: "destructive", title: "RUT Inválido", description: "Verifique el formato del RUT." });
      setLoading(false);
      return;
    }
    
    try {
      const docRef = doc(db, "personnel", id);
      updateDocumentNonBlocking(docRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email
      });
      toast({ title: "Cambios Guardados", description: "El perfil ha sido actualizado correctamente." });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el registro." });
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Las contraseñas no coinciden." });
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await updateUserPassword({
        userId: id,
        newPassword: passwordData.newPassword
      });

      if (result.success) {
        toast({ title: "Contraseña Actualizada", description: "La clave de acceso ha sido cambiada con éxito." });
        setPasswordData({ newPassword: "", confirmPassword: "" });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la contraseña." });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isUserLoading || isPersonnelLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Cargando Perfil...</p>
      </div>
    );
  }

  if (!personnel && !isPersonnelLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <AlertTriangle className="h-20 w-20 text-destructive" />
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-primary uppercase">No Encontrado</h1>
          <p className="text-muted-foreground font-medium">El perfil de personal solicitado no existe.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="font-bold">Volver al Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isAdmin = userProfile?.rol_t === "admin" || userProfile?.rol_t === "Administrador";

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
            <h1 className="font-bold text-lg text-primary">Editar Perfil</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold uppercase text-xs">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} 
            Guardar Cambios
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-2xl space-y-6">
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
                  <Label className="font-bold uppercase text-[10px] text-muted-foreground">Nombre Completo</Label>
                  <Input value={formData.nombre_t} onChange={e => setFormData({...formData, nombre_t: e.target.value})} className="h-12 font-bold" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-[10px] text-muted-foreground">RUT</Label>
                    <Input value={formData.rut_t} onChange={e => setFormData({...formData, rut_t: e.target.value})} className="h-12 font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-[10px] text-muted-foreground">Rol</Label>
                    <Select value={formData.rol_t} onValueChange={v => setFormData({...formData, rol_t: v})}>
                      <SelectTrigger className="h-12 font-bold">
                        <SelectValue placeholder="Seleccionar rol" />
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
                    <Label className="font-bold uppercase text-[10px] text-muted-foreground">Estado del Perfil</Label>
                    <Select value={formData.estado_t} onValueChange={v => setFormData({...formData, estado_t: v})}>
                      <SelectTrigger className="h-12 border-primary/20 font-bold">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo (Habilitado)</SelectItem>
                        <SelectItem value="Inactivo">Inactivo (Deshabilitado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-[10px] text-muted-foreground">Celular</Label>
                    <Input value={formData.cel_t} onChange={e => setFormData({...formData, cel_t: e.target.value})} className="h-12 font-bold" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        {isAdmin && (
          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="bg-destructive/5 p-6 border-b">
              <CardTitle className="text-destructive flex items-center gap-2 uppercase tracking-tighter font-black text-base">
                <KeyRound className="h-5 w-5" /> Seguridad y Acceso
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Como administrador, puede forzar el cambio de clave de este usuario.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nueva Contraseña</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="h-12 font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Confirmar Contraseña</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="h-12 font-bold" 
                  />
                </div>
              </div>
              <Button 
                onClick={handleUpdatePassword} 
                disabled={passwordLoading} 
                variant="outline"
                className="w-full h-12 border-destructive text-destructive hover:bg-destructive hover:text-white font-black uppercase text-xs tracking-widest gap-2"
              >
                {passwordLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Actualizar Clave de Acceso
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
