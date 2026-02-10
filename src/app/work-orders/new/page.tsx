
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
import { ArrowLeft, Save, Camera, CheckCircle2, Clock, User as UserIcon, Search, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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
    techSignatureUrl: "",
    clientSignatureUrl: "",
    sketchImageUrl: "",
    status: "Pending"
  });

  useEffect(() => {
    setFolio(Math.floor(Math.random() * 90000) + 10000);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleSelectClient = (client: any) => {
    setFormData({
      ...formData,
      clientName: client.nombreCliente || "",
      clientContact: client.emailClientes || client.telefonoCliente || "",
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
        description: "Por favor seleccione o ingrese el nombre del cliente." 
      });
      setLoading(false);
      return;
    }

    const hasBothSignatures = formData.techSignatureUrl && formData.clientSignatureUrl;
    const finalStatus = hasBothSignatures ? "Completed" : "Pending";

    const orderId = doc(collection(db, "temp")).id;
    const workOrderData = {
      ...formData,
      id: orderId,
      folio: folio,
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
        title: finalStatus === "Completed" ? "Orden Completada" : "Orden Guardada (Pendiente)", 
        description: finalStatus === "Completed" 
          ? "La orden se ha finalizado correctamente con ambas firmas." 
          : "La orden se guardó como pendiente debido a la falta de firmas."
      });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la orden." });
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse bg-background">IDENTIFICANDO TÉCNICO...</div>;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg md:text-xl text-primary truncate max-w-[180px] md:max-w-none">Nueva OT #{folio}</h1>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-4 md:px-6 font-bold">
              <Save className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">{loading ? "Guardando..." : "Guardar Orden"}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="bg-secondary/20 rounded-t-lg p-4 md:p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-primary text-xl">Información General</CardTitle>
                    <CardDescription className="text-xs">Fecha: {new Date().toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary bg-white px-3 py-1.5 rounded-full shadow-sm border border-primary/10">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Inicio: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground mt-1">
                      <UserIcon className="h-3 w-3" />
                      <span>Técnico: {user?.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="clientName" className="font-bold mb-1">Cliente / Empresa</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nombre del cliente..." 
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
                            <CommandEmpty className="p-4 text-sm">No hay clientes guardados.</CommandEmpty>
                            <CommandGroup>
                              {clients?.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.nombreCliente}
                                  onSelect={() => handleSelectClient(client)}
                                  className="py-3"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold">{client.nombreCliente}</span>
                                    <span className="text-[10px] text-muted-foreground">{client.rutCliente}</span>
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
                    placeholder="Email o Teléfono" 
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
                  <Select 
                    value={formData.signalType} 
                    onValueChange={v => setFormData({...formData, signalType: v})}
                  >
                    <SelectTrigger className="h-12 text-base">
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
                  <Label htmlFor="location" className="font-bold">Ubicación (Edificio/Piso)</Label>
                  <Input 
                    id="location" 
                    placeholder="Ej. Torre B / Piso 4" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cds" className="font-bold">CDS / Canalización</Label>
                <Input 
                  id="cds" 
                  placeholder="Ej. Ducto Principal 2" 
                  value={formData.cdsCanalization}
                  onChange={e => setFormData({...formData, cdsCanalization: e.target.value})}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-4">
                <Label className="font-bold block mb-2">Checklist de Instalación</Label>
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
                        className="h-6 w-6 rounded-md"
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
                <Label className="font-bold">Descripción de Trabajos</Label>
                <Textarea 
                  placeholder="Detalles adicionales del servicio..." 
                  className="min-h-[140px] text-base"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 md:p-6 border-b">
              <CardTitle className="text-lg">Multimedia</CardTitle>
              <CardDescription>Carga una foto del bosquejo técnico o registro realizado.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              {!formData.sketchImageUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center text-muted-foreground bg-background/50 hover:bg-background/80 transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <Camera className="h-12 w-12 mb-3 text-primary opacity-60" />
                  <p className="text-sm font-bold text-center">Subir foto o bosquejo</p>
                  <p className="text-[10px] mt-1 uppercase tracking-widest font-medium">JPG, PNG hasta 5MB</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted group border">
                    <Image 
                      src={formData.sketchImageUrl} 
                      alt="Preview" 
                      fill 
                      className="object-contain" 
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-12 font-bold"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" /> Cambiar Imagen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 pb-6">
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <SignaturePad 
                  label="Firma del Técnico" 
                  onSave={(dataUrl) => setFormData({...formData, techSignatureUrl: dataUrl})}
                />
              </CardContent>
            </Card>
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <SignaturePad 
                  label="Firma del Cliente" 
                  onSave={(dataUrl) => setFormData({...formData, clientSignatureUrl: dataUrl})}
                />
              </CardContent>
            </Card>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t md:relative md:bg-transparent md:border-none md:p-0">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 w-full h-14 text-lg font-black gap-3 shadow-xl active:scale-95 transition-all">
              <CheckCircle2 size={24} /> Finalizar Orden
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
