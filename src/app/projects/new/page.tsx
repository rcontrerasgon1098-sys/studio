
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, Search, Building2, CheckCircle2, LayoutList, Plus } from "lucide-react";
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    if (!formData.name.trim() || !formData.clientId) return;

    setLoading(true);
    const projectId = doc(collection(db, "projects")).id;
    const projectData = {
      ...formData,
      id: projectId,
      status: "Pendiente",
      createdBy: user.uid,
      creatorEmail: user.email || "",
      startDate: new Date().toISOString(),
      teamIds: [user.uid]
    };

    try {
      await setDoc(doc(db, "projects", projectId), projectData);
      toast({ title: "Proyecto Creado" });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el proyecto." });
    }
  };

  if (isUserLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Briefcase className="h-10 w-10 text-primary animate-bounce" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-black uppercase tracking-tighter text-primary">Nueva Obra</h1>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.name || !formData.clientId} 
            className="bg-primary hover:bg-primary/90 font-black h-11 px-8 rounded-xl shadow-lg transition-all active:scale-95"
          >
            {loading ? "..." : "Crear"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-none overflow-hidden rounded-3xl">
          <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
            <CardTitle className="text-xs font-black uppercase flex items-center gap-3 text-primary tracking-[0.2em]">
              <LayoutList className="h-4 w-4" /> Configuración Inicial
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            {/* Nombre del Proyecto */}
            <div className="space-y-4">
              <Label htmlFor="projectName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Identificador de Proyecto
              </Label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  id="projectName"
                  placeholder="Ej: Instalación Rack Sede Norte" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="h-16 pl-12 font-bold text-lg bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner rounded-2xl transition-all" 
                />
              </div>
            </div>

            {/* Selección de Cliente */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Empresa Asociada
              </Label>
              <div className="flex flex-col md:flex-row gap-3">
                <div className={cn(
                  "flex-1 h-16 px-6 flex items-center rounded-2xl border-2 transition-all duration-300",
                  formData.clientId ? "border-primary bg-primary/5" : "border-dashed border-muted-foreground/20 bg-muted/10"
                )}>
                  {formData.clientId ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="font-black text-primary uppercase text-sm truncate">{formData.clientName}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground font-bold text-sm opacity-40 uppercase tracking-tighter">Seleccione un cliente</span>
                  )}
                </div>
                
                <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-16 px-6 rounded-2xl border-2 border-primary/20 shadow-sm hover:bg-primary hover:text-white group transition-all shrink-0">
                      <Search className="h-5 w-5" />
                      <span className="ml-2 font-black uppercase text-xs tracking-widest">Buscar</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] md:w-[400px] p-0 shadow-2xl rounded-2xl border-none overflow-hidden" align="end">
                    <Command className="rounded-2xl">
                      <CommandInput placeholder="Filtrar clientes..." className="h-14 border-none focus:ring-0" />
                      <CommandList className="max-h-[350px]">
                        <CommandEmpty className="p-8 text-center">
                          <p className="text-sm font-bold text-muted-foreground">No hay resultados.</p>
                        </CommandEmpty>
                        <CommandGroup className="p-2">
                          {clients?.map((client) => (
                            <CommandItem 
                              key={client.id} 
                              onSelect={() => handleSelectClient(client)} 
                              className="p-4 cursor-pointer rounded-xl aria-selected:bg-primary aria-selected:text-white transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center group-aria-selected:bg-white/20">
                                  <Building2 className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-xs uppercase">{client.nombreCliente}</span>
                                  <span className="text-[10px] opacity-60 font-bold">{client.rutCliente}</span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <div className="p-3 border-t bg-muted/5 flex justify-center">
                           <Link href="/clients/new">
                            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-primary">
                              <Plus className="h-3 w-3 mr-1" /> Nuevo Cliente
                            </Button>
                           </Link>
                        </div>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
           <div className="flex flex-col items-center gap-2 opacity-20 group hover:opacity-100 transition-opacity">
              <span className="font-black text-lg tracking-tighter text-primary">ICSA</span>
              <span className="text-[6px] font-bold uppercase tracking-[0.3em]">ingeniería comunicaciones S.A.</span>
           </div>
        </div>
      </main>
    </div>
  );
}
