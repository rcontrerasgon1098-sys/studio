
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
import { ArrowLeft, Save, Camera, CheckCircle2, Clock, Search, X, Image as ImageIcon, User, CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy, where } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { validateRut } from "@/lib/rut-utils";

export default function NewWorkOrder() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState(0);
  const [openClientSearch, setOpenClientSearch] = useState(false);

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
    status: "Pending"
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
        techName: tech.nombre_t || "",
        techRut: tech.rut_t || "",
        techSignatureUrl: prev.techSignatureUrl || tech.signatureUrl || ""
      }));
      
      if (tech.signatureUrl && !formData.techSignatureUrl) {
        toast({
          title: "Firma cargada",
          description: "Se ha aplicado su firma digital guardada.",
          icon: <Sparkles className="h-4 w-4 text-accent" />
        });
      }
    }
  }, [techProfiles]);

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
      technicianId: user.uid,
      technicianEmail: user.email,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    };

    const orderRef = doc(db, "ordenes", orderId);
    
    try {
      setDocumentNonBlocking(orderRef, workOrderData, { merge: true });
      toast({ 
        title: finalStatus === "Completed" ? "Orden Finalizada" : "Orden Guardada", 
        description: finalStatus === "Completed" 
          ? "La orden se ha completado correctamente." 
          : "La orden se guardó como pendiente por falta de firmas o RUT del receptor."
      });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la orden." });
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse bg-background">CARGANDO...</div>;

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
                        <Button variant="outline" size="icon" className="h-14 w-14 shrink-0">
                          <Search className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="end">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty className="p-4 text-sm">Sin registros.</CommandEmpty>
                            <CommandGroup>
                              {clients?.map((client) => (
                                <CommandItem key={client.id} value={client.nombreCliente} onSelect={() => handleSelectClient(client)}>
                                  <div className="flex flex-col">
                                    <span className="font-bold">{client.nombreCliente}</span>
                                    <span className="text-[10px] opacity-70">{client.rutCliente}</span>
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
                <CardTitle className="text-sm font-bold">Validación Técnico ICSA</CardTitle>
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
                  <SignaturePad label="Firma Técnico" onSave={(dataUrl) => setFormData({...formData, techSignatureUrl: dataUrl})} />
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
    </div>
  );
}
