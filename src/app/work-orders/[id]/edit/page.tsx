
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
import { ArrowLeft, Save, CheckCircle2, Camera, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function EditWorkOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const orderRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "ordenes", id);
  }, [db, id]);

  const { data: order, isLoading: isOrderLoading } = useDoc(orderRef);

  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
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

  // Inicialización de datos del formulario cuando la orden carga
  useEffect(() => {
    if (order && !isInitialized) {
      // Si la orden ya está completada, no debería editarse según reglas de negocio
      if (order.status === "Completed") {
        toast({
          variant: "destructive",
          title: "Orden Bloqueada",
          description: "Las órdenes completadas no pueden ser modificadas."
        });
        router.push(`/work-orders/${id}`);
        return;
      }

      setFormData({
        clientName: order.clientName || "",
        clientContact: order.clientContact || "",
        clientId: order.clientId || "",
        signalType: order.signalType || "Simple",
        isCert: !!order.isCert,
        isPlan: !!order.isPlan,
        connectionSwitch: !!order.connectionSwitch,
        hubConnection: !!order.hubConnection,
        location: order.location || "",
        cdsCanalization: order.cdsCanalization || "",
        description: order.description || "",
        techSignatureUrl: order.techSignatureUrl || "",
        clientSignatureUrl: order.clientSignatureUrl || "",
        sketchImageUrl: order.sketchImageUrl || "",
        status: order.status || "Pending"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !id) return;
    
    setLoading(true);

    if (!formData.clientName) {
      toast({ 
        variant: "destructive", 
        title: "Campo Requerido", 
        description: "El nombre del cliente es obligatorio." 
      });
      setLoading(false);
      return;
    }

    // Una OT pasa a Completed solo si tiene ambas firmas
    const hasBothSignatures = !!formData.techSignatureUrl && !!formData.clientSignatureUrl;
    const finalStatus = hasBothSignatures ? "Completed" : "Pending";

    const updateData = {
      ...formData,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email
    };

    const docRef = doc(db, "ordenes", id);
    
    try {
      updateDocumentNonBlocking(docRef, updateData);
      toast({ 
        title: finalStatus === "Completed" ? "Orden Finalizada" : "Cambios Guardados", 
        description: finalStatus === "Completed" 
          ? "La orden se ha cerrado con éxito." 
          : "La orden sigue pendiente de firmas."
      });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la orden." });
    }
  };

  if (isUserLoading || isOrderLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl">RECUPERANDO DATOS ICSA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href={`/work-orders/${id}`}>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg md:text-xl text-primary truncate">Reabrir OT #{order?.folio}</h1>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-4 md:px-6 font-bold">
            <Save className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">{loading ? "Guardando..." : "Guardar"}</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="bg-secondary/20 rounded-t-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-primary text-xl">Datos del Servicio</CardTitle>
                  <CardDescription className="text-xs">Actualice los campos pendientes de la OT.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white text-primary border-primary font-black">PENDIENTE</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="font-bold">Cliente / Empresa</Label>
                  <Input 
                    id="clientName"
                    value={formData.clientName}
                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                    className="h-14 text-base font-bold bg-muted/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact" className="font-bold">Contacto</Label>
                  <Input 
                    id="contact" 
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
                  <Label htmlFor="location" className="font-bold">Ubicación</Label>
                  <Input 
                    id="location" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="h-12 text-base"
                  />
                </div>
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
                      <label htmlFor={item.id} className="text-sm font-semibold cursor-pointer select-none">
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Descripción de Trabajos</Label>
                <Textarea 
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
              <CardDescription>Capture o suba la foto/bosquejo del servicio.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
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
                  <p className="text-sm font-bold text-center">Tocar para tomar foto o subir archivo</p>
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
              <CardContent className="p-4">
                <div className="mb-4">
                  {formData.techSignatureUrl && (
                    <div className="mb-4 p-2 border rounded-lg bg-background flex flex-col items-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Firma Técnica Registrada:</p>
                      <div className="relative h-20 w-full max-w-[200px]">
                        <Image src={formData.techSignatureUrl} alt="Tech Sig" fill className="object-contain" />
                      </div>
                    </div>
                  )}
                  <SignaturePad 
                    label="Actualizar Firma Técnico" 
                    onSave={(dataUrl) => setFormData({...formData, techSignatureUrl: dataUrl})}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardContent className="p-4">
                <div className="mb-4">
                  {formData.clientSignatureUrl && (
                    <div className="mb-4 p-2 border rounded-lg bg-background flex flex-col items-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Firma Cliente Registrada:</p>
                      <div className="relative h-20 w-full max-w-[200px]">
                        <Image src={formData.clientSignatureUrl} alt="Client Sig" fill className="object-contain" />
                      </div>
                    </div>
                  )}
                  <SignaturePad 
                    label="Actualizar Firma Cliente" 
                    onSave={(dataUrl) => setFormData({...formData, clientSignatureUrl: dataUrl})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t md:relative md:bg-transparent md:border-none md:p-0">
            <Button 
              type="submit" 
              size="lg" 
              className="bg-primary hover:bg-primary/90 w-full h-16 text-xl font-black gap-3 shadow-xl active:scale-95 transition-all" 
              disabled={loading}
            >
              <CheckCircle2 size={28} /> {formData.techSignatureUrl && formData.clientSignatureUrl ? "Cerrar y Finalizar OT" : "Guardar Avances"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
