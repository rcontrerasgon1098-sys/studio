
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

  // REDIRECCIÓN AUTOMÁTICA AL EDITOR SI LA OT ESTÁ PENDIENTE
  useEffect(() => {
    if (order && (order.status === 'Pendiente' || order.status === 'Pending')) {
      router.replace(`/work-orders/${id}/edit`);
    }
  }, [order, router, id]);

  if (isLoading || (order && (order.status === 'Pendiente' || order.status === 'Pending'))) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-6">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
        <Loader2 className="animate-spin h-16 w-16 text-primary relative z-10" />
      </div>
      <p className="font-black tracking-widest text-xs uppercase animate-pulse">Generando Vista de Orden...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-10 text-center space-y-6">
      <Info size={80} className="text-muted-foreground opacity-20" />
      <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">Documento no encontrado</h1>
      <p className="text-muted-foreground font-medium max-w-xs">La orden solicitada no existe o ha sido removida del archivo central.</p>
      <Link href="/dashboard">
        <Button className="bg-primary h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest">Volver al Dashboard</Button>
      </Link>
    </div>
  );

  const isCompleted = order.status === 'Completed' || order.status === 'Completado';

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-muted border border-transparent hover:border-primary/10 transition-all">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="font-black text-xl text-primary uppercase tracking-tighter leading-none">OT #{order.folio}</h1>
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Control de Calidad ICSA</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button size="icon" onClick={() => generateWorkOrderPDF(order)} className="bg-primary hover:bg-primary/90 h-12 w-12 rounded-2xl shadow-lg shadow-primary/20 transition-transform active:scale-95">
              <Download className="h-6 w-6" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.print()} className="h-12 w-12 rounded-2xl hidden md:flex border-primary/20 text-primary">
              <Printer className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-3xl space-y-8">
        <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-primary/5">
          <Badge className={cn("border-none text-[10px] px-5 py-2 font-black tracking-[0.1em] uppercase rounded-full shadow-sm", isCompleted ? 'bg-accent text-primary' : 'bg-primary text-white')}>
            {isCompleted ? 'FINALIZADA Y ARCHIVADA' : 'EN CURSO'}
          </Badge>
          <div className="text-[10px] text-primary/60 flex items-center gap-2 font-black uppercase tracking-widest">
            <Calendar className="h-4 w-4" /> {order.startDate ? new Date(order.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : "N/A"}
          </div>
        </div>

        {/* FICHA CLIENTE */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary/[0.03] p-8 border-b border-primary/5">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><User size={18} /></div>
              Expediente del Mandante
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-1">
              <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-2">Empresa Solicitante</p>
              <p className="font-black text-primary text-3xl leading-none tracking-tighter uppercase">{order.clientName}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-dashed border-primary/10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/5 rounded-2xl text-primary"><Phone size={20} /></div>
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Contacto Directo</p>
                  <p className="text-sm font-bold text-primary mt-1">{order.clientPhone || "No registrado"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/5 rounded-2xl text-primary"><Mail size={20} /></div>
                <div>
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Email Corporativo</p>
                  <p className="text-sm font-bold text-primary mt-1">{order.clientEmail || "No registrado"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 md:col-span-2">
                <div className="p-3 bg-primary/5 rounded-2xl text-primary"><MapPin size={20} /></div>
                <div className="flex-1">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Dirección de Intervención</p>
                  <p className="text-sm font-bold text-primary mt-1">{order.address || "Sin dirección especificada"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* EQUIPO */}
        {order.team && order.team.length > 0 && (
          <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b bg-muted/[0.03] border-primary/5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl"><Users size={18} /></div>
                Personal Técnico Asignado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-wrap gap-3">
                {order.team.map((member: string, index: number) => (
                  <Badge key={index} className="text-[10px] bg-primary/5 text-primary border-none font-black py-2.5 px-5 rounded-2xl shadow-sm uppercase tracking-widest">
                    {member}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* DETALLES TÉCNICOS */}
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b bg-primary/[0.03] border-primary/5">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><ClipboardCheck size={18} /></div>
              Especificaciones Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-muted/20 rounded-[2rem] flex flex-col items-center justify-center text-center border-2 border-dashed border-primary/10 shadow-inner">
                <Building2 className="h-6 w-6 text-primary mb-2 opacity-40" />
                <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Edificio / Torre</p>
                <p className="font-black text-lg text-primary tracking-tighter mt-1">{order.building || "N/A"}</p>
              </div>
              <div className="p-6 bg-muted/20 rounded-[2rem] flex flex-col items-center justify-center text-center border-2 border-dashed border-primary/10 shadow-inner">
                <Hash className="h-6 w-6 text-primary mb-2 opacity-40" />
                <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Piso / Nivel</p>
                <p className="font-black text-lg text-primary tracking-tighter mt-1">{order.floor || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 p-6 bg-primary/5 rounded-[2rem] flex flex-col items-center justify-center border border-primary/10">
                <p className="text-[9px] text-primary/60 uppercase font-black tracking-widest mb-2">Canalización ({order.signalCount || 1} Puntos)</p>
                <p className="font-black text-primary text-xl tracking-tighter uppercase">{order.signalType || "Simple"}</p>
              </div>
              <div className={cn("p-6 rounded-[2rem] flex flex-col items-center justify-center text-center border transition-all", order.isCert ? 'bg-accent/10 border-accent/30 shadow-lg shadow-accent/5' : 'bg-background border-primary/5 opacity-30')}>
                <ShieldCheck className={cn("h-5 w-5 mb-2", order.isCert ? "text-primary" : "text-muted-foreground")} />
                <p className="text-[9px] font-black tracking-widest uppercase">Certificado</p>
                <p className="font-black text-xs mt-1">{order.isCert ? "VÁLIDO" : "N/A"}</p>
              </div>
              <div className={cn("p-6 rounded-[2rem] flex flex-col items-center justify-center text-center border transition-all", order.isLabeled ? 'bg-accent/10 border-accent/30 shadow-lg shadow-accent/5' : 'bg-background border-primary/5 opacity-30')}>
                <Info className={cn("h-5 w-5 mb-2", order.isLabeled ? "text-primary" : "text-muted-foreground")} />
                <p className="text-[9px] font-black tracking-widest uppercase">Rotulado</p>
                <p className="font-black text-xs mt-1">{order.isLabeled ? "SÍ" : "NO"}</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-3">
                <div className="h-px flex-1 bg-primary/10" /> BITÁCORA DE TRABAJO <div className="h-px flex-1 bg-primary/10" />
              </p>
              <div className="p-8 bg-muted/10 rounded-[2.5rem] text-sm leading-relaxed border border-dashed border-primary/10 font-medium text-muted-foreground shadow-inner italic">
                {order.description || "Sin descripción de actividades registradas."}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FIRMAS DIGITALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
          <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-6 bg-muted/[0.03] border-b border-primary/5">
              <CardTitle className="text-[10px] font-black text-primary uppercase tracking-widest text-center">Validación Técnica ICSA</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="text-[10px] space-y-2 p-5 bg-primary/5 rounded-[1.5rem] font-bold text-center border border-primary/5">
                <p className="uppercase text-primary tracking-widest">{order.techName || "Técnico No Registrado"}</p>
                <p className="text-muted-foreground opacity-60">RUT: {order.techRut || "Sin RUT"}</p>
              </div>
              <div className="relative h-40 w-full bg-muted/5 rounded-[2rem] border-2 border-dashed border-primary/10 flex items-center justify-center overflow-hidden p-4 group">
                {order.techSignatureUrl ? (
                   <Image src={order.techSignatureUrl} alt="Firma Técnico" fill className="object-contain transition-transform group-hover:scale-110" />
                ) : (
                  <div className="text-center opacity-20">
                    <Users size={32} className="mx-auto mb-2" />
                    <span className="text-[10px] uppercase font-black">Pendiente</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-6 bg-accent/[0.03] border-b border-accent/10">
              <CardTitle className="text-[10px] font-black text-primary uppercase tracking-widest text-center">Recepción Conforme Mandante</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="text-[10px] space-y-2 p-5 bg-accent/10 rounded-[1.5rem] font-bold text-center border border-accent/5">
                <p className="uppercase text-primary tracking-widest">{order.clientReceiverName || "Receptor No Registrado"}</p>
                <p className="text-muted-foreground opacity-60">RUT: {order.clientReceiverRut || "Sin RUT"}</p>
              </div>
              <div className="relative h-40 w-full bg-muted/5 rounded-[2rem] border-2 border-dashed border-primary/10 flex items-center justify-center overflow-hidden p-4 group">
                {order.clientSignatureUrl ? (
                   <Image src={order.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain transition-transform group-hover:scale-110" />
                ) : (
                  <div className="text-center opacity-20">
                    <CreditCard size={32} className="mx-auto mb-2" />
                    <span className="text-[10px] uppercase font-black">Pendiente</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ACCIONES FINALES */}
        <div className="flex flex-col gap-4 mt-4 px-4 sm:px-0">
           <Button onClick={() => generateWorkOrderPDF(order)} className="bg-primary hover:bg-primary/90 h-16 w-full text-lg font-black gap-4 rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95">
             <Download size={24} /> Descargar Reporte Oficial
           </Button>
           <Link href="/dashboard" className="w-full">
             <Button variant="ghost" className="h-14 w-full font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl text-muted-foreground hover:bg-muted/50">
               Volver al Panel de Control
             </Button>
           </Link>
        </div>
      </main>

      <footer className="mt-16 text-center pb-16 px-10">
        <div className="max-w-xl mx-auto space-y-6">
          <p className="text-[10px] text-muted-foreground leading-relaxed italic opacity-60">
            La presente Orden de Trabajo y su firma electrónica se encuentran reguladas bajo la Ley 19.799, siendo plenamente válidas como Firma Electrónica Simple para todos los efectos legales.
          </p>
          <div className="flex flex-col items-center">
            <div className="h-px w-12 bg-primary/20 mb-4" />
            <span className="font-black text-2xl tracking-tighter text-primary/40 uppercase">ICSA</span>
            <span className="text-[7px] font-bold text-muted-foreground opacity-30 uppercase tracking-[0.5em] mt-1">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
