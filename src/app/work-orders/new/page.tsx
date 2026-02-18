
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
import { ArrowLeft, Save, Camera, CheckCircle2, Search, X, Image as ImageIcon, User, Phone, Mail, MapPin, Building2, Hash, Users, PlusCircle, Loader2, CheckSquare } from "lucide-react";
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
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary h-10 px-4 font-bold uppercase text-xs">
            <Save className="h-4 w-4 mr-2" /> Guardar
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
                                <CommandItem 
                                  key={client.id} 
                                  onSelect={() => handleSelectClient(client)}
                                  className="flex items-center gap-3 p-3 cursor-pointer rounded-lg"
                                >
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
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Dirección del Cliente</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Calle, Número, Comuna" 
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Número de Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="+56 9..." 
                        value={formData.clientPhone}
                        onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email"
                        placeholder="ejemplo@correo.com" 
                        value={formData.clientEmail}
                        onChange={e => setFormData({...formData, clientEmail: e.target.value})}
                        className="h-12 pl-10"
                      />
                    </div>
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
            <CardHeader className="bg-secondary/10 p-4 border-b">
              <CardTitle className="text-primary text-lg flex items-center gap-2 uppercase font-black tracking-tighter">
                <Building2 className="h-5 w-5" /> Ubicación Técnica
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Edificio</Label>
                  <Input 
                    placeholder="Ej: Torre A" 
                    value={formData.building}
                    onChange={e => setFormData({...formData, building: e.target.value})}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Piso</Label>
                  <Input 
                    placeholder="Ej: 5" 
                    value={formData.floor}
                    onChange={e => setFormData({...formData, floor: e.target.value})}
                    className="h-12"
                  />
                </div>
              </div>
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
                    <SelectTrigger className="h-12">
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
                  <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Cantidad</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={formData.signalCount}
                    onChange={e => setFormData({...formData, signalCount: parseInt(e.target.value) || 0})}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <Label className="font-black uppercase text-xs tracking-[0.2em] text-primary flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" /> Checklist Técnico
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-4 p-5 bg-muted/30 rounded-2xl border border-dashed">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-sm">¿Certificación Realizada?</Label>
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
                      <Label className="font-bold text-sm">¿Rotulación Realizada?</Label>
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
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Descripción de Trabajos</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[140px] rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 border-b bg-muted/5">
              <CardTitle className="text-lg flex items-center gap-2 uppercase font-bold tracking-tight">
                <ImageIcon className="h-5 w-5 text-primary" /> Multimedia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
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
                  <Button type="button" variant="outline" className="w-full h-14 font-black uppercase tracking-widest rounded-2xl" onClick={() => fileInputRef.current?.click()}>
                    Reemplazar Imagen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 pb-6">
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center justify-between text-primary">
                  Técnico Responsable
                  {hasSavedSignature && <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px]">Firma Autorizada</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre Técnico</Label>
                    <Input value={formData.techName} onChange={e => setFormData({...formData, techName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">RUT Técnico</Label>
                    <Input value={formData.techRut} onChange={e => setFormData({...formData, techRut: e.target.value})} />
                  </div>
                </div>
                {formData.techSignatureUrl ? (
                  <div className="relative h-40 w-full bg-muted/20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden">
                    <Image src={formData.techSignatureUrl} alt="Firma Técnico" fill className="object-contain" />
                  </div>
                ) : (
                  <SignaturePad label="Firma del Técnico" onSave={handleTechSignatureConfirm} />
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
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre Receptor</Label>
                    <Input value={formData.clientReceiverName} onChange={e => setFormData({...formData, clientReceiverName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">RUT Receptor</Label>
                    <Input value={formData.clientReceiverRut} onChange={e => setFormData({...formData, clientReceiverRut: e.target.value})} />
                  </div>
                </div>
                {formData.clientSignatureUrl ? (
                  <div className="relative h-40 w-full bg-muted/20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden">
                    <Image src={formData.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain" />
                  </div>
                ) : (
                  <SignaturePad label="Firma de Recepción" onSave={(dataUrl) => setFormData({...formData, clientSignatureUrl: dataUrl})} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t md:relative md:bg-transparent md:border-none md:p-0 z-50">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 w-full h-16 text-xl font-black gap-3 shadow-xl active:scale-95 transition-all rounded-2xl uppercase tracking-tighter" disabled={loading}>
              <CheckCircle2 size={28} /> Finalizar y Cerrar OT
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
