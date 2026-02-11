
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, User, Calendar, MapPin, ClipboardCheck, Info, Pencil, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function WorkOrderView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!db || !id) return;
      setIsLoading(true);
      
      // Intentar buscar en 'ordenes' primero
      let orderDoc = await getDoc(doc(db, "ordenes", id));
      
      // Si no está, buscar en 'historial'
      if (!orderDoc.exists()) {
        orderDoc = await getDoc(doc(db, "historial", id));
      }

      if (orderDoc.exists()) {
        setOrder({ ...orderDoc.data(), id: orderDoc.id });
      }
      setIsLoading(false);
    }
    fetchOrder();
  }, [db, id]);

  if (isLoading) return <div className="p-20 text-center text-primary font-black animate-pulse bg-background min-h-screen flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin h-10 w-10" /> BUSCANDO ORDEN...</div>;
  if (!order) return <div className="p-20 text-center text-muted-foreground font-bold bg-background min-h-screen">Orden no encontrada.</div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="font-black text-lg text-primary truncate">OT #{order.folio}</h1>
          </div>
          <div className="flex gap-2">
            {order.status === "Pending" && (
              <Link href={`/work-orders/${order.id}/edit`}>
                <Button variant="outline" size="sm" className="h-10 gap-2 border-primary text-primary">
                  <Pencil className="h-4 w-4" /> Editar / Firmar
                </Button>
              </Link>
            )}
            <Button size="icon" onClick={() => generateWorkOrderPDF(order)} className="bg-primary hover:bg-primary/90 h-10 w-10">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()} className="h-10 w-10 hidden md:flex">
              <Printer className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-2xl space-y-4">
        <div className="flex items-center justify-between px-1">
          <Badge className={cn("border-none text-xs px-3 py-1 font-bold", order.status === 'Completed' ? 'bg-accent/20 text-primary' : 'bg-primary/20 text-primary')}>
            {order.status === 'Completed' ? 'COMPLETADA' : 'PENDIENTE'}
          </Badge>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-widest">
            <Calendar className="h-3 w-3" /> {order.startDate ? new Date(order.startDate).toLocaleDateString() : "N/A"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="flex flex-row items-center gap-3 p-4">
              <div className="p-2 bg-secondary rounded-xl">
                <User className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Cliente</CardTitle>
                <CardDescription className="text-xs">{order.clientName}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
               <p className="text-xs text-muted-foreground">{order.clientContact || "Sin contacto"}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white">
            <CardHeader className="flex flex-row items-center gap-3 p-4">
              <div className="p-2 bg-secondary rounded-xl">
                <MapPin className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Ubicación</CardTitle>
                <CardDescription className="text-xs">{order.location || "No especificada"}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
               <p className="text-xs text-muted-foreground font-medium">CDS: {order.cdsCanalization || "N/A"}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md border-none bg-white">
          <CardHeader className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-xl">
                <ClipboardCheck className="text-primary h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">Especificaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 border rounded-xl bg-background flex flex-col items-center justify-center text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Señal</p>
                <p className="font-black text-primary text-sm">{order.signalType}</p>
              </div>
              {[
                { label: "Certificación", value: order.isCert },
                { label: "Planos", value: order.isPlan },
                { label: "Switch", value: order.connectionSwitch },
                { label: "Hub", value: order.hubConnection },
              ].map((item, i) => (
                <div key={i} className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center ${item.value ? 'bg-accent/10 border-accent/20' : 'bg-background'}`}>
                  <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">{item.label}</p>
                  <p className={`font-black text-sm ${item.value ? 'text-accent' : 'text-muted-foreground/30'}`}>
                    {item.value ? "SÍ" : "NO"}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 mt-4">
              <p className="text-xs font-black flex items-center gap-2 text-primary uppercase tracking-widest">
                <Info className="h-3 w-3" /> Descripción
              </p>
              <div className="p-4 bg-muted/30 rounded-xl text-sm leading-relaxed border border-dashed font-medium">
                {order.description || "Sin descripción detallada."}
              </div>
            </div>
          </CardContent>
        </Card>

        {order.sketchImageUrl && (
          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Bosquejo / Foto</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                <Image src={order.sketchImageUrl} alt="Sketch" fill className="object-contain" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Firma Técnico</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              {(order.techName || order.techRut) && (
                <div className="text-[11px] space-y-1 p-2 bg-muted/20 rounded-lg">
                  <p className="font-bold uppercase flex items-center gap-1"><User className="h-3 w-3" /> {order.techName || "N/A"}</p>
                  <p className="text-muted-foreground flex items-center gap-1"><CreditCard className="h-3 w-3" /> {order.techRut || "N/A"}</p>
                </div>
              )}
              {order.techSignatureUrl ? (
                <div className="relative h-32 w-full bg-background/50 rounded-xl border border-dashed flex items-center justify-center">
                   <Image src={order.techSignatureUrl} alt="Tech Sig" fill className="object-contain" />
                </div>
              ) : (
                <div className="border border-dashed rounded-xl h-32 flex items-center justify-center bg-background/50 text-muted-foreground italic text-xs">
                  Sin firma
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Firma Receptor</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              {(order.clientReceiverName || order.clientReceiverRut) && (
                <div className="text-[11px] space-y-1 p-2 bg-muted/20 rounded-lg">
                  <p className="font-bold uppercase flex items-center gap-1"><User className="h-3 w-3" /> {order.clientReceiverName || "N/A"}</p>
                  <p className="text-muted-foreground flex items-center gap-1"><CreditCard className="h-3 w-3" /> {order.clientReceiverRut || "N/A"}</p>
                </div>
              )}
              {order.clientSignatureUrl ? (
                 <div className="relative h-32 w-full bg-background/50 rounded-xl border border-dashed flex items-center justify-center">
                    <Image src={order.clientSignatureUrl} alt="Client Sig" fill className="object-contain" />
                 </div>
              ) : (
                <div className="border border-dashed rounded-xl h-32 flex items-center justify-center bg-background/50 text-muted-foreground italic text-xs">
                  Sin firma
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 mt-8">
           {order.status === "Pending" && (
             <Link href={`/work-orders/${order.id}/edit`} className="w-full">
               <Button className="bg-accent text-primary h-14 w-full text-lg font-black gap-3 shadow-xl">
                 <Pencil /> Reabrir para completar
               </Button>
             </Link>
           )}
           <Button onClick={() => generateWorkOrderPDF(order)} className="bg-primary h-14 w-full text-lg font-black gap-3 shadow-xl">
             <Download /> Descargar Reporte PDF
           </Button>
           <Link href="/dashboard" className="w-full">
             <Button variant="outline" className="h-12 w-full font-bold">
               Volver al Panel
             </Button>
           </Link>
        </div>
      </main>
    </div>
  );
}
