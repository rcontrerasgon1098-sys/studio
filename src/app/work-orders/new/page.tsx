
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
import { ArrowLeft, Save, Camera, CheckCircle2, Clock, Search, X, Image as ImageIcon, User, CreditCard, Sparkles, UserCheck, Users, PlusCircle, Loader2 } from "lucide-react";
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
  
  const isSupervisor = userProfile?.role === 'supervisor';
  const isAdmin = userProfile?.role === 'admin';

  const personnelQuery = useMemoFirebase(() => {
    if (!db || (!isAdmin && !isSupervisor)) return null;
    return query(collection(db, "personnel"), orderBy("nombre_t", "asc"));
  }, [db, isAdmin, isSupervisor]);
  const { data: allPersonnel } = useCollection(personnelQuery);

  const [formData, setFormData] = useState({
    clientName: "",
    clientContact: "",
    clientId: "",
    signalType: "Simple",
    isCert: false,
    isPlan: false,
    connectionSwitch: false,
    hubConnection: false,
    location: "",
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
      location: client.direccionCliente || ""
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
        toast({
          variant: "destructive",
          title: "Archivo muy grande",
          description: "El tamaño máximo es de 5MB."
        });
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
      toast({
        title: "Firma Guardada",
        description: "Su firma se cargará automáticamente en el futuro."
      });
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
      toast({ 
        variant: "destructive", 
        title: "Cliente Requerido", 
        description: "Por favor ingrese o seleccione un cliente." 
      });
      setLoading(false);
      return;
    }

    if (formData.techRut && !validateRut(formData.techRut)) {
      toast({ 
        variant: "destructive", 
        title: "RUT Técnico Inválido", 
        description: "El RUT del técnico no es correcto." 
      });
      setLoading(false);
      return;
    }

    if (formData.clientReceiverRut && !validateRut(formData.clientReceiverRut)) {
      toast({ 
        variant: "destructive", 
        title: "RUT Receptor Inválido", 
        description: "El RUT de quien recibe no es correcto." 
      });
      setLoading(false);
      return;
    }

    const isValidationComplete = !!formData.techSignatureUrl && 
                                !!formData.clientSignatureUrl && 
                                !!formData.clientReceiverRut;
                                
    const finalStatus = isValidationComplete ? "Completed" : "Pending";
    const finalFolio = folio || generateFolio();
    const orderId = doc(collection(db, "ordenes")).id;
    
    const workOrderData = {
      ...formData,
      id: orderId,
      folio: finalFolio,
      status: finalStatus,
      createdBy: user.uid,
      creatorEmail: user.email,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    };

    const targetCollection = finalStatus === "Completed" ? "historial" : "ordenes";
    const orderRef = doc(db, targetCollection, orderId);
    
    try {
      setDocumentNonBlocking(orderRef, workOrderData, { merge: true });
      toast({ 
        title: finalStatus === "Completed" ? "Orden Finalizada" : "Orden Guardada", 
        description: finalStatus === "Completed" 
          ? "La orden se ha movido al historial correctamente." 
          : "La orden se guardó como pendiente por falta de firmas o RUT del receptor."
      });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la orden." });
    }
  };

  const hasSavedSignature = techProfiles && techProfiles.length > 0 && !!techProfiles[0].signatureUrl;
  
  const availablePersonnel = allPersonnel?.filter(p => p.rol_t !== "Administrador" && !formData.team.includes(p.nombre_t)) || [];

  if (isUserLoading || isProfileLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
      <Loader2 className="h-10 w-10 animate-spin" />
      <p className="font-black tracking-tighter text-xl">CARGANDO...</p>
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
            <h1 className="font-bold text-lg md:text-xl text-primary truncate max-w-[180px] md:max-w-none">Nueva OT #{folio || '...'}</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-4 md:px-6 font-bold">
            <Save className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Guardar</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="bg-secondary/20 rounded-t-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-primary text-xl">General</CardTitle>
                  <CardDescription className="text-xs">Identificación del servicio</CardDescription>
                </div>
                <div className="text-right">
                   <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-white px-2 py-1 rounded-full shadow-sm border">
                      <Clock className="h-3 w-3" />
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="font-bold">Cliente / Empresa</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nombre de empresa..." 
                      value={formData.clientName}
                      onChange={e => setFormData({...formData, clientName: e.target.value})}
                      className="h-14 text-base font-bold"
                    />
                    <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-14 w-14 shrink-0 bg-primary/5 border-primary/20 hover:bg-primary/10">
                          <Search className="h-5 w-5 text-primary" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] md:w-[450px] p-0 shadow-2xl border-primary/10" align="end">
                        <Command className="rounded-xl">
                          <CommandInput placeholder="Buscar empresa por nombre..." className="h-12" />
                          <CommandList className="max-h-[400px]">
                            <CommandEmpty className="p-6 text-sm text-center text-muted-foreground">No se encontraron clientes.</CommandEmpty>
                            <CommandGroup heading="Empresas Registradas" className="p-2">
                              {clients?.map((client) => (
                                <CommandItem 
                                  key={client.id} 
                                  value={client.nombreCliente} 
                                  onSelect={() => handleSelectClient(client)}
                                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/5 rounded-lg transition-colors border-b last:border-0"
                                >
                                  <div className="bg-primary/10 p-2 rounded-full">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex flex-col flex-1">
                                    <span className="font-black text-primary text-base leading-tight">{client.nombreCliente}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{client.rutCliente}</span>
                                      <span className="text-[10px] opacity-40 px-1 border rounded">{client.estadoCliente}</span>
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
                <div className="space-y-2">
                  <Label htmlFor="contact" className="font-bold">Contacto / Teléfono</Label>
                  <Input 
                    id="contact" 
                    placeholder="Contacto o email" 
                    value={formData.clientContact}
                    onChange={e => setFormData({...formData, clientContact: e.target.value})}
                    className="h-14 text-base"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 md:p-6 border-b">
              <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Equipo de Trabajo</CardTitle>
              <CardDescription>Asigne al personal que ejecutará esta orden.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
               <div className="flex flex-wrap gap-2">
                {formData.team.map((name, index) => (
                  <Badge key={index} variant="secondary" className="text-base py-1 px-3 rounded-lg bg-primary/10 text-primary gap-2">
                    {name}
                    <button type="button" onClick={() => handleTeamRemove(name)} className="rounded-full hover:bg-black/20 p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Popover open={openTeamSearch} onOpenChange={setOpenTeamSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-12 text-base font-bold border-dashed">
                    <PlusCircle className="h-5 w-5 mr-2" /> Agregar Miembro al Equipo
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] md:w-[450px] p-0 shadow-2xl border-primary/10" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar personal..." className="h-12"/>
                    <CommandList>
                      <CommandEmpty>No hay personal disponible.</CommandEmpty>
                      <CommandGroup heading="Personal Disponible">
                        {availablePersonnel.map(person => (
                          <CommandItem key={person.id} onSelect={() => handleTeamSelect(person)} className="p-3 cursor-pointer">
                            <User className="mr-3 h-5 w-5 text-primary" />
                            <div className="flex flex-col">
                              <span className="font-bold">{person.nombre_t}</span>
                              <span className="text-xs text-muted-foreground">{person.rol_t}</span>
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
            <CardHeader className="p-4 md:p-6 border-b">
              <CardTitle className="text-lg">Detalles Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Tipo de Señal</Label>
                  <Select value={formData.signalType} onValueChange={v => setFormData({...formData, signalType: v})}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Simple">Simple</SelectItem>
                      <SelectItem value="Doble">Doble</SelectItem>
                      <SelectItem value="Triple">Triple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="font-bold">Ubicación</Label>
                  <Input 
                    id="location" 
                    placeholder="Ej. Torre B / Piso 4" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-bold block">Checklist</Label>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl border border-dashed">
                  {[
                    { id: "cert", label: "Certificación", key: "isCert" },
                    { id: "plan", label: "Planos", key: "isPlan" },
                    { id: "switch", label: "Switch", key: "connectionSwitch" },
                    { id: "hub", label: "Hub", key: "hubConnection" }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={item.id} 
                        checked={(formData as any)[item.key]}
                        onCheckedChange={(checked) => setFormData({...formData, [item.key]: checked === true})}
                      />
                      <label htmlFor={item.id} className="text-sm font-semibold cursor-pointer">
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Descripción</Label>
                <Textarea 
                  placeholder="Detalles del trabajo..." 
                  className="min-h-[140px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg">Multimedia</CardTitle>
              <CardDescription>Evidencia visual del servicio.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />
              {!formData.sketchImageUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-muted-foreground bg-background/50 hover:bg-background/80 transition-all cursor-pointer active:scale-95"
                >
                  <Camera className="h-12 w-12 mb-3 text-primary opacity-60" />
                  <p className="text-sm font-bold text-center">Tocar para Foto o Archivo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted group border shadow-inner">
                    <Image src={formData.sketchImageUrl} alt="Preview" fill className="object-contain" />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-10 w-10 rounded-full shadow-lg"
                      onClick={removeImage}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button type="button" variant="outline" className="w-full h-12 font-bold" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="h-4 w-4 mr-2" /> Reemplazar Foto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 pb-6">
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  Validación Técnico ICSA
                  {hasSavedSignature && <Badge variant="secondary" className="bg-primary/10 text-primary border-none gap-1 font-bold text-[9px]"><UserCheck size={10} /> Firma cargada</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex items-center gap-1"><User className="h-3 w-3" /> Nombre Técnico</Label>
                    <Input 
                      placeholder="Nombre completo" 
                      value={formData.techName} 
                      onChange={e => setFormData({...formData, techName: e.target.value})}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex items-center gap-1"><CreditCard className="h-3 w-3" /> RUT Técnico</Label>
                    <Input 
                      placeholder="RUT" 
                      value={formData.techRut} 
                      onChange={e => setFormData({...formData, techRut: e.target.value})}
                      className="h-10"
                    />
                  </div>
                </div>
                {formData.techSignatureUrl ? (
                  <div className="space-y-2">
                    <div className="relative h-32 w-full bg-background/50 rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                      <Image src={formData.techSignatureUrl} alt="Firma Técnico" fill className="object-contain" />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFormData({...formData, techSignatureUrl: ""})}
                      className="w-full text-[10px] h-6 text-muted-foreground"
                    >
                      Volver a firmar manualmente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <SignaturePad label="Firma Técnico" onSave={handleTechSignatureConfirm} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardHeader className="border-b bg-muted/20 p-4">
                <CardTitle className="text-sm font-bold">Validación Recepción Terreno</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex items-center gap-1"><User className="h-3 w-3" /> Nombre Receptor</Label>
                    <Input 
                      placeholder="Nombre de quien recibe" 
                      value={formData.clientReceiverName} 
                      onChange={e => setFormData({...formData, clientReceiverName: e.target.value})}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex items-center gap-1"><CreditCard className="h-3 w-3" /> RUT Receptor</Label>
                    <Input 
                      placeholder="RUT (Obligatorio para finalizar)" 
                      value={formData.clientReceiverRut} 
                      onChange={e => setFormData({...formData, clientReceiverRut: e.target.value})}
                      className={`h-10 ${!formData.clientReceiverRut ? "border-destructive/30" : ""}`}
                    />
                  </div>
                </div>
                {formData.clientSignatureUrl ? (
                  <div className="space-y-2">
                    <div className="relative h-32 w-full bg-background/50 rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                      <Image src={formData.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain" />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFormData({...formData, clientSignatureUrl: ""})}
                      className="w-full text-[10px] h-6 text-muted-foreground"
                    >
                      Volver a firmar
                    </Button>
                  </div>
                ) : (
                  <SignaturePad label="Firma Cliente / Recepción" onSave={(dataUrl) => setFormData({...formData, clientSignatureUrl: dataUrl})} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t md:relative md:bg-transparent md:border-none md:p-0">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 w-full h-16 text-xl font-black gap-3 shadow-xl active:scale-95 transition-all" disabled={loading}>
              <CheckCircle2 size={28} /> {!!formData.techSignatureUrl && !!formData.clientSignatureUrl && !!formData.clientReceiverRut ? "Finalizar Orden" : "Guardar como Pendiente"}
            </Button>
          </div>
        </form>
      </main>

      <AlertDialog open={showSaveSignatureDialog} onOpenChange={setShowSaveSignatureDialog}>
        <AlertDialogContent className="rounded-2xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-black uppercase tracking-tighter">Guardar Firma</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Desea guardar esta firma para que se cargue automáticamente en sus futuras órdenes de trabajo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 pt-4">
            <AlertDialogCancel className="h-12 font-bold" onClick={() => {
              setFormData({...formData, techSignatureUrl: tempSignature});
              setShowSaveSignatureDialog(false);
            }}>
              Solo esta vez
            </AlertDialogCancel>
            <AlertDialogAction className="h-12 bg-primary font-black" onClick={saveSignatureToProfile}>
              Sí, guardar firma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    