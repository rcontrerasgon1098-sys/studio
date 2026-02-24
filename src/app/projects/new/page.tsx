
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Briefcase, Search, User, Building2, CheckCircle2, Info, LayoutList } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, setDoc, query, orderBy } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function NewProject() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [openClientSearch, setOpenClientSearch] = useState(false);

  const clientsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "clients"), orderBy("nombreCliente", "asc"));
  }, [db]);
  const { data: clients } = useCollection(clientsQuery);

  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    clientName: "",
  });

  const handleSelectClient = (client: any) => {
    setFormData({ ...formData, clientId: client.id, clientName: client.nombreCliente });
    setOpenClientSearch(false);
    toast({
      title: "Cliente seleccionado",
      description: `Se ha vinculado el proyecto a ${client.nombreCliente}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "Nombre requerido", description: "Por favor, asigne un nombre al proyecto." });
      return;
    }
    
    if (!formData.clientId) {
      toast({ variant: "destructive", title: "Cliente requerido", description: "Debe seleccionar un cliente para este proyecto." });
      return;
    }

    setLoading(true);
    const projectId = doc(collection(db, "projects")).id;
    const projectData = {
      ...formData,
      id: projectId,
      status: "Active",
      createdBy: user.uid,
      creatorEmail: user.email || "",
      startDate: new Date().toISOString(),
      teamIds: [user.uid]
    };

    try {
      await setDoc(doc(db, "projects", projectId), projectData);
      toast({ 
        title: "Proyecto Creado", 
        description: "El proyecto se ha iniciado correctamente." 
      });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el proyecto." });
    }
  };

  if (isUserLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Briefcase className="h-12 w-12 text-primary animate-pulse" />
      <p className="font-black uppercase tracking-tighter text-primary">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-primary leading-none">Iniciar Obra</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Creación de nuevo proyecto</p>
            </div>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.name || !formData.clientId} 
            className="bg-primary hover:bg-primary/90 font-black h-12 px-8 rounded-xl shadow-lg hidden md:flex"
          >
            {loading ? "Creando..." : "Crear Proyecto"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Formulario */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-primary/5 p-6 border-b">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-primary tracking-widest">
                  <LayoutList className="h-5 w-5" /> Información de la Obra
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Define el nombre identificador y vincula la empresa correspondiente.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Nombre del Proyecto */}
                <div className="space-y-3">
                  <Label htmlFor="projectName" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-3 w-3" /> Nombre del Proyecto
                  </Label>
                  <Input 
                    id="projectName"
                    placeholder="Ej: Instalación Rack Piso 4 - Sede Central" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="h-14 font-bold text-lg bg-muted/10 border-none focus-visible:ring-primary shadow-inner rounded-xl" 
                    required 
                  />
                  <p className="text-[10px] text-muted-foreground font-medium italic">
                    Use un nombre descriptivo que ayude a identificar la ubicación y el propósito.
                  </p>
                </div>

                {/* Selección de Cliente */}
                <div className="space-y-3 pt-4 border-t border-dashed">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-3 w-3" /> Empresa Cliente
                  </Label>
                  <div className="flex gap-3">
                    <div className={cn(
                      "flex-1 h-14 px-4 flex items-center rounded-xl border-2 transition-all",
                      formData.clientId ? "border-primary bg-primary/5" : "border-dashed border-muted bg-muted/5"
                    )}>
                      {formData.clientId ? (
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="font-bold text-primary">{formData.clientName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-medium text-sm">No se ha seleccionado cliente...</span>
                      )}
                    </div>
                    
                    <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-14 w-14 rounded-xl border-2 shadow-sm hover:bg-primary/10 hover:border-primary group transition-all">
                          <Search className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] md:w-[400px] p-0 shadow-2xl rounded-2xl border-none" align="end">
                        <Command className="rounded-2xl">
                          <CommandInput placeholder="Buscar empresa en el registro..." className="h-12 border-none focus:ring-0" />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty className="p-6 text-center text-sm">
                              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                              <p className="font-medium text-muted-foreground">No encontramos a ese cliente.</p>
                              <Link href="/clients/new">
                                <Button variant="link" className="text-xs text-primary font-bold uppercase mt-2">Crear nuevo cliente</Button>
                              </Link>
                            </CommandEmpty>
                            <CommandGroup heading="Empresas Registradas" className="p-2">
                              {clients?.map((client) => (
                                <CommandItem 
                                  key={client.id} 
                                  onSelect={() => handleSelectClient(client)} 
                                  className="p-3 cursor-pointer rounded-xl hover:bg-primary/10 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-black text-xs uppercase tracking-tight">{client.nombreCliente}</span>
                                      <span className="text-[9px] text-muted-foreground font-bold">{client.rutCliente}</span>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.name || !formData.clientId} 
              className="w-full h-16 bg-primary font-black uppercase text-lg shadow-xl rounded-2xl md:hidden"
            >
              {loading ? "Creando..." : "Crear Proyecto"}
            </Button>
          </div>

          {/* Columna Derecha: Tips/Resumen */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-lg border-none bg-accent/5 rounded-2xl">
              <CardHeader className="p-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Info className="h-4 w-4" /> Guía Operativa
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-primary">¿Qué es un Proyecto?</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Los proyectos permiten agrupar múltiples **Órdenes de Trabajo (OT)** bajo un mismo nombre y cliente.
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-primary/10">
                  <p className="text-xs font-bold text-primary">Beneficios:</p>
                  <ul className="text-[10px] space-y-2 text-muted-foreground list-disc pl-4">
                    <li>Seguimiento consolidado de la obra.</li>
                    <li>Generación de un **Acta Final de Proyecto** al cerrar.</li>
                    <li>Visualización histórica de todas las intervenciones.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {formData.clientId && (
              <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/20 border-dashed animate-in fade-in slide-in-from-right-4 duration-500">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Resumen de Selección</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Cliente:</span>
                    <span className="font-bold text-primary uppercase">{formData.clientName}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Responsable:</span>
                    <span className="font-bold text-primary">{user?.email?.split('@')[0]}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
