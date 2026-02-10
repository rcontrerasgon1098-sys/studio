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
import { ArrowLeft, Save, Camera, CheckCircle2, Clock } from "lucide-react";
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
      timestamps: { ...prev.timestamps, start: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
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

    setTimeout(() => {
      toast({ title: "Orden Guardada", description: "La orden ha sido sincronizada con éxito." });
      setLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg md:text-xl text-primary truncate max-w-[180px] md:max-w-none">Nueva OT #{folio}</h1>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 h-10 px-4 md:px-6">
              <Save className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">{loading ? "Guardando..." : "Finalizar"}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Info Card */}
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="bg-secondary/20 rounded-t-lg p-4 md:p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-primary text-xl">Información General</CardTitle>
                    <CardDescription className="text-xs">Fecha: {new Date().toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-primary bg-white px-3 py-1.5 rounded-full shadow-sm border border-primary/10">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Inicio: {formData.timestamps.start}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="font-bold">Nombre del Cliente</Label>
                  <Input 
                    id="clientName" 
                    placeholder="Ej. Juan Pérez" 
                    value={formData.clientData.name}
                    onChange={e => setFormData({...formData, clientData: {...formData.clientData, name: e.target.value}})}
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientContact" className="font-bold">Contacto (Tel/Email)</Label>
                  <Input 
                    id="clientContact" 
                    placeholder="Ej. 555-0123" 
                    value={formData.clientData.contact}
                    onChange={e => setFormData({...formData, clientData: {...formData.clientData, contact: e.target.value}})}
                    required
                    className="h-12 text-base"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card className="shadow-md border-none bg-white overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b">
              <CardTitle className="text-lg">Detalles Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Tipo de Señal</Label>
                  <Select 
                    value={formData.specs.signalType} 
                    onValueChange={v => setFormData({...formData, specs: {...formData.specs, signalType: v}})}
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
                  <Label htmlFor="location" className="font-bold">Ubicación (Edificio/Piso)</Label>
                  <Input 
                    id="location" 
                    placeholder="Ej. Torre B / Piso 4" 
                    onChange={e => setFormData({...formData, specs: {...formData.specs, location: e.target.value}})}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cds" className="font-bold">CDS / Canalización</Label>
                <Input 
                  id="cds" 
                  placeholder="Ej. Ducto Principal 2" 
                  onChange={e => setFormData({...formData, specs: {...formData.specs, cds: e.target.value}})}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-4">
                <Label className="font-bold block mb-2">Checklist de Instalación</Label>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl border border-dashed">
                  {[
                    { id: "cert", label: "Certificación", key: "isCert" },
                    { id: "plan", label: "Planos", key: "isPlan" },
                    { id: "switch", label: "Switch", key: "isSwitch" },
                    { id: "hub", label: "Hub", key: "isHub" }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <Checkbox 
                        id={item.id} 
                        className="h-6 w-6 rounded-md"
                        onCheckedChange={(checked) => setFormData({...formData, specs: {...formData.specs, [item.key]: checked === true}})}
                      />
                      <label htmlFor={item.id} className="text-sm font-semibold cursor-pointer">
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Descripción de Trabajos</Label>
                <Textarea 
                  placeholder="Detalles adicionales del servicio..." 
                  className="min-h-[140px] text-base"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sketch / Photo */}
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="p-4 md:p-6 border-b">
              <CardTitle className="text-lg">Multimedia</CardTitle>
              <CardDescription>Carga una foto del bosquejo técnico realizado.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="border-2 border-dashed rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center text-muted-foreground bg-background/50 hover:bg-background/80 transition-colors cursor-pointer active:scale-[0.98]">
                <Camera className="h-12 w-12 mb-3 text-primary opacity-60" />
                <p className="text-sm font-bold text-center">Subir foto o bosquejo</p>
                <p className="text-[10px] mt-1 uppercase tracking-widest font-medium">JPG, PNG hasta 5MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Signatures - Vertical on mobile */}
          <div className="grid grid-cols-1 gap-6 pb-6">
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <SignaturePad 
                  label="Firma del Técnico" 
                  onSave={(dataUrl) => setFormData({...formData, signatures: {...formData.signatures, techUrl: dataUrl}})}
                />
              </CardContent>
            </Card>
            <Card className="shadow-md border-none bg-white overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <SignaturePad 
                  label="Firma del Cliente" 
                  onSave={(dataUrl) => setFormData({...formData, signatures: {...formData.signatures, clientUrl: dataUrl}})}
                />
              </CardContent>
            </Card>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t md:relative md:bg-transparent md:border-none md:p-0">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 w-full h-14 text-lg font-black gap-3 shadow-xl active:scale-95 transition-all">
              <CheckCircle2 size={24} /> Finalizar Orden
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
