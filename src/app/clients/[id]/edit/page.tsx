
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User, Building, MapPin, Phone, Mail, BadgeCheck, Hash, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { validateRut } from "@/lib/rut-utils";

export default function EditClient({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const clientRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "clients", id);
  }, [db, id]);

  const { data: client, isLoading: isClientLoading } = useDoc(clientRef);
  
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [formData, setFormData] = useState({
    razonSocial: "",
    nombreCliente: "",
    rutCliente: "",
    direccionCliente: "",
    comunaCliente: "",
    telefonoCliente: "",
    emailClientes: "",
    estadoCliente: "Activo"
  });

  useEffect(() => {
    if (client && !isInitialized) {
      setFormData({
        razonSocial: client.razonSocial || "",
        nombreCliente: client.nombreCliente || "",
        rutCliente: client.rutCliente || "",
        direccionCliente: client.direccionCliente || "",
        comunaCliente: client.comunaCliente || "",
        telefonoCliente: client.telefonoCliente || "",
        emailClientes: client.emailClientes || "",
        estadoCliente: client.estadoCliente || "Activo"
      });
      setIsInitialized(true);
    }
  }, [client, isInitialized]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !id) return;
    
    setLoading(true);

    if (!formData.nombreCliente || !formData.rutCliente) {
      toast({ 
        variant: "destructive", 
        title: "Campos Requeridos", 
        description: "Nombre y RUT son obligatorios." 
      });
      setLoading(false);
      return;
    }

    if (!validateRut(formData.rutCliente)) {
      toast({ 
        variant: "destructive", 
        title: "RUT Inválido", 
        description: "El RUT ingresado no es válido según el dígito verificador." 
      });
      setLoading(false);
      return;
    }

    try {
      const clientDocRef = doc(db, "clients", id);
      updateDocumentNonBlocking(clientDocRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email
      });
      toast({ title: "Cliente Actualizado", description: "Los cambios han sido guardados con éxito." });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el cliente." });
    }
  };

  if (isUserLoading || isClientLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Cargando Cliente...</p>
      </div>
    );
  }

  if (!client && !isClientLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <AlertTriangle className="h-20 w-20 text-destructive" />
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-primary uppercase">No Encontrado</h1>
          <p className="text-muted-foreground font-medium">El cliente solicitado no existe.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="font-bold">Volver al Dashboard</Button>
        </Link>
      </div>
    );
  }

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
            <h1 className="font-bold text-lg md:text-xl text-primary">Editar Cliente</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold">
            <Save className="h-4 w-4 mr-2" /> {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="bg-secondary/20 p-6 rounded-t-lg border-b">
              <CardTitle className="text-primary">Información de la Empresa</CardTitle>
              <CardDescription>Actualice los datos fiscales y de contacto del cliente.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombreCliente" className="font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Nombre del Cliente
                  </Label>
                  <Input 
                    id="nombreCliente"
                    placeholder="Ej: Juan Pérez" 
                    value={formData.nombreCliente}
                    onChange={e => setFormData({...formData, nombreCliente: e.target.value})}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razonSocial" className="font-bold flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" /> Razón Social
                  </Label>
                  <Input 
                    id="razonSocial"
                    placeholder="Ej: Inversiones ICSA Ltda." 
                    value={formData.razonSocial}
                    onChange={e => setFormData({...formData, razonSocial: e.target.value})}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rutCliente" className="font-bold flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" /> RUT del Cliente
                  </Label>
                  <Input 
                    id="rutCliente"
                    placeholder="Ej: 12.345.678-9" 
                    value={formData.rutCliente}
                    onChange={e => setFormData({...formData, rutCliente: e.target.value})}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estadoCliente" className="font-bold flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" /> Estado del Cliente
                  </Label>
                  <Select 
                    value={formData.estadoCliente} 
                    onValueChange={v => setFormData({...formData, estadoCliente: v})}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="direccionCliente" className="font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Dirección
                  </Label>
                  <Input 
                    id="direccionCliente"
                    placeholder="Ej: Av. Principal 123" 
                    value={formData.direccionCliente}
                    onChange={e => setFormData({...formData, direccionCliente: e.target.value})}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comunaCliente" className="font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Comuna
                  </Label>
                  <Input 
                    id="comunaCliente"
                    placeholder="Ej: Providencia" 
                    value={formData.comunaCliente}
                    onChange={e => setFormData({...formData, comunaCliente: e.target.value})}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefonoCliente" className="font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> Teléfono
                  </Label>
                  <Input 
                    id="telefonoCliente"
                    placeholder="Ej: +56 9 1234 5678" 
                    value={formData.telefonoCliente}
                    onChange={e => setFormData({...formData, telefonoCliente: e.target.value})}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailClientes" className="font-bold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> Email
                  </Label>
                  <Input 
                    id="emailClientes"
                    type="email"
                    placeholder="Ej: contacto@empresa.com" 
                    value={formData.emailClientes}
                    onChange={e => setFormData({...formData, emailClientes: e.target.value})}
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
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
