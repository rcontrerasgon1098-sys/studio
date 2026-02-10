
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, Hash, Mail, Phone, ShieldCheck, UserCog, Eraser } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { SignaturePad } from "@/components/SignaturePad";

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
    rol_t: "Técnico",
    signatureUrl: ""
  });

  useEffect(() => {
    if (personnel) {
      setFormData({
        nombre_t: personnel.nombre_t || "",
        rut_t: personnel.rut_t || "",
        email_t: personnel.email_t || "",
        cel_t: personnel.cel_t || "",
        rol_t: personnel.rol_t || "Técnico",
        signatureUrl: personnel.signatureUrl || ""
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
      toast({ 
        variant: "destructive", 
        title: "Campos Requeridos", 
        description: "Nombre, RUT, Email y Rol son obligatorios." 
      });
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
      toast({ title: "Personal Actualizado", description: "Los cambios han sido guardados." });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el registro." });
    }
  };

  if (isUserLoading || isPersonnelLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse bg-background text-primary">CARGANDO PERSONAL...</div>;
  if (!personnel) return <div className="min-h-screen flex items-center justify-center font-bold bg-background">Personal no encontrado.</div>;

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
            <h1 className="font-bold text-lg text-primary">Editar Personal</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold">
            <Save className="h-4 w-4 mr-2" /> {loading ? "Guardando..." : "Guardar Cambios"}
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
              <CardDescription>Actualice la información profesional del integrante del equipo.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_t" className="font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Nombre Completo
                  </Label>
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
                    <Label htmlFor="rut_t" className="font-bold flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" /> RUT
                    </Label>
                    <Input 
                      id="rut_t"
                      placeholder="Ej: 15.678.123-K" 
                      value={formData.rut_t}
                      onChange={e => setFormData({...formData, rut_t: e.target.value})}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rol_t" className="font-bold flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-primary" /> Rol en la Empresa
                    </Label>
                    <Select 
                      value={formData.rol_t} 
                      onValueChange={v => setFormData({...formData, rol_t: v})}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                        <SelectItem value="Técnico">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_t" className="font-bold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" /> Correo Corporativo
                    </Label>
                    <Input 
                      id="email_t"
                      type="email"
                      placeholder="tecnico@icsa.com" 
                      value={formData.email_t}
                      onChange={e => setFormData({...formData, email_t: e.target.value})}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cel_t" className="font-bold flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" /> Celular de Contacto
                    </Label>
                    <Input 
                      id="cel_t"
                      placeholder="+56 9 8765 4321" 
                      value={formData.cel_t}
                      onChange={e => setFormData({...formData, cel_t: e.target.value})}
                      className="h-12"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="font-bold">Firma Digital Permanente</Label>
                {formData.signatureUrl ? (
                  <div className="space-y-2">
                    <div className="relative h-32 w-full bg-background/50 rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                      <Image src={formData.signatureUrl} alt="Firma Guardada" fill className="object-contain" />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFormData({...formData, signatureUrl: ""})}
                      className="w-full text-xs font-bold gap-2"
                    >
                      <Eraser className="h-3 w-3" /> Borrar para Cambiar
                    </Button>
                  </div>
                ) : (
                  <SignaturePad 
                    label="Dibuje su firma para guardar" 
                    onSave={(dataUrl) => setFormData({...formData, signatureUrl: dataUrl})} 
                  />
                )}
                <p className="text-[10px] text-muted-foreground italic">Esta firma se cargará automáticamente en cada orden de trabajo que realice.</p>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border border-dashed flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary">ID de Seguimiento</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    ID: {personnel.id_t}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 pb-10">
            <Link href="/dashboard">
              <Button variant="outline" type="button" className="h-12 px-8 font-bold">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-primary h-12 px-12 font-black shadow-lg">
              Confirmar Cambios
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
