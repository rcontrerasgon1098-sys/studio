
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, User, Phone, Mail, MapPin, Building2, Hash, Calendar, ClipboardCheck, Info, Users, CreditCard, Loader2, ShieldCheck } from "lucide-react";
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
    if (order && (order.status === 'Pendiente' || order.status === 'Pending')) {
      router.replace(`/work-orders/${id}/edit`);
    }
  }, [order, router, id]);

  if (isLoading || (order && (order.status === 'Pendiente' || order.status === 'Pending'))) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
      <p className="font-black tracking-widest text-xs uppercase">Cargando Orden...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-10 text-center space-y-4">
      <Info size={60} className="text-muted-foreground opacity-20" />
      <h1 className="text-xl font-black text-primary uppercase">No encontrado</h1>
      <p className="text-muted-foreground font-medium">La orden solicitada no existe o ha sido movida.</p>
      <Link href="/dashboard">
        <Button className="bg-primary rounded-xl font-bold">Volver al Dashboard</Button>
      </Link>
    </div>
  );

  const isCompleted = order.status === 'Completed' || order.status === 'Completado';

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm h-16 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-black text-lg text-primary uppercase tracking-tighter">OT #{order.folio}</h1>
          </div>
          <div className="flex gap-2">
            <Button size="icon" onClick={() => generateWorkOrderPDF(order)} className="bg-primary h-10 w-10 rounded-xl">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()} className="h-10 w-10 rounded-xl hidden sm:flex">
              <Printer className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
          <Badge className={cn("border-none text-[10px] px-4 py-1 font-black uppercase rounded-full", isCompleted ? 'bg-accent text-primary' : 'bg-primary text-white')}>
            {isCompleted ? 'FINALIZADA' : 'EN CURSO'}
          </Badge>
          <div className="text-[10px] text-muted-foreground flex items-center gap-2 font-bold uppercase">
            <Calendar className="h-3 w-3" /> {order.startDate ? new Date(order.startDate).toLocaleDateString() : "N/A"}
          </div>
        </div>

        <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 p-6 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <User className="h-4 w-4" /> Datos del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-1">
              <p className="text-[9px] uppercase font-black text-muted-foreground">Empresa</p>
              <p className="font-black text-primary text-2xl tracking-tighter uppercase">{order.clientName}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-bold">{order.clientPhone || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground">Email</p>
                  <p className="text-sm font-bold">{order.clientEmail || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground">Dirección</p>
                  <p className="text-sm font-bold">{order.address || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.team && order.team.length > 0 && (
          <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b bg-muted/10">
              <CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2">
                <Users className="h-4 w-4" /> Equipo Técnico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {order.team.map((member: string, index: number) => (
                  <Badge key={index} className="text-[10px] bg-primary/10 text-primary border-none font-bold py-1.5 px-4 rounded-xl">
                    {member}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b bg-primary/5">
            <CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Especificaciones Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/20 rounded-xl text-center">
                <Building2 className="h-4 w-4 text-primary mx-auto mb-1 opacity-40" />
                <p className="text-[9px] uppercase font-black text-muted-foreground">Edificio</p>
                <p className="font-bold text-sm">{order.building || "N/A"}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-xl text-center">
                <Hash className="h-4 w-4 text-primary mx-auto mb-1 opacity-40" />
                <p className="text-[9px] uppercase font-black text-muted-foreground">Piso</p>
                <p className="font-bold text-sm">{order.floor || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-[9px] text-muted-foreground uppercase font-black">Canalización ({order.signalCount || 1} Ptos)</p>
                <p className="font-bold text-sm uppercase">{order.signalType || "Simple"}</p>
              </div>
              <div className="flex gap-2">
                <div className={cn("flex-1 p-4 rounded-xl text-center border", order.isCert ? "bg-accent/10 border-accent/20" : "opacity-30")}>
                  <p className="text-[9px] font-black uppercase">Certificado</p>
                  <p className="font-bold text-xs">{order.isCert ? "SÍ" : "N/A"}</p>
                </div>
                <div className={cn("flex-1 p-4 rounded-xl text-center border", order.isLabeled ? "bg-accent/10 border-accent/20" : "opacity-30")}>
                  <p className="text-[9px] font-black uppercase">Rotulado</p>
                  <p className="font-bold text-xs">{order.isLabeled ? "SÍ" : "NO"}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Resumen de Actividades</p>
              <div className="p-5 bg-muted/10 rounded-2xl text-sm leading-relaxed border border-dashed italic text-muted-foreground">
                {order.description || "Sin descripción registrada."}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-4 bg-muted/5 border-b">
              <CardTitle className="text-[10px] font-black text-center uppercase tracking-widest">Firma Técnico ICSA</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-xs font-bold uppercase">{order.techName || "N/A"}</p>
                <p className="text-[9px] text-muted-foreground">RUT: {order.techRut || "N/A"}</p>
              </div>
              <div className="relative h-32 w-full bg-muted/10 rounded-xl border border-dashed flex items-center justify-center">
                {order.techSignatureUrl ? (
                   <Image src={order.techSignatureUrl} alt="Firma Técnico" fill className="object-contain p-2" />
                ) : (
                  <span className="text-[10px] uppercase font-bold opacity-20">Pendiente</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-4 bg-accent/10 border-b">
              <CardTitle className="text-[10px] font-black text-center uppercase tracking-widest">Firma Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-xs font-bold uppercase">{order.clientReceiverName || "N/A"}</p>
                <p className="text-[9px] text-muted-foreground">RUT: {order.clientReceiverRut || "N/A"}</p>
                <p className="text-[8px] text-muted-foreground italic truncate max-w-[150px]">{order.clientReceiverEmail || ""}</p>
              </div>
              <div className="relative h-32 w-full bg-muted/10 rounded-xl border border-dashed flex items-center justify-center">
                {order.clientSignatureUrl ? (
                   <Image src={order.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain p-2" />
                ) : (
                  <span className="text-[10px] uppercase font-bold opacity-20">Pendiente</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-12 text-center pb-12 px-6">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-[9px] text-muted-foreground leading-relaxed italic opacity-60">
            La presente Orden de Trabajo y su firma electrónica se encuentran reguladas bajo la Ley 19.799, siendo plenamente válidas como Firma Electrónica Simple para todos los efectos legales.
          </p>
          <div className="flex flex-col items-center opacity-30">
            <span className="font-black text-lg tracking-tighter text-primary">ICSA</span>
            <span className="text-[7px] font-bold uppercase tracking-[0.3em] mt-1">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
