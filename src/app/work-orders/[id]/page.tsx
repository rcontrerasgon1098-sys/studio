
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, User, Calendar, MapPin, ClipboardCheck, Info } from "lucide-react";
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
      techUrl: "", // Signatures would be data URLs in a real app
      clientUrl: ""
    }
  };
};

export default function WorkOrderView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Simulate data loading
    setOrder(getMockOrder(id));
  }, [id]);

  if (!order) return <div className="p-8 text-center">Cargando orden...</div>;

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-headline font-bold text-xl text-primary">Detalle de Orden #{order.folio}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button size="sm" onClick={() => generateWorkOrderPDF(order)} className="bg-primary hover:bg-primary/90 gap-2">
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Badge className="bg-accent/20 text-primary border-none text-md px-4 py-1">
            Estado: {order.status}
          </Badge>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" /> {order.date}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <User className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Información del Cliente</CardTitle>
                <CardDescription>Datos de contacto registrados</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Nombre</p>
                <p className="font-medium">{order.client}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Contacto</p>
                <p className="font-medium">{order.contact}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <MapPin className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Ubicación Técnica</CardTitle>
                <CardDescription>Detalles del sitio de trabajo</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Edificio/Piso</p>
                <p className="font-medium">{order.specs.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">CDS/Canalización</p>
                <p className="font-medium">{order.specs.cds}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-secondary rounded-lg">
              <ClipboardCheck className="text-primary h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Especificaciones y Checklist</CardTitle>
              <CardDescription>Requerimientos técnicos cumplidos</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 border rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Tipo Señal</p>
                <p className="font-bold text-primary">{order.specs.signalType}</p>
              </div>
              {[
                { label: "Certificación", value: order.specs.isCert },
                { label: "Planos", value: order.specs.isPlan },
                { label: "Switch", value: order.specs.isSwitch },
                { label: "Hub", value: order.specs.isHub },
              ].map((item, i) => (
                <div key={i} className={`p-3 border rounded-lg ${item.value ? 'bg-accent/10 border-accent/20' : 'bg-background/50'}`}>
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className={`font-bold ${item.value ? 'text-accent' : 'text-muted-foreground'}`}>
                    {item.value ? "Sí" : "No"}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-bold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Descripción de Trabajos
              </p>
              <div className="p-4 bg-muted/30 rounded-lg text-sm leading-relaxed">
                {order.description}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="text-sm">Firma del Técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-dashed rounded-lg h-32 flex items-center justify-center bg-background/50 text-muted-foreground italic text-sm">
                Firma digital capturada
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="text-sm">Firma del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-dashed rounded-lg h-32 flex items-center justify-center bg-background/50 text-muted-foreground italic text-sm">
                Firma digital capturada
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
