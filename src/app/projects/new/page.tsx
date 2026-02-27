
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, Search, Building2, CheckCircle2, LayoutList, Plus, User, Users, X, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserProfile } from "@/firebase";
import { collection, doc, setDoc, query, orderBy } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function NewProject() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [openTeamSearch, setOpenTeamSearch] = useState(false);

  const clientsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "clients"), orderBy("nombreCliente", "asc"));
  }, [db]);
  const { data: clients } = useCollection(clientsQuery);

  const personnelQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "personnel"), orderBy("nombre_t", "asc"));
  }, [db]);
  const { data: allPersonnel } = useCollection(personnelQuery);

  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    clientName: "",
    teamNames: [] as string[],
    teamIds: [] as string[]
  });

  useEffect(() => {
    if (userProfile?.nombre_t && user && formData.teamIds.length === 0) {
      setFormData(prev => ({
        ...prev,
        teamNames: [userProfile.nombre_t!],
        teamIds: [user.uid]
      }));
    }
  }, [userProfile, user, formData.teamIds.length]);

  const handleSelectClient = (client: any) => {
    setFormData({ ...formData, clientId: client.id, clientName: client.nombreCliente });
    setOpenClientSearch(false);
  };

  const handleTeamSelect = (person: any) => {
    if (!formData.teamIds.includes(person.id)) {
      setFormData(prev => ({
        ...prev,
        teamNames: [...prev.teamNames, person.nombre_t],
        teamIds: [...prev.teamIds, person.id]
      }));
    }
    setOpenTeamSearch(false);
  };

  const handleTeamRemove = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      teamNames: prev.teamNames.filter((_, i) => prev.teamIds[i] !== memberId),
      teamIds: prev.teamIds.filter(id => id !== memberId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    if (!formData.name.trim() || !formData.clientName.trim()) {
      toast({ variant: "destructive", title: "Faltan Datos", description: "El nombre del proyecto y el cliente son obligatorios." });
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
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "projects", projectId), projectData);
      toast({ title: "Proyecto Creado", description: "El proyecto ha sido iniciado con éxito." });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el proyecto." });
    }
  };

  if (isUserLoading || isProfileLoading) return (
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
            <h1 className="text-xl font-black uppercase tracking-tighter text-primary">Iniciar Proyecto</h1>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.name || !formData.clientName} 
            className="bg-primary hover:bg-primary/90 font-black h-11 px-8 rounded-xl shadow-lg transition-all active:scale-95"
          >
            {loading ? "Iniciando..." : "Crear Proyecto"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-none overflow-hidden rounded-3xl">
          <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
            <CardTitle className="text-xs font-black uppercase flex items-center gap-3 text-primary tracking-[0.2em]">
              <LayoutList className="h-4 w-4" /> Configuración de Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="space-y-4">
              <Label htmlFor="projectName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Nombre o Identificador del Proyecto
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

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Empresa Contratante (Manual o Búsqueda)
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Escriba el nombre de la empresa..." 
                    value={formData.clientName} 
                    onChange={e => setFormData({...formData, clientName: e.target.value, clientId: ""})} 
                    className="h-16 pl-12 font-bold text-lg bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner rounded-2xl transition-all" 
                  />
                  {formData.clientId && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Badge className="bg-primary text-white text-[8px] uppercase font-black">Vinculado</Badge>
                    </div>
                  )}
                </div>

                <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg shrink-0">
                      <Search className="h-6 w-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] md:w-[400px] p-0 shadow-2xl rounded-2xl border-none overflow-hidden" align="end">
                    <Command className="rounded-2xl">
                      <CommandInput placeholder="Buscar clientes registrados..." className="h-14 border-none focus:ring-0" />
                      <CommandList className="max-h-[350px]">
                        <CommandEmpty className="p-8 text-center">
                          <p className="text-sm font-bold text-muted-foreground">No se encontraron clientes.</p>
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
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Users className="h-4 w-4" /> Colaboradores del Proyecto
              </Label>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.teamNames.map((name, index) => (
                  <Badge key={index} className="text-[10px] py-1.5 px-4 rounded-xl bg-primary/10 text-primary gap-3 font-black border-none">
                    {name}
                    {formData.teamIds[index] !== user?.uid && (
                      <button type="button" onClick={() => handleTeamRemove(formData.teamIds[index])} className="rounded-full bg-primary/20 hover:bg-primary/40 p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              
              <Popover open={openTeamSearch} onOpenChange={setOpenTeamSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-14 text-xs font-black border-dashed border-2 rounded-2xl uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 transition-all">
                    <PlusCircle className="h-4 w-4 mr-2" /> Añadir Supervisores o Grupos
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] md:w-[400px] p-0 shadow-2xl rounded-2xl border-none overflow-hidden" align="center">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre..." className="h-14 border-none focus:ring-0 font-bold"/>
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty className="p-6 text-center text-sm font-bold opacity-40">Sin resultados.</CommandEmpty>
                      <CommandGroup heading="Personal Autorizado" className="p-2">
                        {(allPersonnel || []).map(person => (
                          <CommandItem key={person.id} onSelect={() => handleTeamSelect(person)} className="p-4 cursor-pointer rounded-xl aria-selected:bg-primary aria-selected:text-white transition-all">
                            <User className="mr-3 h-5 w-5" />
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-[10px]">{person.nombre_t}</span>
                              <span className="text-[8px] font-bold opacity-60">{person.rol_t}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-[9px] text-muted-foreground italic text-center">Añadir a otros supervisores les permitirá ver este proyecto y crear OTs vinculadas.</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 flex justify-center">
           <div className="flex flex-col items-center gap-2 opacity-20">
              <span className="font-black text-lg tracking-tighter text-primary">ICSA</span>
              <span className="text-[6px] font-bold uppercase tracking-[0.3em]">ingeniería comunicaciones S.A.</span>
           </div>
        </div>
      </main>
    </div>
  );
}
