
"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, CheckCircle2, Camera, X, Image as ImageIcon, Loader2, User, CreditCard, Sparkles, UserCheck, Users, PlusCircle, Building2, MapPin, Hash, CheckSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useUserProfile } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { validateRut } from "@/lib/rut-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";

export default function EditWorkOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { userProfile, isProfileLoading } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openTeamSearch, setOpenTeamSearch] = useState(false);
  
  const orderRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "ordenes", id);
  }, [db, id]);

  const { data: order, isLoading: isOrderLoading } = useDoc(orderRef);

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

  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSaveSignatureDialog, setShowSaveSignatureDialog] = useState(false);
  const [tempSignature, setTempSignature] = useState("");
  
  const [formData, setFormData] = useState({
    clientName: "",
    clientContact: "",
    clientId: "",
    signalType: "Simple",
    signalCount: 1,
    isCert: false,
    certifiedPointsCount: 0,
    isPlan: false,
    isLabeled: false,
    labelDetails: "",
    isCanalized: false,
    connectionSwitch: false,
    hubConnection: false,
    address: "",
    building: "",
    floor: "",
    cdsCanalization: "",
    description: "",
    techName: "",
    techRut: "",
    techSignatureUrl: "",
    clientReceiverName: "",
    clientReceiverRut: "",
    clientSignatureUrl: "",
    sketchImageUrl: "",
    status: "Pending",
    team: [] as string[],
    createdBy: "",
  });

  useEffect(() => {
    if (order && !isInitialized) {
      if (order.status === "Completed") {
        toast({ variant: "destructive", title: "Orden Bloqueada", description: "Las órdenes completadas no pueden ser modificadas." });
        router.push(`/work-orders/${id}`);
        return;
      }

      setFormData({
        clientName: order.clientName || "",
        clientContact: order.clientContact || "",
        clientId: order.clientId || "",
        signalType: order.signalType || "Simple",
        signalCount: order.signalCount || 1,
        isCert: !!order.isCert,
        certifiedPointsCount: order.certifiedPointsCount || 0,
        isPlan: !!order.isPlan,
        isLabeled: !!order.isLabeled,
        labelDetails: order.labelDetails || "",
        isCanalized: !!order.isCanalized,
        connectionSwitch: !!order.connectionSwitch,
        hubConnection: !!order.hubConnection,
        address: order.address || order.location || "", // Migration fallback
        building: order.building || "",
        floor: order.floor || "",
        cdsCanalization: order.cdsCanalization || "",
        description: order.description || "",
        techName: order.techName || "",
        techRut: order.techRut || "",
        techSignatureUrl: order.techSignatureUrl || "",
        clientReceiverName: order.clientReceiverName || "",
        clientReceiverRut: order.clientReceiverRut || "",
        clientSignatureUrl: order.clientSignatureUrl || "",
        sketchImageUrl: order.sketchImageUrl || "",
        status: order.status || "Pending",
        team: order.team || [],
        createdBy: order.createdBy || "",
      });
      setIsInitialized(true);
    }
  }, [order, isInitialized, id, router, toast]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // Automatic addition of the current supervisor if not in team
  useEffect(() => {
    if (userProfile?.nombre_t && isInitialized) {
      setFormData(prev => {
        if (!prev.team.includes(userProfile.nombre_t!)) {
          return { ...prev, team: [...prev.team, userProfile.nombre_t!] };
        }
        return prev;
      });
    }
  }, [userProfile, isInitialized]);

  useEffect(() => {
    if (techProfiles && techProfiles.length > 0 && isInitialized) {
      const tech = techProfiles[0];
      setFormData(prev => ({
        ...prev,
        techName: prev.techName || tech.nombre_t || "",
        techRut: prev.techRut || tech.rut_t || "",
        techSignatureUrl: prev.techSignatureUrl || tech.signatureUrl || ""
      }));
    }
  }, [techProfiles, isInitialized]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Archivo muy grande", description: "El tamaño máximo es de 5MB." });
        return;
      }
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

  const handleTechSignatureConfirm = (dataUrl: string) => {
    const hasSavedSignature = techProfiles && techProfiles.length > 0 && !!techProfiles[0].signatureUrl;
    if (!hasSavedSignature) {
      setTempSignature(dataUrl);
      setShowSaveSignatureDialog(true);
    } else {
      setFormData({...formData, techSignatureUrl: dataUrl});
    }
  };

  const saveSignatureToProfile = () => {
    if (db && techProfiles && techProfiles.length > 0) {
      const techRef = doc(db, "personnel", techProfiles[0].id);
      updateDocumentNonBlocking(techRef, { signatureUrl: tempSignature });
      toast({ title: "Firma Guardada", description: "Su firma se cargará automáticamente en el futuro." });
    }
    setFormData({...formData, techSignatureUrl: tempSignature});
    setShowSaveSignatureDialog(false);
  };

  const handleTeamSelect = (person: any) => {
    if (!formData.team.find(t => t === person.nombre_t)) {
      setFormData(prev => ({ ...prev, team: [...prev.team, person.nombre_t] }));
    }
    setOpenTeamSearch(false);
  };
  
  const handleTeamRemove = (memberName: string) => {
    setFormData(prev => ({ ...prev, team: prev.team.filter(t => t !== memberName) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !id) return;
    
    setLoading(true);

    if (formData.techRut && !validateRut(formData.techRut)) {
      toast({ variant: "destructive", title: "RUT Técnico Inválido", description: "El RUT del técnico no es correcto." });
      setLoading(false);
      return;
    }

    if (formData.clientReceiverRut && !validateRut(formData.clientReceiverRut)) {
      toast({ variant: "destructive", title: "RUT Receptor Inválido", description: "El RUT de quien recibe no es correcto." });
      setLoading(false);
      return;
    }

    const isValidationComplete = !!formData.techSignatureUrl && 
                                !!formData.clientSignatureUrl && 
                                !!formData.clientReceiverRut;

    const finalStatus = isValidationComplete ? "Completed" : "Pending";

    const updateData = {
      ...formData,
      createdBy: formData.createdBy || user.uid,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email
    };

    if (finalStatus === "Completed") {
      const historyRef = doc(db, "historial", id);
      const originalRef = doc(db, "ordenes", id);
      try {
        setDocumentNonBlocking(historyRef, updateData, { merge: true });
        deleteDocumentNonBlocking(originalRef);
        toast({ title: "Orden Finalizada", description: "La orden se ha movido al historial con éxito." });
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

  const hasSavedSignature = techProfiles && techProfiles.length > 0 && !!techProfiles[0].signatureUrl;
  const availablePersonnel = allPersonnel?.filter(p => !formData.team.includes(p.nombre_t)) || [];

  if (isUserLoading || isOrderLoading || !isInitialized || isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg md:text-xl text-primary truncate uppercase tracking-tighter">Editar OT #{order?.folio}</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-4 md:px-6 font-bold uppercase text-xs">
            <Save className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">{loading ? "Guardando..." : "Guardar"}</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="bg-secondary/20 p-4 border-b">
              <CardTitle className="text-primary text-xl uppercase font-black tracking-tighter">Información del Servicio</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="font-bold uppercase text-xs text-muted-foreground">Cliente / Empresa</Label>
                  <Input 
                    id="clientName"
                    value={formData.clientName}
                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                    className="h-14 text-base font-bold bg-muted/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="font-bold uppercase text-xs text-muted-foreground">Dirección del Servicio</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="h-14 text-base shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="building" className="font-bold uppercase text-xs text-muted-foreground">Edificio</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="building" value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})} className="h-12 pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor" className="font-bold uppercase text-xs text-muted-foreground">Piso</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="floor" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} className="h-12 pl-10" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 md:p-6 border-b bg-muted/5">
              <CardTitle className="text-lg flex items-center gap-2 uppercase font-bold"><Users className="h-5 w-5 text-primary"/> Equipo de Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
               <div className="flex flex-wrap gap-2">
                {formData.team.map((name, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1.5 px-4 rounded-xl bg-primary/10 text-primary gap-2 font-bold border-none">
                    {name}
                    {name !== userProfile?.nombre_t && (
                      <button type="button" onClick={() => handleTeamRemove(name)} className="rounded-full hover:bg-primary/20 p-0.5 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              <Popover open={openTeamSearch} onOpenChange={setOpenTeamSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-12 text-sm font-black border-dashed border-2 uppercase tracking-widest">
                    <PlusCircle className="h-4 w-4 mr-2" /> Agregar Personal
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] md:w-[450px] p-0 shadow-2xl" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar personal..." className="h-12"/>
                    <CommandList>
                      <CommandEmpty className="p-4 text-sm">Sin resultados.</CommandEmpty>
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
              <CardTitle className="text-lg uppercase font-black text-primary tracking-tighter">Detalles Técnicos y Red</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-bold uppercase text-xs text-muted-foreground">Tipo de Señal</Label>
                  <Select value={formData.signalType} onValueChange={v => setFormData({...formData, signalType: v})}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Señal" /></SelectTrigger>
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
                  <Label htmlFor="signalCount" className="font-bold uppercase text-xs text-muted-foreground">Cantidad</Label>
                  <Input id="signalCount" type="number" min="1" value={formData.signalCount} onChange={e => setFormData({...formData, signalCount: parseInt(e.target.value) || 0})} className="h-12" />
                </div>
              </div>

              <div className="space-y-6">
                <Label className="font-black uppercase text-xs tracking-[0.2em] text-primary flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Checklist</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-4 p-5 bg-muted/30 rounded-2xl border border-dashed">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-sm">¿Certificación?</Label>
                      <Switch checked={formData.isCert} onCheckedChange={(v) => setFormData({...formData, isCert: v})} />
                    </div>
                    {formData.isCert && (
                      <div className="space-y-2 animate-in fade-in">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Puntos Certificados</Label>
                        <Input type="number" value={formData.certifiedPointsCount} onChange={e => setFormData({...formData, certifiedPointsCount: parseInt(e.target.value) || 0})} className="h-10 bg-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-4 p-5 bg-muted/30 rounded-2xl border border-dashed">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-sm">¿Rotulación?</Label>
                      <Switch checked={formData.isLabeled} onCheckedChange={(v) => setFormData({...formData, isLabeled: v})} />
                    </div>
                    {formData.isLabeled && (
                      <div className="space-y-2 animate-in fade-in">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Detalle de Rótulos</Label>
                        <Input value={formData.labelDetails} onChange={e => setFormData({...formData, labelDetails: e.target.value})} className="h-10 bg-white" />
                      </div>
                    )}
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
                <Label className="font-bold uppercase text-xs text-muted-foreground">Descripción Adicional</Label>
                <Textarea className="min-h-[140px] rounded-xl" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 border-b bg-muted/5">
              <CardTitle className="text-lg flex items-center gap-2 uppercase font-bold"><ImageIcon className="h-5 w-5 text-primary" /> Multimedia</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
              {!formData.sketchImageUrl ? (
                <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 hover:bg-primary/5 transition-all cursor-pointer">
                  <Camera className="h-12 w-12 mb-4 opacity-40" />
                  <p className="text-sm font-black uppercase tracking-widest">Capturar Evidencia</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted group border shadow-xl">
                    <Image src={formData.sketchImageUrl} alt="Preview" fill className="object-contain" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full" onClick={removeImage}><X className="h-5 w-5" /></Button>
                  </div>
                  <Button type="button" variant="outline" className="w-full h-12 font-bold uppercase rounded-xl" onClick={() => fileInputRef.current?.click()}>Cambiar Imagen</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 pb-6">
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center justify-between">Técnico Responsable {hasSavedSignature && <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px]">Firma OK</Badge>}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Nombre</Label><Input value={formData.techName} onChange={e => setFormData({...formData, techName: e.target.value})} /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">RUT</Label><Input value={formData.techRut} onChange={e => setFormData({...formData, techRut: e.target.value})} /></div>
                </div>
                {formData.techSignatureUrl ? (
                  <div className="relative h-32 w-full bg-muted/10 rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                    <Image src={formData.techSignatureUrl} alt="Firma" fill className="object-contain" />
                  </div>
                ) : (
                  <SignaturePad label="Firma Técnico" onSave={handleTechSignatureConfirm} />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Recepción Terreno</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Receptor</Label><Input value={formData.clientReceiverName} onChange={e => setFormData({...formData, clientReceiverName: e.target.value})} /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">RUT Receptor</Label><Input value={formData.clientReceiverRut} onChange={e => setFormData({...formData, clientReceiverRut: e.target.value})} /></div>
                </div>
                {formData.clientSignatureUrl ? (
                  <div className="relative h-32 w-full bg-muted/10 rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                    <Image src={formData.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain" />
                  </div>
                ) : (
                  <SignaturePad label="Firma Recepción" onSave={(dataUrl) => setFormData({...formData, clientSignatureUrl: dataUrl})} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t md:relative md:bg-transparent md:border-none md:p-0 z-50">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 w-full h-16 text-xl font-black gap-3 shadow-xl active:scale-95 rounded-2xl uppercase" disabled={loading}>
              <CheckCircle2 size={28} /> Finalizar y Cerrar OT
            </Button>
          </div>
        </form>
      </main>

      <AlertDialog open={showSaveSignatureDialog} onOpenChange={setShowSaveSignatureDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black">¿Guardar Firma?</AlertDialogTitle>
            <AlertDialogDescription>Guardar para uso automático en el futuro.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-12 uppercase font-bold" onClick={() => { setFormData({...formData, techSignatureUrl: tempSignature}); setShowSaveSignatureDialog(false); }}>Solo hoy</AlertDialogCancel>
            <AlertDialogAction className="h-12 bg-primary uppercase font-bold" onClick={saveSignatureToProfile}>Guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
