
"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Camera, CheckCircle2, Search, X, Image as ImageIcon, User, Phone, Mail, MapPin, Building2, Hash, Users, PlusCircle, Loader2, CheckSquare, Send, Briefcase } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserProfile } from "@/firebase";
import { collection, doc, query, orderBy, where } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { validateRut } from "@/lib/rut-utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function NewWorkOrder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { userProfile, isProfileLoading } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState(0);
  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [openTeamSearch, setOpenTeamSearch] = useState(false);

  // --- QUERIES ---
  const clientsQuery = useMemoFirebase(() => (db ? query(collection(db, "clients"), orderBy("nombreCliente", "asc")) : null), [db]);
  const { data: clients } = useCollection(clientsQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "projects"), where("status", "==", "Active"));
  }, [db, user?.uid]);
  const { data: allProjects } = useCollection(projectsQuery);

  const personnelQuery = useMemoFirebase(() => (db ? query(collection(db, "personnel"), orderBy("nombre_t", "asc")) : null), [db]);
  const { data: allPersonnel } = useCollection(personnelQuery);

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
    status: "Pending",
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

  // Si venimos de un proyecto, precargar cliente
  useEffect(() => {
    const pId = searchParams.get('projectId');
    if (pId && allProjects) {
      const proj = allProjects.find(p => p.id === pId);
      if (proj) {
        setFormData(prev => ({
          ...prev,
          clientId: proj.clientId,
          clientName: proj.clientName,
          projectId: pId
        }));
      }
    }
  }, [allProjects, searchParams]);

  const handleSelectClient = (client: any) => {
    setFormData({ ...formData, clientName: client.nombreCliente, clientPhone: client.telefonoCliente, clientEmail: client.emailClientes, clientId: client.id, address: client.direccionCliente || "" });
    setOpenClientSearch(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, sketchImageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setLoading(true);

    const isValidationComplete = !!formData.techSignatureUrl && !!formData.clientSignatureUrl && !!formData.clientReceiverRut;
    const finalStatus = isValidationComplete ? "Completed" : "Pending";
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

    const targetCol = finalStatus === "Completed" ? "historial" : "ordenes";
    try {
      setDocumentNonBlocking(doc(db, targetCol, orderId), workOrderData, { merge: true });
      toast({ title: "Orden Guardada" });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

  if (isUserLoading || isProfileLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse">CARGANDO...</div>;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft /></Button>
            </Link>
            <h1 className="font-bold text-lg text-primary uppercase tracking-tighter">Nueva OT #{folio || '...'}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none">
            <CardHeader className="bg-primary/5 p-4 border-b">
              <CardTitle className="text-primary text-sm flex items-center gap-2 uppercase font-black">
                <Briefcase className="h-4 w-4" /> Vinculación de Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label className="font-bold uppercase text-[10px]">Proyecto Asociado (Opcional)</Label>
                <Select value={formData.projectId} onValueChange={v => setFormData({...formData, projectId: v})}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sin proyecto específico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno (Orden Independiente)</SelectItem>
                    {allProjects?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} - {p.clientName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader className="bg-primary/5 p-4 border-b">
              <CardTitle className="text-primary text-sm flex items-center gap-2 uppercase font-black">
                <User className="h-4 w-4" /> Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px]">Nombre Cliente / Empresa</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Nombre de la empresa" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="h-12 font-bold" />
                    <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-12 w-12"><Search className="h-5 w-5 text-primary" /></Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="end">
                        <Command>
                          <CommandInput placeholder="Filtrar clientes..." />
                          <CommandList>
                            <CommandEmpty>Sin resultados.</CommandEmpty>
                            <CommandGroup>
                              {clients?.map((client) => (
                                <CommandItem key={client.id} onSelect={() => handleSelectClient(client)} className="p-3 cursor-pointer">
                                  <User className="h-4 w-4 mr-2" />
                                  <span className="font-bold">{client.nombreCliente}</span>
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
                  <Label className="font-bold uppercase text-[10px]">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Calle, Número, Comuna" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12 pl-10" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ... Resto de campos técnicos (Edificio, Piso, Señal, Checklists, Multimedia, Firmas) exactamente igual a tu versión anterior ... */}
          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader className="p-4 bg-primary/5 border-b">
              <CardTitle className="text-sm uppercase font-black text-primary">Detalles Técnicos y Red</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px]">Edificio</Label>
                  <Input value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px]">Piso</Label>
                  <Input value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} className="h-12" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-bold uppercase text-[10px]">Tipo de Señal</Label>
                  <Select value={formData.signalType} onValueChange={v => setFormData({...formData, signalType: v})}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Simple">Simple</SelectItem>
                      <SelectItem value="Doble">Doble</SelectItem>
                      <SelectItem value="Triple">Triple</SelectItem>
                      <SelectItem value="Fibra Óptica">Fibra Óptica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px]">Cantidad</Label>
                  <Input type="number" value={formData.signalCount} onChange={e => setFormData({...formData, signalCount: parseInt(e.target.value) || 0})} className="h-12" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
                  <Label className="font-bold text-xs uppercase">Certificación</Label>
                  <Switch checked={formData.isCert} onCheckedChange={(v) => setFormData({...formData, isCert: v})} />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
                  <Label className="font-bold text-xs uppercase">Rotulación</Label>
                  <Switch checked={formData.isLabeled} onCheckedChange={(v) => setFormData({...formData, isLabeled: v})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold uppercase text-[10px]">Descripción de Trabajos</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader className="bg-muted/20 p-4 border-b">
              <CardTitle className="text-xs font-black uppercase text-primary">Firmas Responsables</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <SignaturePad label="Firma del Técnico" onSave={(url) => setFormData({...formData, techSignatureUrl: url})} />
                <SignaturePad label="Firma de Recepción (Cliente)" onSave={(url) => setFormData({...formData, clientSignatureUrl: url})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">Nombre Receptor</Label>
                  <Input value={formData.clientReceiverName} onChange={e => setFormData({...formData, clientReceiverName: e.target.value})} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">RUT Receptor</Label>
                  <Input value={formData.clientReceiverRut} onChange={e => setFormData({...formData, clientReceiverRut: e.target.value})} className="h-12" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t md:relative md:bg-transparent md:border-none md:p-0 z-50">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 w-full h-16 text-xl font-black gap-3 shadow-xl rounded-2xl uppercase tracking-tighter" disabled={loading}>
              <CheckCircle2 size={28} /> Finalizar y Guardar OT
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
