
'use client';

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, User, Hash, Info, MapPin, Building2, ClipboardCheck } from "lucide-react";
import Image from "next/image";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { submitRemoteSignature } from "@/ai/flows/submit-remote-signature-flow";
import { cn } from "@/lib/utils";

export default function RemoteSignaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const [loading, setLoading] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverRut, setReceiverRut] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const orderRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, "ordenes", id);
  }, [db, id]);

  const { data: order, isLoading: isOrderLoading } = useDoc(orderRef);

  useEffect(() => {
    if (!isOrderLoading) {
      if (!order) {
        setErrorMsg("La orden de trabajo no existe o ya ha sido finalizada.");
        setIsValidating(false);
      } else if (!token || order.signatureToken !== token) {
        setErrorMsg("Token de firma no válido o acceso no autorizado.");
        setIsValidating(false);
      } else if (new Date(order.tokenExpiry) < new Date()) {
        setErrorMsg("El enlace de firma ha expirado (validez de 7 días).");
        setIsValidating(false);
      } else {
        setIsValidating(false);
      }
    }
  }, [order, isOrderLoading, token]);

  const handleSubmit = async () => {
    if (!receiverName || !receiverRut || !signatureUrl) {
      toast({ 
        variant: "destructive", 
        title: "Faltan datos", 
        description: "Por favor complete su nombre, RUT y realice su firma." 
      });
      return;
    }

    setLoading(true);
    try {
      const result = await submitRemoteSignature({
        orderId: id,
        token: token!,
        receiverName,
        receiverRut,
        signatureUrl,
      });

      if (result.success) {
        toast({ title: "Firma Exitosa", description: "La orden de trabajo ha sido firmada y procesada." });
        // Redirect to a success view or show success state
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar la firma." });
    } finally {
      setLoading(false);
    }
  };

  if (isOrderLoading || isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Validando Solicitud...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
          <Info size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-primary uppercase">Enlace No Válido</h1>
          <p className="text-muted-foreground font-medium max-w-xs">{errorMsg}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')} className="font-bold">Volver al Inicio</Button>
      </div>
    );
  }

  if (loading && !isValidating) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Procesando Firma...</p>
      </div>
    );
  }

  // Success view if signed
  if (!loading && order?.status === 'Completed') {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-6">
        <div className="h-20 w-20 bg-accent/20 text-primary rounded-full flex items-center justify-center">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-primary uppercase">¡Firma Recibida!</h1>
          <p className="text-muted-foreground font-medium">Gracias por su colaboración. El proceso ha finalizado correctamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-primary text-white p-6 sticky top-0 z-50 shadow-lg text-center">
        <h1 className="font-black text-xl uppercase tracking-tighter leading-none">ICSA Firma Digital</h1>
        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">Recepción de Orden de Trabajo</p>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-2xl space-y-6">
        <div className="flex items-center justify-between px-1">
          <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">
            OT #{order?.folio}
          </Badge>
          <span className="text-[10px] font-black text-muted-foreground uppercase">Revisión Remota</span>
        </div>

        {/* RESUMEN DE TRABAJO */}
        <Card className="shadow-md border-none bg-white">
          <CardHeader className="bg-primary/5 p-4 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Resumen de Actividades
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground">Dirección</p>
                  <p className="text-sm font-bold">{order?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground">Ubicación</p>
                  <p className="text-sm font-bold">Edif: {order?.building} / Piso: {order?.floor}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[9px] uppercase font-black text-muted-foreground">Detalle del Trabajo</p>
              <div className="p-4 bg-muted/20 rounded-xl text-sm leading-relaxed border border-dashed font-medium text-muted-foreground italic">
                {order?.description || "Sin descripción adicional."}
              </div>
            </div>

            {order?.sketchImageUrl && (
              <div className="space-y-2">
                <p className="text-[9px] uppercase font-black text-muted-foreground">Evidencia de Terreno</p>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border-2">
                  <Image src={order.sketchImageUrl} alt="Sketch" fill className="object-contain" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FORMULARIO DE FIRMA */}
        <Card className="shadow-md border-none bg-white overflow-hidden">
          <CardHeader className="border-b bg-muted/10 p-4">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Recepción de Trabajos</CardTitle>
            <CardDescription className="text-[10px] font-bold">Por favor, ingrese sus datos para validar la recepción conforme.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Completo</Label>
                <Input 
                  placeholder="Ej: Juan Pérez" 
                  value={receiverName} 
                  onChange={e => setReceiverName(e.target.value)}
                  className="h-12 bg-muted/10 border-none shadow-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RUT Receptor</Label>
                <Input 
                  placeholder="12.345.678-9" 
                  value={receiverRut} 
                  onChange={e => setReceiverRut(e.target.value)}
                  className="h-12 bg-muted/10 border-none shadow-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-4">
              <SignaturePad 
                label="Firma de Recepción Conforme" 
                onSave={(dataUrl) => setSignatureUrl(dataUrl)} 
              />
              <p className="text-[9px] text-center text-muted-foreground italic leading-tight">
                Al firmar, usted acepta que los trabajos descritos han sido realizados satisfactoriamente y recibidos a su entera conformidad.
              </p>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={loading || !signatureUrl} 
              className="w-full h-16 bg-primary hover:bg-primary/90 text-xl font-black gap-3 shadow-xl rounded-2xl uppercase tracking-tighter"
            >
              <CheckCircle2 size={24} /> Enviar Firma y Finalizar
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-12 text-center pb-12">
        <div className="flex flex-col items-center">
          <span className="font-black text-lg tracking-tighter text-primary">ICSA</span>
          <span className="text-[7px] font-bold opacity-40 uppercase tracking-[0.2em]">ingeniería comunicaciones S.A.</span>
        </div>
      </footer>
    </div>
  );
}
