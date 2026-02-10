"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, User, Calendar, MapPin, ClipboardCheck, Info, FileText } from "lucide-react";
import Link from "next/link";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";

// Mock data fetcher
const getMockOrder = (id: string) => {
  return {
    id,
    folio: parseInt(id) || 10245,
    client: "Juan Pérez",
    contact: "juan.perez@example.com",
    date: "2024-05-15",
    status: "Completed",
    description: "Instalación de fibra óptica en planta baja. Se realizaron pruebas de señal y certificación de puntos de red.",
    specs: {
      signalType: "Doble",
      isCert: true,
      isPlan: true,
      isSwitch: false,
      isHub: false,
      location: "Torre A - Piso 2",
      cds: "Ducto Principal"
    },
    signatures: {
      techUrl: "", 
      clientUrl: ""
    }
  };
};

export default function WorkOrderView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    setOrder(getMockOrder(id));
  }, [id]);

  if (!order) return <div className="p-8 text-center text-primary font-bold">Cargando orden...</div>;

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
          <Badge className="bg-accent/20 text-primary border-none text-xs px-3 py-1 font-bold">
            {order.status}
          </Badge>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-widest">
            <Calendar className="h-3 w-3" /> {order.date}
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
                <CardDescription className="text-xs">{order.client}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
               <p className="text-xs text-muted-foreground">{order.contact}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none bg-white">
            <CardHeader className="flex flex-row items-center gap-3 p-4">
              <div className="p-2 bg-secondary rounded-xl">
                <MapPin className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Ubicación</CardTitle>
                <CardDescription className="text-xs">{order.specs.location}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
               <p className="text-xs text-muted-foreground font-medium">CDS: {order.specs.cds}</p>
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
                <p className="font-black text-primary text-sm">{order.specs.signalType}</p>
              </div>
              {[
                { label: "Certificación", value: order.specs.isCert },
                { label: "Planos", value: order.specs.isPlan },
                { label: "Switch", value: order.specs.isSwitch },
                { label: "Hub", value: order.specs.isHub },
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
                {order.description}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Firma Técnico</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="border border-dashed rounded-xl h-32 flex items-center justify-center bg-background/50 text-muted-foreground italic text-xs">
                Firma capturada
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Firma Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="border border-dashed rounded-xl h-32 flex items-center justify-center bg-background/50 text-muted-foreground italic text-xs">
                Firma capturada
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 mt-8">
           <Button onClick={() => generateWorkOrderPDF(order)} className="bg-primary h-14 w-full text-lg font-black gap-3 shadow-xl active:scale-95 transition-all">
             <Download /> Descargar PDF
           </Button>
           <Link href="/dashboard" className="w-full">
             <Button variant="outline" className="h-12 w-full font-bold border-primary/20 text-primary">
               Volver al Panel
             </Button>
           </Link>
        </div>
      </main>
    </div>
  );
}
