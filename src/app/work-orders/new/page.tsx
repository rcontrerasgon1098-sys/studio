
"use client";

import { useState, useEffect } from "react";
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
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { ArrowLeft, Save, FileDown, Camera, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function NewWorkOrder() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    clientData: { name: "", contact: "" },
    specs: { signalType: "Simple", isCert: false, isPlan: false, isSwitch: false, isHub: false, location: "", cds: "" },
    description: "",
    signatures: { techUrl: "", clientUrl: "" },
    timestamps: { start: "", end: "" },
    sketchUrl: ""
  });

  useEffect(() => {
    setFolio(Math.floor(Math.random() * 90000) + 10000);
    setFormData(prev => ({
      ...prev,
      timestamps: { ...prev.timestamps, start: new Date().toLocaleTimeString() }
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.signatures.techUrl || !formData.signatures.clientUrl) {
      toast({ variant: "destructive", title: "Firmas Requeridas", description: "Por favor captura ambas firmas antes de continuar." });
      setLoading(false);
      return;
    }

    // Mock Firestore save
    setTimeout(() => {
      toast({ title: "Orden Guardada", description: "La orden ha sido sincronizada con éxito." });
      setLoading(false);
    }, 1500);
  };

  const handleDownloadPDF = () => {
    if (!formData.clientData.name) {
      toast({ variant: "destructive", title: "Faltan Datos", description: "Completa la información del cliente antes de generar el PDF." });
      return;
    }
    generateWorkOrderPDF({ ...formData, folio });
  };

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
            <h1 className="font-headline font-bold text-xl text-primary">Nueva Orden de Trabajo</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2 hidden md:flex">
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 gap-2">
              <Save className="h-4 w-4" /> {loading ? "Guardando..." : "Finalizar"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Info */}
          <Card className="shadow-sm border-none bg-white">
            <CardHeader className="bg-secondary/20 rounded-t-lg">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle className="text-primary">Folio: #{folio}</CardTitle>
                  <CardDescription>Fecha: {new Date().toLocaleDateString()}</CardDescription>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground bg-white p-2 rounded-md shadow-inner border">
                  <div>Inicio: <span className="text-primary font-medium">{formData.timestamps.start}</span></div>
                  <div>Fin: <span className="text-primary font-medium">{formData.timestamps.end || "--:--"}</span></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del Cliente</Label>
                <Input 
                  id="clientName" 
                  placeholder="Ej. Juan Pérez" 
                  value={formData.clientData.name}
                  onChange={e => setFormData({...formData, clientData: {...formData.clientData, name: e.target.value}})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientContact">Contacto (Email/Tel)</Label>
                <Input 
                  id="clientContact" 
                  placeholder="Ej. 555-0123" 
                  value={formData.clientData.contact}
                  onChange={e => setFormData({...formData, clientData: {...formData.clientData, contact: e.target.value}})}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Technical Specs */}
          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Especificaciones Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Tipo de Señal</Label>
                <Select 
                  value={formData.specs.signalType} 
                  onValueChange={v => setFormData({...formData, specs: {...formData.specs, signalType: v}})}
                >
                  <SelectTrigger>
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
                <Label htmlFor="location">Edificio/Piso</Label>
                <Input 
                  id="location" 
                  placeholder="Ej. Torre B / Piso 4" 
                  onChange={e => setFormData({...formData, specs: {...formData.specs, location: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cds">CDS/Canalización</Label>
                <Input 
                  id="cds" 
                  placeholder="Ej. Ducto 2" 
                  onChange={e => setFormData({...formData, specs: {...formData.specs, cds: e.target.value}})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Checklist de Instalación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { id: "cert", label: "Certificación", key: "isCert" },
                  { id: "plan", label: "Planos", key: "isPlan" },
                  { id: "switch", label: "Switch", key: "isSwitch" },
                  { id: "hub", label: "Hub", key: "isHub" }
                ].map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={item.id} 
                      onCheckedChange={(checked) => setFormData({...formData, specs: {...formData.specs, [item.key]: checked === true}})}
                    />
                    <label htmlFor={item.id} className="text-sm font-medium leading-none cursor-pointer">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-8 space-y-2">
                <Label>Descripción de Trabajos</Label>
                <Textarea 
                  placeholder="Detalles adicionales del servicio..." 
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Multimedia & Sketch */}
          <Card className="shadow-sm border-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Multimedia y Bosquejo</CardTitle>
              <CardDescription>Carga una foto del bosquejo técnico realizado en sitio.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground bg-background/50 hover:bg-background/80 transition-colors cursor-pointer">
                <Camera className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">Subir foto del bosquejo</p>
                <p className="text-xs mt-1">JPG, PNG hasta 5MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Signatures */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-none bg-white">
              <CardContent className="pt-6">
                <SignaturePad 
                  label="Firma del Técnico" 
                  onSave={(dataUrl) => setFormData({...formData, signatures: {...formData.signatures, techUrl: dataUrl}})}
                />
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-white">
              <CardContent className="pt-6">
                <SignaturePad 
                  label="Firma del Cliente" 
                  onSave={(dataUrl) => setFormData({...formData, signatures: {...formData.signatures, clientUrl: dataUrl}})}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center pt-6">
            <Button size="lg" className="bg-primary hover:bg-primary/90 w-full md:w-auto px-12 h-12 text-lg gap-2 shadow-lg">
              <CheckCircle2 /> Finalizar y Enviar
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
