
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, Hash, Mail, Phone, ShieldCheck, UserCog } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { validateRut } from "@/lib/rut-utils";

export default function NewTechnician() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nombre_t: "",
    rut_t: "",
    email_t: "",
    cel_t: "",
    rol_t: "Técnico"
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

    if (!formData.nombre_t || !formData.rut_t || !formData.email_t || !formData.rol_t) {
      toast({ 
        variant: "destructive", 
        title: "Campos Requeridos", 
        description: "Nombre, RUT, Email y Rol son obligatorios." 
      });
      setLoading(false);
      return;
    }

    if (!validateRut(formData.rut_t)) {
      toast({ 
        variant: "destructive", 
        title: "RUT Inválido", 
        description: "El RUT del técnico no es válido." 
      });
      setLoading(false);
      return;
    }

    // ID generado automáticamente
    const personnelId = doc(collection(db, "personnel")).id;
    const personnelData = {
      ...formData,
      id: personnelId,
      id_t: `T-${Math.floor(1000 + Math.random() * 9000)}`, // ID de visualización automático
      createdAt: new Date().toISOString(),
      registeredBy: user.email
    };

    const personnelRef = doc(db, "personnel", personnelId);
    
    try {
      setDocumentNonBlocking(personnelRef, personnelData, { merge: true });
      toast({ title: "Personal Registrado", description: "El integrante del equipo ha sido guardado." });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el registro." });
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
            <h1 className="font-bold text-lg text-primary">Agregar Personal / Técnico</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-6">
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
              <CardDescription>Ingrese la información profesional del nuevo técnico o personal administrativo.</CardDescription>
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

              <div className="p-4 bg-muted/40 rounded-xl border border-dashed flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary">ID_t Automático</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    El sistema generará un identificador único al finalizar el registro.
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
              Registrar Personal
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
