
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { validateRut } from "@/lib/rut-utils";

export default function EditTechnician({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const personnelRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "personnel", id);
  }, [db, id]);

  const { data: personnel, isLoading: isPersonnelLoading } = useDoc(personnelRef);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_t: "",
    rut_t: "",
    email_t: "",
    cel_t: "",
    rol_t: "tecnico",
    estado_t: "Activo"
  });

  useEffect(() => {
    if (personnel) {
      setFormData({
        nombre_t: personnel.nombre_t || "",
        rut_t: personnel.rut_t || "",
        email_t: personnel.email_t || "",
        cel_t: personnel.cel_t || "",
        rol_t: personnel.rol_t || "tecnico",
        estado_t: personnel.estado_t || "Activo"
      });
    }
  }, [personnel]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !id) return;
    
    setLoading(true);

    if (!formData.nombre_t || !formData.rut_t || !formData.email_t || !formData.rol_t) {
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

  if (isUserLoading || isPersonnelLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse bg-background text-primary">CARGANDO...</div>;

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
            <Save className="h-4 w-4 mr-2" /> Guardar Cambios
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
                    <Label className="font-bold uppercase text-[10px] text-muted-foreground">Estado del Perfil</Label>
                    <Select value={formData.estado_t} onValueChange={v => setFormData({...formData, estado_t: v})}>
                      <SelectTrigger className="h-12 border-primary/20 font-bold">
                        <SelectValue />
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
      </main>
    </div>
  );
}
