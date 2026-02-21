
"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, CheckCircle2, Camera, X, Image as ImageIcon, Loader2, User, Phone, Mail, MapPin, Building2, Hash, Users, PlusCircle, CheckSquare, Send, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useUserProfile } from "@/firebase";
import { doc, collection, query, where, orderBy, setDoc } from "firebase/firestore";
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { sendWorkOrderEmail } from "@/ai/flows/send-work-order-email-flow";
import { sendSignatureRequest } from "@/ai/flows/send-signature-request-flow";

export default function EditWorkOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { userProfile, isProfileLoading } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const orderRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "ordenes", id);
  }, [db, id]);

  const { data: order, isLoading: isOrderLoading } = useDoc(orderRef);

  const personnelQuery = useMemoFirebase(() => {
    if (!db || !userProfile) return null;
    return query(collection(db, "personnel"), orderBy("nombre_t", "asc"));
  }, [db, userProfile]);
  const { data: allPersonnel } = useCollection(personnelQuery);

  const [loading, setLoading] = useState(false);
  const [isSendingSignature, setIsSendingSignature] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [openTeamSearch, setOpenTeamSearch] = useState(false);
  
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
    createdBy: "",
    technicianId: "",
  });

  // Cargar datos iniciales una sola vez al entrar
  useEffect(() => {
    if (order && !isInitialized) {
      if (order.status === "Completed") {
        toast({ variant: "destructive", title: "Orden Bloqueada", description: "Las órdenes completadas no pueden ser modificadas." });
        router.push(`/work-orders/${id}`);
        return;
      }

      setFormData({
        clientName: order.clientName || "",
        clientPhone: order.clientPhone || "",
        clientEmail: order.clientEmail || "",
        clientId: order.clientId || "",
        address: order.address || "",
        building: order.building || "",
        floor: order.floor || "",
        signalType: order.signalType || "Simple",
        signalCount: order.signalCount || 1,
        isCert: !!order.isCert,
        certifiedPointsCount: order.certifiedPointsCount || 0,
        isPlan: !!order.isPlan,
        isLabeled: !!order.isLabeled,
        labelDetails: order.labelDetails || "",
        isCanalized: !!order.isCanalized,
        description: order.description || "",
        techName: order.techName || "",
        techRut: order.techRut || "",
        techSignatureUrl: order.techSignatureUrl || "",
        clientReceiverName: order.clientReceiverName || "",
        clientReceiverRut: order.clientReceiverRut || "",
        clientReceiverEmail: order.clientReceiverEmail || "",
        clientSignatureUrl: order.clientSignatureUrl || "",
        sketchImageUrl: order.sketchImageUrl || "",
        status: order.status || "Pending",
        team: order.team || [],
        teamIds: order.teamIds || [],
        createdBy: order.createdBy || "",
        technicianId: order.technicianId || order.createdBy || "",
      });
      setIsInitialized(true);
    }
  }, [order, isInitialized, id, router, toast]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

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
      const result = await sendSignatureRequest({
        orderId: id,
        recipientEmail: formData.clientReceiverEmail,
        clientName: formData.clientReceiverName || formData.clientName,
        folio: order?.folio || 0,
        baseUrl: window.location.origin,
      });

      if (result.success) {
        toast({ title: "Solicitud Enviada", description: "Se ha enviado el enlace de firma remota." });
        router.push("/dashboard");
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo enviar la solicitud." });
    } finally {
      setIsSendingSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !id) return;
    
    setLoading(true);

    const isValidationComplete = !!formData.techSignatureUrl && 
                                !!formData.clientSignatureUrl && 
                                !!formData.clientReceiverRut;

    const finalStatus = isValidationComplete ? "Completed" : "Pending";

    const updateData = {
      ...formData,
      createdBy: formData.createdBy || user.uid,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email || ""
    };

    if (finalStatus === "Completed") {
      const historyRef = doc(db, "historial", id);
      const originalRef = doc(db, "ordenes", id);
      try {
        await setDoc(historyRef, updateData, { merge: true });
        deleteDocumentNonBlocking(originalRef);

        if (formData.clientReceiverEmail) {
          sendWorkOrderEmail({
            recipientEmail: formData.clientReceiverEmail,
            clientName: formData.clientReceiverName || formData.clientName,
            folio: order?.folio || 0,
            orderDate: updateData.updatedAt,
            summary: formData.description,
            pdfLink: `${window.location.origin}/work-orders/${id}`
          }).catch(err => console.error("Email error:", err));
        }

        toast({ title: "Orden Finalizada", description: "La orden se ha movido al historial." });
        router.push("/dashboard");
      } catch (error) {
        setLoading(false);
        toast({ variant: "destructive", title: "Error", description: "No se pudo finalizar la orden." });
      }
    } else {
      const docRef = doc(db, "ordenes", id);
      try {
        updateDocumentNonBlocking(docRef, updateData);
        toast({ title: "Avances Guardados", description: "La orden sigue pendiente." });
        router.push("/dashboard");
      } catch (error) {
        setLoading(false);
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la orden." });
      }
    }
  };

  if (isUserLoading || isOrderLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Cargando Orden...</p>
      </div>
    );
  }

  if (!order && !isOrderLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <AlertTriangle className="h-20 w-20 text-destructive" />
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-primary uppercase">No Encontrada</h1>
          <p className="text-muted-foreground font-medium">La orden de trabajo no existe o ya ha sido procesada.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="font-bold">Volver al Dashboard</Button>
        </Link>
      </div>
    );
  }

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
            <h1 className="font-bold text-lg text-primary uppercase tracking-tighter">Editar OT #{order?.folio}</h1>
          </div>
          <Button onClick={handleSendRemoteSignature} disabled={isSendingSignature || loading} variant="outline" className="h-10 px-4 font-bold uppercase text-xs border-primary text-primary">
            <Send className="h-4 w-4 mr-2" /> {isSendingSignature ? "Enviando..." : "Firma Remota"}
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
                  <Input 
                    value={formData.clientName}
                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                    className="h-14 text-base font-bold bg-muted/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Dirección del Cliente</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Teléfono</Label>
                    <Input value={formData.clientPhone} onChange={e => setFormData({...formData, clientPhone: e.target.value})} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Email</Label>
                    <Input value={formData.clientEmail} onChange={e => setFormData({...formData, clientEmail: e.target.value})} className="h-12" />
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
                        {(allPersonnel || []).map(person => (
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
              <CardTitle className="text-lg uppercase font-black text-primary tracking-tighter">Detalles Técnicos y Red</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-8">
              <div className="space-y-4 pt-2">
                <Label className="font-black uppercase text-xs tracking-[0.2em] text-primary flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Ubicación Técnica
                </Label>
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
              </div>

              <div className="space-y-4">
                <Label className="font-black uppercase text-xs tracking-[0.2em] text-primary flex items-center gap-2">
                  <Hash className="h-4 w-4" /> Configuración de Señal
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Tipo de Señal</Label>
                    <Select value={formData.signalType} onValueChange={v => setFormData({...formData, signalType: v})}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Señal" />
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
              </div>

              <div className="space-y-6">
                <Label className="font-black uppercase text-xs tracking-[0.2em] text-primary flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> Checklist
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-dashed">
                    <Label className="font-bold text-sm">¿Certificación?</Label>
                    <Switch checked={formData.isCert} onCheckedChange={(v) => setFormData({...formData, isCert: v})} />
                  </div>
                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-dashed">
                    <Label className="font-bold text-sm">¿Rotulación?</Label>
                    <Switch checked={formData.isLabeled} onCheckedChange={(v) => setFormData({...formData, isLabeled: v})} />
                  </div>
                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-dashed">
                    <Label className="font-bold text-sm">¿Canalización?</Label>
                    <Switch checked={formData.isCanalized} onCheckedChange={(v) => setFormData({...formData, isCanalized: v})} />
                  </div>
                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-dashed">
                    <Label className="font-bold text-sm">¿Planos?</Label>
                    <Switch checked={formData.isPlan} onCheckedChange={(v) => setFormData({...formData, isPlan: v})} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Descripción de Trabajos</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[140px] rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b bg-muted/5">
              <CardTitle className="text-lg flex items-center gap-2 uppercase font-bold tracking-tight">
                <ImageIcon className="h-5 w-5 text-primary" /> Multimedia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
              {!formData.sketchImageUrl ? (
                <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 hover:bg-primary/5 transition-all cursor-pointer">
                  <Camera className="h-16 w-16 mb-4 opacity-40" />
                  <p className="text-sm font-black uppercase tracking-widest">Capturar Evidencia</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted group border shadow-xl">
                    <Image src={formData.sketchImageUrl} alt="Preview" fill className="object-contain" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4 h-12 w-12 rounded-full shadow-2xl" onClick={removeImage}>
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 pb-6">
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Técnico Responsable</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre</Label>
                    <Input value={formData.techName} onChange={e => setFormData({...formData, techName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">RUT</Label>
                    <Input value={formData.techRut} onChange={e => setFormData({...formData, techRut: e.target.value})} />
                  </div>
                </div>
                {formData.techSignatureUrl ? (
                  <div className="relative h-40 w-full bg-muted/20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden">
                    <Image src={formData.techSignatureUrl} alt="Firma Técnico" fill className="object-contain" />
                  </div>
                ) : (
                  <SignaturePad label="Firma del Técnico" onSave={(url) => setFormData({...formData, techSignatureUrl: url})} />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Recepción Terreno</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre</Label>
                    <Input value={formData.clientReceiverName} onChange={e => setFormData({...formData, clientReceiverName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">RUT</Label>
                    <Input value={formData.clientReceiverRut} onChange={e => setFormData({...formData, clientReceiverRut: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Email (para PDF)</Label>
                    <Input type="email" value={formData.clientReceiverEmail} onChange={e => setFormData({...formData, clientReceiverEmail: e.target.value})} />
                  </div>
                </div>
                {formData.clientSignatureUrl ? (
                  <div className="relative h-40 w-full bg-muted/20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden">
                    <Image src={formData.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain" />
                  </div>
                ) : (
                  <SignaturePad label="Firma de Recepción" onSave={(url) => setFormData({...formData, clientSignatureUrl: url})} />
                )}
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
