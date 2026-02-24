
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, User, MapPin, Building2, Hash, PlusCircle, CheckCircle2, X, Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserProfile } from "@/firebase";
import { collection, doc, query, orderBy, where } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function NewWorkOrder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { userProfile, isProfileLoading } = useUserProfile();
  
  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState(0);
  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [openTeamSearch, setOpenTeamSearch] = useState(false);

  const clientsQuery = useMemoFirebase(() => (db ? query(collection(db, "clients"), orderBy("nombreCliente", "asc")) : null), [db]);
  const { data: clients } = useCollection(clientsQuery);

  const personnelQuery = useMemoFirebase(() => (db ? query(collection(db, "personnel"), orderBy("nombre_t", "asc")) : null), [db]);
  const { data: allPersonnel } = useCollection(personnelQuery);

  const isAdmin = userProfile?.rol_t === 'admin' || userProfile?.rol_t === 'Administrador';

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    const colRef = collection(db, "projects");
    if (isAdmin) {
      return query(colRef, where("status", "==", "Active"));
    }
    return query(colRef, where("status", "==", "Active"), where("createdBy", "==", user.uid));
  }, [db, user?.uid, isAdmin]);
  const { data: allProjects } = useCollection(projectsQuery);

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientId: "",
    projectId: searchParams.get('projectId') || "",
    address: "",
    building: "",
    floor: "",
    signalType: "Simple",
    signalCount: 1,
    isCert: false,
    isLabeled: false,
    description: "",
    techName: "",
    techRut: "",
    techSignatureUrl: "",
    clientReceiverName: "",
    clientReceiverRut: "",
    clientReceiverEmail: "",
    clientSignatureUrl: "",
    sketchImageUrl: "",
    status: "Pendiente",
    team: [] as string[],
    teamIds: [] as string[]
  });

  useEffect(() => {
    setFolio(Math.floor(100000 + Math.random() * 900000));
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (userProfile?.nombre_t && user) {
      setFormData(prev => ({
        ...prev,
        team: prev.team.includes(userProfile.nombre_t!) ? prev.team : [...prev.team, userProfile.nombre_t!],
        teamIds: prev.teamIds.includes(user.uid) ? prev.teamIds : [...prev.teamIds, user.uid],
        techName: prev.techName || userProfile.nombre_t || "",
        techRut: prev.techRut || (userProfile as any).rut_t || ""
      }));
    }
  }, [userProfile, user]);

  const handleSelectClient = (client: any) => {
    setFormData({ ...formData, clientName: client.nombreCliente, clientPhone: client.telefonoCliente, clientEmail: client.emailClientes, clientId: client.id, address: client.direccionCliente || "" });
    setOpenClientSearch(false);
  };

  const handleTeamSelect = (person: any) => {
    if (!formData.teamIds.includes(person.id)) {
      setFormData(prev => ({
        ...prev,
        team: [...prev.team, person.nombre_t],
        teamIds: [...prev.teamIds, person.id]
      }));
    }
    setOpenTeamSearch(false);
  };

  const handleTeamRemove = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      team: prev.team.filter((_, i) => prev.teamIds[i] !== memberId),
      teamIds: prev.teamIds.filter(id => id !== memberId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setLoading(true);

    const isValidationComplete = !!formData.techSignatureUrl && !!formData.clientSignatureUrl && !!formData.clientReceiverRut;
    const finalStatus = isValidationComplete ? "Completado" : "Pendiente";
    const orderId = doc(collection(db, "ordenes")).id;
    
    const workOrderData = {
      ...formData,
      id: orderId,
      folio: folio,
      status: finalStatus,
      createdBy: user.uid,
      startDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const targetCol = finalStatus === "Completado" ? "historial" : "ordenes";
    try {
      setDocumentNonBlocking(doc(db, targetCol, orderId), workOrderData, { merge: true });
      toast({ title: "Orden Generada con Éxito" });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Falla en el Guardado", description: "Verifique su conexión e intente nuevamente." });
    }
  };

  if (isUserLoading || isProfileLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase tracking-tighter">Preparando Formulario...</div>;

  return (
    <div className="min-h-screen bg-muted/20 pb-28 md:pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="font-black text-sm md:text-lg text-primary uppercase tracking-tighter">Nueva OT #{folio || '...'}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b">
              <CardTitle className="text-primary text-xs flex items-center gap-2 uppercase font-black tracking-widest">
                <Briefcase className="h-5 w-5" /> Proyecto / Obra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Vincular a una obra activa</Label>
                <Select 
                  value={formData.projectId || "none"} 
                  onValueChange={v => setFormData({...formData, projectId: v === "none" ? "" : v})}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-none bg-muted/30 font-bold">
                    <SelectValue placeholder="Sin proyecto específico" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="none" className="rounded-xl font-bold">Ninguno (Independiente)</SelectItem>
                    {allProjects?.map(p => (
                      <SelectItem key={p.id} value={p.id} className="rounded-xl font-bold">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b">
              <CardTitle className="text-primary text-sm flex items-center gap-3 uppercase font-black tracking-widest">
                <User className="h-5 w-5" /> Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Mandante / Empresa (Manual o Búsqueda)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <Input 
                        placeholder="Nombre de la empresa" 
                        value={formData.clientName} 
                        onChange={e => setFormData({...formData, clientName: e.target.value, clientId: ""})} 
                        className="h-14 font-black text-lg bg-muted/30 border-none rounded-2xl px-6 shadow-inner focus-visible:ring-primary" 
                      />
                      {formData.clientId && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Badge className="bg-primary text-white text-[8px] uppercase font-black">Vinculado</Badge>
                        </div>
                      )}
                    </div>
                    <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg shrink-0"><Search className="h-6 w-6" /></Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] md:w-[400px] p-0 shadow-2xl rounded-3xl border-none overflow-hidden" align="end">
                        <Command>
                          <CommandInput placeholder="Filtrar clientes registrados..." className="h-14 font-bold border-none focus:ring-0" />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty className="p-6 text-center text-sm font-bold opacity-40">Sin resultados.</CommandEmpty>
                            <CommandGroup heading="Clientes ICSA" className="p-2">
                              {clients?.map((client) => (
                                <CommandItem key={client.id} onSelect={() => handleSelectClient(client)} className="p-4 cursor-pointer rounded-2xl aria-selected:bg-primary aria-selected:text-white transition-all">
                                  <User className="h-5 w-5 mr-3" />
                                  <div className="flex flex-col">
                                    <span className="font-black text-xs uppercase">{client.nombreCliente}</span>
                                    <span className="text-[10px] opacity-60 font-bold">{client.rutCliente}</span>
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
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Dirección de Servicio</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input placeholder="Ej: Av. Las Condes 1234, Of. 502" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold shadow-inner" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-6 border-b bg-muted/5">
              <CardTitle className="text-lg flex items-center gap-3 uppercase font-black tracking-tighter">
                <Users className="h-6 w-6 text-primary"/> Equipo de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="flex flex-wrap gap-2">
                {formData.team.map((name, index) => (
                  <Badge key={index} className="text-xs py-2 px-5 rounded-xl bg-primary/10 text-primary gap-3 font-black border-none transition-all hover:bg-primary/20">
                    {name}
                    {formData.teamIds[index] !== user?.uid && (
                      <button type="button" onClick={() => handleTeamRemove(formData.teamIds[index])} className="rounded-full bg-primary/20 hover:bg-primary/40 p-1">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              <Popover open={openTeamSearch} onOpenChange={setOpenTeamSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-16 text-sm font-black border-dashed border-2 rounded-2xl uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 transition-all">
                    <PlusCircle className="h-5 w-5 mr-3" /> Añadir Colaboradores
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] md:w-[500px] p-0 shadow-2xl rounded-3xl border-none overflow-hidden" align="center">
                  <Command>
                    <CommandInput placeholder="Filtrar por nombre..." className="h-16 border-none focus:ring-0 font-bold"/>
                    <CommandList className="max-h-[350px]">
                      <CommandEmpty className="p-8 text-center text-muted-foreground font-bold">Sin resultados.</CommandEmpty>
                      <CommandGroup heading="Personal Autorizado" className="p-2">
                        {(allPersonnel || []).map(person => (
                          <CommandItem key={person.id} onSelect={() => handleTeamSelect(person)} className="p-4 cursor-pointer rounded-2xl aria-selected:bg-primary aria-selected:text-white transition-all">
                            <User className="mr-4 h-6 w-6" />
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-xs">{person.nombre_t}</span>
                              <span className="text-[10px] font-bold opacity-60">{person.rol_t}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-6 bg-primary/5 border-b">
              <CardTitle className="text-xl uppercase font-black text-primary tracking-tighter">Especificaciones Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Edificio / Torre</Label>
                  <Input value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Piso / Nivel</Label>
                  <Input value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Tipo de Canal / Señal</Label>
                  <Select value={formData.signalType} onValueChange={v => setFormData({...formData, signalType: v})}>
                    <SelectTrigger className="h-14 rounded-2xl border-none bg-muted/30 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="Simple" className="rounded-xl">Simple</SelectItem>
                      <SelectItem value="Doble" className="rounded-xl">Doble</SelectItem>
                      <SelectItem value="Triple" className="rounded-xl">Triple</SelectItem>
                      <SelectItem value="Fibra Óptica" className="rounded-xl">Fibra Óptica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Cantidad (Puntos)</Label>
                  <Input type="number" value={formData.signalCount} onChange={e => setFormData({...formData, signalCount: parseInt(e.target.value) || 0})} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-5 bg-muted/20 rounded-2xl border-2 border-dashed border-primary/10">
                  <Label className="font-black text-[10px] uppercase tracking-widest">Requiere Certificación</Label>
                  <Switch checked={formData.isCert} onCheckedChange={(v) => setFormData({...formData, isCert: v})} />
                </div>
                <div className="flex items-center justify-between p-5 bg-muted/20 rounded-2xl border-2 border-dashed border-primary/10">
                  <Label className="font-black text-[10px] uppercase tracking-widest">Requiere Rotulación</Label>
                  <Switch checked={formData.isLabeled} onCheckedChange={(v) => setFormData({...formData, isLabeled: v})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Bitácora de Trabajos Realizados</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[160px] rounded-3xl bg-muted/30 border-none p-6 font-medium text-base shadow-inner resize-none" placeholder="Describa detalladamente las acciones ejecutadas..." />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 p-6 border-b">
              <CardTitle className="text-xs font-black uppercase text-primary tracking-widest">Protocolo de Cierre (Firmas)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <SignaturePad label="Validación Técnica (ICSA)" onSave={(url) => setFormData({...formData, techSignatureUrl: url})} />
                <SignaturePad label="Recepción Conforme (Cliente)" onSave={(url) => setFormData({...formData, clientSignatureUrl: url})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-dashed">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombre del Receptor</Label>
                  <Input value={formData.clientReceiverName} onChange={e => setFormData({...formData, clientReceiverName: e.target.value})} className="h-12 bg-muted/30 border-none rounded-xl font-bold px-4 shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">RUT del Receptor</Label>
                  <Input value={formData.clientReceiverRut} onChange={e => setFormData({...formData, clientReceiverRut: e.target.value})} className="h-12 bg-muted/30 border-none rounded-xl font-bold px-4 shadow-inner" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t md:relative md:bg-transparent md:border-none md:p-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 w-full h-16 text-xl font-black gap-4 shadow-2xl rounded-2xl uppercase tracking-tighter transition-all active:scale-95" disabled={loading}>
              <CheckCircle2 size={28} /> {loading ? "Procesando..." : "Finalizar y Guardar OT"}
            </Button>
          </div>
        </form>
      </main>

      <footer className="mt-12 text-center pb-20 md:pb-12 px-6">
        <div className="flex flex-col items-center opacity-30">
          <span className="font-black text-xl tracking-tighter text-primary">ICSA</span>
          <span className="text-[8px] font-bold uppercase tracking-[0.4em] mt-1">ingeniería comunicaciones S.A.</span>
        </div>
      </footer>
    </div>
  );
}
