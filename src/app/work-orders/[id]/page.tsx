
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, User, Phone, Mail, MapPin, Building2, Hash, Calendar, ClipboardCheck, Info, Users, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function WorkOrderView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!db || !id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      let orderDoc = await getDoc(doc(db, "ordenes", id));
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

  useEffect(() => {
    if (order && order.status === 'Pending') {
      router.replace(`/work-orders/${id}/edit`);
    }
  }, [order, router, id]);

  if (isLoading || (order && order.status === 'Pending')) return <div className="p-20 text-center text-primary font-black animate-pulse bg-background min-h-screen flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin h-10 w-10" /> CARGANDO...</div>;
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
            <h1 className="font-black text-lg text-primary truncate uppercase tracking-tighter">OT #{order.folio}</h1>
          </div>
          <div className="flex gap-2">
            <Button size="icon" onClick={() => generateWorkOrderPDF(order)} className="bg-primary h-10 w-10">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()} className="h-10 w-10 hidden md:flex">
              <Printer className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-2xl space-y-6">
        <div className="flex items-center justify-between px-1">
          <Badge className={cn("border-none text-[10px] px-4 py-1.5 font-black tracking-[0.1em] uppercase", order.status === 'Completed' ? 'bg-accent/20 text-primary' : 'bg-primary/20 text-primary')}>
            {order.status === 'Completed' ? 'FINALIZADA' : 'PENDIENTE'}
          </Badge>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-black uppercase tracking-widest">
            <Calendar className="h-3 w-3" /> {order.startDate ? new Date(order.startDate).toLocaleDateString() : "N/A"}
          </div>
        </div>

        <Card className="shadow-md border-none bg-white overflow-hidden">
          <CardHeader className="bg-primary/5 p-4 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <User className="h-4 w-4" /> Ficha del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Empresa / Cliente</p>
              <p className="font-black text-primary text-xl leading-none">{order.clientName}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground">Dirección</p>
                  <p className="text-sm font-bold">{order.address || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-bold">{order.clientPhone || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 col-span-full">
                <Mail className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground">Correo Electrónico</p>
                  <p className="text-sm font-bold">{order.clientEmail || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm border-none bg-white p-4 flex flex-col items-center justify-center text-center">
            <Building2 className="h-5 w-5 text-primary mb-1 opacity-60" />
            <p className="text-[10px] uppercase font-black text-muted-foreground">Edificio</p>
            <p className="font-bold text-sm text-primary">{order.building || "N/A"}</p>
          </Card>
          <Card className="shadow-sm border-none bg-white p-4 flex flex-col items-center justify-center text-center">
            <Hash className="h-5 w-5 text-primary mb-1 opacity-60" />
            <p className="text-[10px] uppercase font-black text-muted-foreground">Piso</p>
            <p className="font-bold text-sm text-primary">{order.floor || "N/A"}</p>
          </Card>
        </div>

        {order.team && order.team.length > 0 && (
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 border-b bg-muted/5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Users className="h-4 w-4" /> Equipo de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {order.team.map((member: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold py-1 px-3 rounded-lg">
                    {member}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-md border-none bg-white">
          <CardHeader className="p-4 border-b bg-primary/5">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Especificaciones Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2 p-4 bg-muted/20 rounded-2xl flex flex-col items-center justify-center border border-dashed">
                <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Señal ({order.signalCount || 1} u.)</p>
                <p className="font-black text-primary text-base">{order.signalType || "Simple"}</p>
              </div>
              
              {[
                { label: "Certificación", value: order.isCert, extra: order.certifiedPointsCount ? `${order.certifiedPointsCount} Puntos` : null },
                { label: "Rotulación", value: order.isLabeled, extra: order.labelDetails },
                { label: "Canalización", value: order.isCanalized },
                { label: "Planos", value: order.isPlan },
              ].map((item, i) => (
                <div key={i} className={cn("p-4 border rounded-2xl flex flex-col items-center justify-center text-center transition-all", item.value ? 'bg-accent/5 border-accent/20' : 'bg-background opacity-40')}>
                  <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">{item.label}</p>
                  <p className={cn("font-black text-xs uppercase", item.value ? 'text-primary' : 'text-muted-foreground')}>
                    {item.value ? "SÍ" : "NO"}
                  </p>
                  {item.value && item.extra && (
                    <p className="text-[9px] font-bold text-accent mt-1 leading-none">{item.extra}</p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="space-y-2 mt-4">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1">
                <Info className="h-3 w-3" /> Resumen de Actividades
              </p>
              <div className="p-5 bg-muted/20 rounded-2xl text-sm leading-relaxed border border-dashed font-medium text-muted-foreground">
                {order.description || "No se ingresó una descripción."}
              </div>
            </div>
          </CardContent>
        </Card>

        {order.sketchImageUrl && (
          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Evidencia Visual</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted border-2">
                <Image src={order.sketchImageUrl} alt="Sketch" fill className="object-contain" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="p-4 bg-muted/10 border-b">
              <CardTitle className="text-[10px] font-black text-primary uppercase tracking-widest">Firma Técnico</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-3">
              <div className="text-[10px] space-y-1 p-3 bg-muted/20 rounded-xl font-bold">
                <p className="uppercase flex items-center gap-2 text-primary"><User className="h-3 w-3" /> {order.techName || "N/A"}</p>
                <p className="text-muted-foreground flex items-center gap-2"><CreditCard className="h-3 w-3" /> {order.techRut || "N/A"}</p>
              </div>
              <div className="relative h-32 w-full bg-muted/5 rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                {order.techSignatureUrl ? (
                   <Image src={order.techSignatureUrl} alt="Firma Técnico" fill className="object-contain" />
                ) : (
                  <span className="text-[10px] uppercase font-black opacity-20">Sin Firma</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="p-4 bg-muted/10 border-b">
              <CardTitle className="text-[10px] font-black text-primary uppercase tracking-widest">Firma Receptor</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-3">
              <div className="text-[10px] space-y-1 p-3 bg-muted/20 rounded-xl font-bold">
                <p className="uppercase flex items-center gap-2 text-primary"><User className="h-3 w-3" /> {order.clientReceiverName || "N/A"}</p>
                <p className="text-muted-foreground flex items-center gap-2"><CreditCard className="h-3 w-3" /> {order.clientReceiverRut || "N/A"}</p>
              </div>
              <div className="relative h-32 w-full bg-muted/5 rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                {order.clientSignatureUrl ? (
                   <Image src={order.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain" />
                ) : (
                  <span className="text-[10px] uppercase font-black opacity-20">Sin Firma</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 mt-4">
           <Button onClick={() => generateWorkOrderPDF(order)} className="bg-primary h-14 w-full text-lg font-black gap-3 rounded-2xl uppercase">
             <Download /> Descargar Reporte PDF
           </Button>
           <Link href="/dashboard" className="w-full">
             <Button variant="outline" className="h-12 w-full font-bold uppercase text-xs tracking-widest rounded-xl">
               Volver al Panel
             </Button>
           </Link>
        </div>
      </main>
    </div>
  );
}
