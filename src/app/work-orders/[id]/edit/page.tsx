
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
import { ArrowLeft, Save, CheckCircle2, Camera, X, Image as ImageIcon, Loader2, User, CreditCard, Sparkles, UserCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
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

  const techProfileQuery = useMemoFirebase(() => {
    if (!db || !user?.email) return null;
    return query(collection(db, "personnel"), where("email_t", "==", user.email));
  }, [db, user?.email]);
  const { data: techProfiles } = useCollection(techProfileQuery);

  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSaveSignatureDialog, setShowSaveSignatureDialog] = useState(false);
  const [tempSignature, setTempSignature] = useState("");
  
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

  useEffect(() => {
    if (order && !isInitialized) {
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
        techName: order.techName || "",
        techRut: order.techRut || "",
        techSignatureUrl: order.techSignatureUrl || "",
        clientReceiverName: order.clientReceiverName || "",
        clientReceiverRut: order.clientReceiverRut || "",
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

  useEffect(() => {
    if (techProfiles && techProfiles.length > 0 && isInitialized) {
      const tech = techProfiles[0];
      setFormData(prev => {
        const updated = {
          ...prev,
          techName: prev.techName || tech.nombre_t || "",
          techRut: prev.techRut || tech.rut_t || "",
          techSignatureUrl: prev.techSignatureUrl || tech.signatureUrl || ""
        };
        
        if (tech.signatureUrl && !prev.techSignatureUrl) {
           toast({
            title: "Firma recuperada",
            description: "Se ha aplicado su firma guardada en el perfil.",
            icon: <Sparkles className="h-4 w-4 text-accent" />
          });
        }
        return updated;
      });
    }
  }, [techProfiles, isInitialized, toast]);

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
      toast({
        title: "Firma Guardada",
        description: "Su firma se cargará automáticamente en el futuro."
      });
    }
    setFormData({...formData, techSignatureUrl: tempSignature});
    setShowSaveSignatureDialog(false);
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
        toast({ title: "Avances Guardados", description: "La orden sigue pendiente de firmas o RUT del receptor." });
        router.push("/dashboard");
      } catch (error) {
        setLoading(false);
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la orden." });
      }
    }
  };

  const hasSavedSignature = techProfiles && techProfiles.length > 0 && !!techProfiles[0].signatureUrl;

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
                <div className="flex flex-col items-end">
                  <Badge variant="outline" className="text-primary border-primary">PENDIENTE</Badge>
                </div>
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
                  <Select value={formData.signalType} onValueChange={v => setFormData({...formData, signalType: v})}>
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
                  {hasSavedSignature && <Badge variant="secondary" className="bg-primary/10 text-primary border-none gap-1 font-bold text-[9px]"><UserCheck size={10} /> Firma guardada</Badge>}
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
                    <SignaturePad label="Actualizar Firma Técnico" onSave={handleTechSignatureConfirm} />
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
                  <SignaturePad label="Actualizar Firma Cliente / Recepción" onSave={(dataUrl) => setFormData({...formData, clientSignatureUrl: dataUrl})} />
                )}
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
              <CheckCircle2 size={28} /> {!!formData.techSignatureUrl && !!formData.clientSignatureUrl && !!formData.clientReceiverRut ? "Cerrar y Finalizar OT" : "Guardar Avances"}
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
