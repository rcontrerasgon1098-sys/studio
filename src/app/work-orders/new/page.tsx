
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Camera, CheckCircle2, Clock, Search, X, Image as ImageIcon, User, CreditCard, Sparkles, UserCheck, Users, PlusCircle, Loader2, Building2, MapPin, Hash, CheckSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserProfile } from "@/firebase";
import { collection, doc, query, orderBy, where } from "firebase/firestore";
import { setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function NewWorkOrder() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { userProfile, isProfileLoading } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState(0);
  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [openTeamSearch, setOpenTeamSearch] = useState(false);
  const [showSaveSignatureDialog, setShowSaveSignatureDialog] = useState(false);
  const [tempSignature, setTempSignature] = useState("");

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

  // Automatic addition of the current supervisor to the team
  useEffect(() => {
    if (userProfile?.nombre_t) {
      setFormData(prev => {
        if (!prev.team.includes(userProfile.nombre_t!)) {
          return { ...prev, team: [...prev.team, userProfile.nombre_t!] };
        }
        return prev;
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (techProfiles && techProfiles.length > 0) {
      const tech = techProfiles[0];
      setFormData(prev => ({
        ...prev,
        techName: prev.techName || tech.nombre_t || "",
        techRut: prev.techRut || tech.rut_t || "",
        techSignatureUrl: prev.techSignatureUrl || tech.signatureUrl || ""
      }));
      
      if (tech.signatureUrl && !formData.techSignatureUrl) {
        toast({
          title: "Firma cargada",
          description: "Se ha aplicado su firma digital guardada en el perfil.",
          icon: <Sparkles className="h-4 w-4 text-accent" />
        });
      }
    }
  }, [techProfiles, toast, formData.techSignatureUrl]);

  const handleSelectClient = (client: any) => {
    const email = client.emailClientes || "";
    const phone = client.telefonoCliente || "";
    const contactInfo = [email, phone].filter(Boolean).join(" / ");

    setFormData({
      ...formData,
      clientName: client.nombreCliente || "",
      clientContact: contactInfo,
      clientId: client.id,
      address: client.direccionCliente || ""
    });
    setOpenClientSearch(false);
    toast({
      title: "Cliente Seleccionado",
      description: `Se han cargado los datos de ${client.nombreCliente}`
    });
  };

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
    if (!user || !db) return;
    
    setLoading(true);

    if (!formData.clientName) {
      toast({ variant: "destructive", title: "Cliente Requerido", description: "Por favor ingrese o seleccione un cliente." });
      setLoading(false);
      return;
    }

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
    const orderId = doc(collection(db, "ordenes")).id;
    
    const workOrderData = {
      ...formData,
      id: orderId,
      folio: folio || generateFolio(),
      status: finalStatus,
      createdBy: user.uid,
      creatorEmail: user.email,
      startDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const targetCollection = finalStatus === "Completed" ? "historial" : "ordenes";
    const orderRef = doc(db, targetCollection, orderId);
    
    try {
      setDocumentNonBlocking(orderRef, workOrderData, { merge: true });
      toast({ 
        title: finalStatus === "Completed" ? "Orden Finalizada" : "Orden Guardada", 
        description: finalStatus === "Completed" 
          ? "La orden se ha movido al historial correctamente." 
          : "La orden se guardó como pendiente."
      });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la orden." });
    }
  };

  const hasSavedSignature = techProfiles && techProfiles.length > 0 && !!techProfiles[0].signatureUrl;
  const availablePersonnel = allPersonnel?.filter(p => !formData.team.includes(p.nombre_t)) || [];

  if (isUserLoading || isProfileLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
      <Loader2 className="h-10 w-10 animate-spin" />
      <p className="font-black tracking-tighter text-xl uppercase">Cargando perfil...</p>
    </div>
  );

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
            <h1 className="font-bold text-lg md:text-xl text-primary truncate max-w-[180px] md:max-w-none uppercase tracking-tighter">Nueva OT #{folio || '...'}</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-4 md:px-6 font-bold uppercase text-xs">
            <Save className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Guardar Orden</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="bg-secondary/20 p-4 border-b">
              <CardTitle className="text-primary text-xl flex items-center gap-2 uppercase font-black tracking-tighter">
                <Users className="h-5 w-5" /> Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Cliente / Empresa</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Buscar empresa..." 
                      value={formData.clientName}
                      onChange={e => setFormData({...formData, clientName: e.target.value})}
                      className="h-14 text-base font-bold shadow-sm"
                    />
                    <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-14 w-14 shrink-0 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                          <Search className="h-5 w-5 text-primary" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] md:w-[450px] p-0 shadow-2xl border-primary/10" align="end">
                        <Command className="rounded-xl">
                          <CommandInput placeholder="Filtrar por nombre..." className="h-12" />
                          <CommandList className="max-h-[400px]">
                            <CommandEmpty className="p-6 text-sm text-center text-muted-foreground">Sin resultados.</CommandEmpty>
                            <CommandGroup heading="Empresas Registradas" className="p-2">
                              {clients?.map((client) => (
                                <CommandItem 
                                  key={client.id} 
                                  value={client.nombreCliente} 
                                  onSelect={() => handleSelectClient(client)}
                                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/5 rounded-lg transition-colors"
                                >
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex flex-col flex-1">
                                    <span className="font-black text-primary text-base">{client.nombreCliente}</span>
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase">{client.rutCliente}</span>
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
                  <Label htmlFor="address" className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Dirección del Servicio</Label>
                  <Input 
                    id="address" 
                    placeholder="Dirección completa" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="h-14 text-base shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="building" className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Edificio</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="building" 
                      placeholder="Ej: Torre A / Central" 
                      value={formData.building}
                      onChange={e => setFormData({...formData, building: e.target.value})}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor" className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Piso</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="floor" 
                      placeholder="Ej: 4 / Subterráneo" 
                      value={formData.floor}
                      onChange={e => setFormData({...formData, floor: e.target.value})}
                      className="h-12 pl-10"
                    />
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
              <CardDescription className="text-xs uppercase font-medium text-muted-foreground/60">Asignación de personal operativo</CardDescription>
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
                  <Button variant="outline" className="w-full h-12 text-sm font-black border-dashed border-2 hover:bg-primary/5 transition-all uppercase tracking-widest">
                    <PlusCircle className="h-4 w-4 mr-2" /> Añadir Personal al Equipo
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] md:w-[450px] p-0 shadow-2xl" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar colaborador..." className="h-12"/>
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
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Tipo de Señal</Label>
                  <Select value={formData.signalType} onValueChange={v => setFormData({...formData, signalType: v})}>
                    <SelectTrigger className="h-12 shadow-sm">
                      <SelectValue placeholder="Seleccionar señal" />
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
                  <Label htmlFor="signalCount" className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Cantidad</Label>
                  <Input 
                    id="signalCount" 
                    type="number"
                    min="1"
                    value={formData.signalCount}
                    onChange={e => setFormData({...formData, signalCount: parseInt(e.target.value) || 0})}
                    className="h-12 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <Label className="font-black uppercase text-xs tracking-[0.2em] text-primary flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> Checklist de Instalación
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-4 p-5 bg-muted/30 rounded-2xl border border-dashed transition-all hover:border-primary/40">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="cert" className="font-bold text-sm cursor-pointer">¿Certificación Realizada?</Label>
                      <Switch 
                        id="cert" 
                        checked={formData.isCert}
                        onCheckedChange={(v) => setFormData({...formData, isCert: v})}
                      />
                    </div>
                    {formData.isCert && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Puntos Certificados</Label>
                        <Input 
                          type="number" 
                          placeholder="Cantidad de puntos" 
                          value={formData.certifiedPointsCount}
                          onChange={e => setFormData({...formData, certifiedPointsCount: parseInt(e.target.value) || 0})}
                          className="h-10 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 p-5 bg-muted/30 rounded-2xl border border-dashed transition-all hover:border-primary/40">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="labeled" className="font-bold text-sm cursor-pointer">¿Rotulación Realizada?</Label>
                      <Switch 
                        id="labeled" 
                        checked={formData.isLabeled}
                        onCheckedChange={(v) => setFormData({...formData, isLabeled: v})}
                      />
                    </div>
                    {formData.isLabeled && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Detalle de Rótulos</Label>
                        <Input 
                          placeholder="Ej: A01, A02, B01..." 
                          value={formData.labelDetails}
                          onChange={e => setFormData({...formData, labelDetails: e.target.value})}
                          className="h-10 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-dashed transition-all hover:border-primary/40">
                    <Label htmlFor="canalized" className="font-bold text-sm cursor-pointer">¿Canalización Realizada?</Label>
                    <Switch 
                      id="canalized" 
                      checked={formData.isCanalized}
                      onCheckedChange={(v) => setFormData({...formData, isCanalized: v})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-dashed transition-all hover:border-primary/40">
                    <Label htmlFor="plan" className="font-bold text-sm cursor-pointer">¿Planos Actualizados?</Label>
                    <Switch 
                      id="plan" 
                      checked={formData.isPlan}
                      onCheckedChange={(v) => setFormData({...formData, isPlan: v})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Descripción Adicional de Trabajos</Label>
                <Textarea 
                  placeholder="Describa el detalle de las actividades realizadas..." 
                  className="min-h-[140px] shadow-sm rounded-xl"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 border-b bg-muted/5">
              <CardTitle className="text-lg flex items-center gap-2 uppercase font-bold tracking-tight">
                <ImageIcon className="h-5 w-5 text-primary" /> Multimedia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
              {!formData.sketchImageUrl ? (
                <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer active:scale-95 group">
                  <Camera className="h-16 w-16 mb-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                  <p className="text-sm font-black uppercase tracking-[0.2em]">Capturar Evidencia Visual</p>
                  <p className="text-[10px] mt-2 opacity-60">Foto del bosquejo, terreno o canalización</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted group border shadow-2xl">
                    <Image src={formData.sketchImageUrl} alt="Preview" fill className="object-contain" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4 h-12 w-12 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity" onClick={removeImage}>
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                  <Button type="button" variant="outline" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="h-5 w-5 mr-2" /> Reemplazar Imagen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 pb-6">
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center justify-between text-primary">
                  Validación Técnico Responsable
                  {hasSavedSignature && <Badge variant="secondary" className="bg-primary/10 text-primary border-none gap-1 font-bold text-[9px]"><UserCheck size={10} /> Firma Autorizada</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1"><User className="h-3 w-3" /> Nombre Técnico</Label>
                    <Input placeholder="Nombre completo" value={formData.techName} onChange={e => setFormData({...formData, techName: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1"><CreditCard className="h-3 w-3" /> RUT Técnico</Label>
                    <Input placeholder="RUT" value={formData.techRut} onChange={e => setFormData({...formData, techRut: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                </div>
                {formData.techSignatureUrl ? (
                  <div className="space-y-2">
                    <div className="relative h-40 w-full bg-muted/20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden">
                      <Image src={formData.techSignatureUrl} alt="Firma Técnico" fill className="object-contain" />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({...formData, techSignatureUrl: ""})} className="w-full text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cambiar Firma</Button>
                  </div>
                ) : (
                  <SignaturePad label="Firma del Técnico" onSave={handleTechSignatureConfirm} />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">Conformidad de Recepción</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1"><User className="h-3 w-3" /> Nombre Receptor</Label>
                    <Input placeholder="Nombre cliente" value={formData.clientReceiverName} onChange={e => setFormData({...formData, clientReceiverName: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1"><CreditCard className="h-3 w-3" /> RUT Receptor</Label>
                    <Input placeholder="RUT (Requerido para finalizar)" value={formData.clientReceiverRut} onChange={e => setFormData({...formData, clientReceiverRut: e.target.value})} className={`h-12 rounded-xl ${!formData.clientReceiverRut ? "border-primary/20" : "border-primary"}`} />
                  </div>
                </div>
                {formData.clientSignatureUrl ? (
                  <div className="space-y-2">
                    <div className="relative h-40 w-full bg-muted/20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden">
                      <Image src={formData.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain" />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({...formData, clientSignatureUrl: ""})} className="w-full text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cambiar Firma</Button>
                  </div>
                ) : (
                  <SignaturePad label="Firma de Recepción" onSave={(dataUrl) => setFormData({...formData, clientSignatureUrl: dataUrl})} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t md:relative md:bg-transparent md:border-none md:p-0 z-50">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 w-full h-16 text-xl font-black gap-3 shadow-[0_10px_40px_rgba(56,163,165,0.4)] active:scale-95 transition-all rounded-2xl uppercase tracking-tighter" disabled={loading}>
              <CheckCircle2 size={28} /> {!!formData.techSignatureUrl && !!formData.clientSignatureUrl && !!formData.clientReceiverRut ? "Cerrar y Finalizar OT" : "Guardar Avances"}
            </Button>
          </div>
        </form>
      </main>

      <AlertDialog open={showSaveSignatureDialog} onOpenChange={setShowSaveSignatureDialog}>
        <AlertDialogContent className="rounded-3xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-black uppercase tracking-tighter text-2xl">¿Guardar Firma?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">¿Desea guardar esta firma para aplicarla automáticamente en sus futuras órdenes de trabajo?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3 pt-6">
            <AlertDialogCancel className="h-14 font-black uppercase tracking-widest rounded-2xl" onClick={() => { setFormData({...formData, techSignatureUrl: tempSignature}); setShowSaveSignatureDialog(false); }}>Solo hoy</AlertDialogCancel>
            <AlertDialogAction className="h-14 bg-primary font-black uppercase tracking-widest rounded-2xl" onClick={saveSignatureToProfile}>Guardar Firma</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
