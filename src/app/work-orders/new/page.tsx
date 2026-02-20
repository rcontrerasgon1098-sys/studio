
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Camera, CheckCircle2, Search, X, Image as ImageIcon, User, Phone, Mail, MapPin, Building2, Hash, Users, PlusCircle, Loader2, CheckSquare, Send } from "lucide-react";
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
import { sendWorkOrderEmail } from "@/ai/flows/send-work-order-email-flow";
import { sendSignatureRequest } from "@/ai/flows/send-signature-request-flow";

export default function NewWorkOrder() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { userProfile, isProfileLoading } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [isSendingSignature, setIsSendingSignature] = useState(false);
  const [folio, setFolio] = useState(0);
  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [openTeamSearch, setOpenTeamSearch] = useState(false);

  const clientsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "clients"), orderBy("nombreCliente", "asc"));
  }, [db]);
  const { data: clients } = useCollection(clientsQuery);

  const techProfileQuery = useMemoFirebase(() => {
    if (!db || !user?.email) return null;
    return query(collection(db, "personnel"), where("email_t", "==", user.email));
  }, [db, user?.email]);
  const { data: techProfiles } = useCollection(techProfileQuery);
  
  const personnelQuery = useMemoFirebase(() => {
    if (!db || !userProfile) return null;
    return query(collection(db, "personnel"), orderBy("nombre_t", "asc"));
  }, [db, userProfile]);
  const { data: allPersonnel } = useCollection(personnelQuery);

  const availablePersonnel = allPersonnel || [];

  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientId: "",
    address: "",
    building: "",
    floor: "",
    signalType: "Simple",
    signalCount: 1,
    isCert: false,
    certifiedPointsCount: 0,
    isPlan: false,
    isLabeled: false,
    labelDetails: "",
    isCanalized: false,
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
    teamIds: [] as string[],
    technicianId: "",
    supervisorId: "", // Mantener para compatibilidad con reglas
  });

  const generateFolio = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return parseInt(`${year}${month}${random}`);
  };

  useEffect(() => {
    setFolio(generateFolio());
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (userProfile?.nombre_t && user) {
      setFormData(prev => {
        const updatedTeam = prev.team.includes(userProfile.nombre_t!) ? prev.team : [...prev.team, userProfile.nombre_t!];
        const updatedTeamIds = prev.teamIds.includes(user.uid) ? prev.teamIds : [...prev.teamIds, user.uid];
        return { 
          ...prev, 
          team: updatedTeam, 
          teamIds: updatedTeamIds,
          technicianId: prev.technicianId || user.uid,
          supervisorId: prev.supervisorId || user.uid, // Asegurar ID supervisor
          techName: prev.techName || userProfile.nombre_t || "",
          techRut: prev.techRut || (userProfile as any).rut_t || ""
        };
      });
    }
  }, [userProfile, user]);

  useEffect(() => {
    if (techProfiles && techProfiles.length > 0) {
      const tech = techProfiles[0];
      setFormData(prev => ({
        ...prev,
        techName: prev.techName || tech.nombre_t || "",
        techRut: prev.techRut || tech.rut_t || "",
        techSignatureUrl: prev.techSignatureUrl || tech.signatureUrl || "",
        technicianId: prev.technicianId || tech.id,
        supervisorId: prev.supervisorId || tech.id
      }));
    }
  }, [techProfiles]);

  const handleSelectClient = (client: any) => {
    setFormData({
      ...formData,
      clientName: client.nombreCliente || "",
      clientPhone: client.telefonoCliente || "",
      clientEmail: client.emailClientes || "",
      clientId: client.id,
      address: client.direccionCliente || ""
    });
    setOpenClientSearch(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, sketchImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, sketchImageUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
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
  
  const handleTeamRemove = (memberName: string, memberId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      team: prev.team.filter(t => t !== memberName),
      teamIds: prev.teamIds.filter(id => id !== memberId)
    }));
  };

  const handleSendRemoteSignature = async () => {
    if (!user || !db) return;
    if (!formData.clientReceiverEmail) {
      toast({ variant: "destructive", title: "Falta Email", description: "Ingrese el email del receptor." });
      return;
    }

    setIsSendingSignature(true);
    try {
      const orderId = doc(collection(db, "ordenes")).id;
      const currentFolio = folio || generateFolio();
      
      const workOrderData = {
        ...formData,
        id: orderId,
        folio: currentFolio,
        status: "Pending Signature",
        createdBy: user.uid,
        supervisorId: user.uid,
        creatorEmail: user.email || "",
        startDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDocumentNonBlocking(doc(db, "ordenes", orderId), workOrderData, { merge: true });

      const result = await sendSignatureRequest({
        orderId: orderId,
        recipientEmail: formData.clientReceiverEmail,
        clientName: formData.clientReceiverName || formData.clientName,
        folio: currentFolio,
        baseUrl: window.location.origin,
      });

      if (result.success) {
        toast({ title: "Solicitud Enviada", description: "Se ha enviado el enlace de firma remota." });
        router.push("/dashboard");
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
        setIsSendingSignature(false);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la solicitud." });
      setIsSendingSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    setLoading(true);

    const isValidationComplete = !!formData.techSignatureUrl && 
                                !!formData.clientSignatureUrl && 
                                !!formData.clientReceiverRut;
                                
    const finalStatus = isValidationComplete ? "Completed" : "Pending";
    const orderId = doc(collection(db, "ordenes")).id;
    
    const workOrderData = {
      ...formData,
      id: orderId,
      folio: folio || generateFolio(),
      status: finalStatus,
      createdBy: user.uid,
      supervisorId: user.uid,
      creatorEmail: user.email || "",
      startDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const targetCollection = finalStatus === "Completed" ? "historial" : "ordenes";
    const orderRef = doc(db, targetCollection, orderId);
    
    try {
      setDocumentNonBlocking(orderRef, workOrderData, { merge: true });
      
      if (finalStatus === "Completed" && formData.clientReceiverEmail) {
        sendWorkOrderEmail({
          recipientEmail: formData.clientReceiverEmail,
          clientName: formData.clientReceiverName || formData.clientName,
          folio: workOrderData.folio,
          orderDate: workOrderData.startDate,
          summary: formData.description,
          pdfLink: `${window.location.origin}/work-orders/${orderId}`
        }).catch(err => console.error("Error enviando email:", err));
      }

      toast({ title: "Orden Guardada", description: "La orden ha sido registrada correctamente." });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la información." });
    }
  };

  if (isUserLoading || isProfileLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
      <Loader2 className="h-10 w-10 animate-spin" />
      <p className="font-black tracking-tighter text-xl uppercase">Cargando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg text-primary uppercase tracking-tighter">Nueva OT #{folio || '...'}</h1>
          </div>
          <Button onClick={handleSendRemoteSignature} disabled={isSendingSignature || loading} variant="outline" className="h-10 px-4 font-bold uppercase text-xs border-primary text-primary">
            <Send className="h-4 w-4 mr-2" /> Firma Remota
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="bg-primary/5 p-4 border-b">
              <CardTitle className="text-primary text-xl flex items-center gap-2 uppercase font-black tracking-tighter">
                <User className="h-5 w-5" /> Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Nombre Cliente / Empresa</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nombre de la empresa" 
                      value={formData.clientName}
                      onChange={e => setFormData({...formData, clientName: e.target.value})}
                      className="h-14 text-base font-bold shadow-sm"
                    />
                    <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-14 w-14 bg-primary/5 border-primary/20">
                          <Search className="h-5 w-5 text-primary" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] md:w-[450px] p-0 shadow-2xl" align="end">
                        <Command className="rounded-xl">
                          <CommandInput placeholder="Filtrar por nombre..." className="h-12" />
                          <CommandList className="max-h-[400px]">
                            <CommandEmpty className="p-6 text-sm text-center">Sin resultados.</CommandEmpty>
                            <CommandGroup heading="Empresas Registradas" className="p-2">
                              {clients?.map((client) => (
                                <CommandItem key={client.id} onSelect={() => handleSelectClient(client)} className="flex items-center gap-3 p-3 cursor-pointer rounded-lg">
                                  <User className="h-5 w-5 text-primary" />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-primary">{client.nombreCliente}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{client.rutCliente}</span>
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
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Calle, Número, Comuna" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12 pl-10" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Teléfono</Label>
                    <Input placeholder="+56 9..." value={formData.clientPhone} onChange={e => setFormData({...formData, clientPhone: e.target.value})} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Email</Label>
                    <Input type="email" placeholder="ejemplo@correo.com" value={formData.clientEmail} onChange={e => setFormData({...formData, clientEmail: e.target.value})} className="h-12" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 md:p-6 border-b bg-muted/5">
              <CardTitle className="text-lg flex items-center gap-2 uppercase font-bold tracking-tight">
                <Users className="h-5 w-5 text-primary"/> Equipo de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
               <div className="flex flex-wrap gap-2">
                {formData.team.map((name, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1.5 px-4 rounded-xl bg-primary/10 text-primary gap-2 font-bold border-none">
                    {name}
                    {formData.teamIds[index] !== user?.uid && (
                      <button type="button" onClick={() => handleTeamRemove(name, formData.teamIds[index])} className="rounded-full hover:bg-primary/20 p-0.5 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              <Popover open={openTeamSearch} onOpenChange={setOpenTeamSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-12 text-sm font-black border-dashed border-2 uppercase tracking-widest">
                    <PlusCircle className="h-4 w-4 mr-2" /> Añadir Personal
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] md:w-[450px] p-0 shadow-2xl" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar colaborador..." className="h-12"/>
                    <CommandList>
                      <CommandEmpty className="p-4 text-sm text-center">Sin resultados.</CommandEmpty>
                      <CommandGroup heading="Personal ICSA" className="p-2">
                        {availablePersonnel.map(person => (
                          <CommandItem key={person.id} onSelect={() => handleTeamSelect(person)} className="p-3 cursor-pointer rounded-lg">
                            <User className="mr-3 h-5 w-5 text-primary" />
                            <div className="flex flex-col">
                              <span className="font-bold text-primary">{person.nombre_t}</span>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">{person.rol_t}</span>
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

          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b bg-primary/5">
              <CardTitle className="text-lg uppercase font-black text-primary tracking-tighter">Detalles Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Edificio</Label>
                  <Input value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Piso</Label>
                  <Input value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} className="h-12" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Tipo de Señal</Label>
                  <Select value={formData.signalType} onValueChange={v => setFormData({...formData, signalType: v})}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Simple">Simple</SelectItem>
                      <SelectItem value="Doble">Doble</SelectItem>
                      <SelectItem value="Triple">Triple</SelectItem>
                      <SelectItem value="Cuádruple">Cuádruple</SelectItem>
                      <SelectItem value="Fibra Óptica">Fibra Óptica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Cantidad</Label>
                  <Input type="number" value={formData.signalCount} onChange={e => setFormData({...formData, signalCount: parseInt(e.target.value) || 0})} className="h-12" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
                  <Label className="font-bold text-sm">¿Certificación?</Label>
                  <Switch checked={formData.isCert} onCheckedChange={(v) => setFormData({...formData, isCert: v})} />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
                  <Label className="font-bold text-sm">¿Rotulación?</Label>
                  <Switch checked={formData.isLabeled} onCheckedChange={(v) => setFormData({...formData, isLabeled: v})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Descripción de Trabajos</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-xl" />
              </div>

              <div className="space-y-4">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
                {!formData.sketchImageUrl ? (
                  <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 hover:bg-primary/5 transition-all cursor-pointer">
                    <Camera className="h-12 w-12 mb-2 opacity-40" />
                    <p className="text-sm font-black uppercase tracking-widest">Añadir Evidencia</p>
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted border shadow-lg group">
                    <Image src={formData.sketchImageUrl} alt="Preview" fill className="object-contain" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-10 w-10 rounded-full" onClick={removeImage}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 pb-6">
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Firmas Responsables</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="space-y-4">
                  <SignaturePad label="Firma del Técnico" onSave={(url) => setFormData({...formData, techSignatureUrl: url})} />
                  <SignaturePad label="Firma de Recepción (Cliente)" onSave={(url) => setFormData({...formData, clientSignatureUrl: url})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre Receptor</Label>
                    <Input value={formData.clientReceiverName} onChange={e => setFormData({...formData, clientReceiverName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">RUT Receptor</Label>
                    <Input value={formData.clientReceiverRut} onChange={e => setFormData({...formData, clientReceiverRut: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Email Receptor (Envío de PDF)</Label>
                    <Input type="email" value={formData.clientReceiverEmail} onChange={e => setFormData({...formData, clientReceiverEmail: e.target.value})} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
