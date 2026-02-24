
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Briefcase, Search, User } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, setDoc, query, orderBy } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";

export default function NewProject() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [openClientSearch, setOpenClientSearch] = useState(false);

  const clientsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "clients"), orderBy("nombreCliente", "asc"));
  }, [db]);
  const { data: clients } = useCollection(clientsQuery);

  const [formData, setFormData] = useState({
    name: "",
    clientId: "",
    clientName: "",
  });

  const handleSelectClient = (client: any) => {
    setFormData({ ...formData, clientId: client.id, clientName: client.nombreCliente });
    setOpenClientSearch(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    if (!formData.name || !formData.clientId) {
      toast({ variant: "destructive", title: "Faltan campos" });
      return;
    }

    setLoading(true);
    const projectId = doc(collection(db, "projects")).id;
    const projectData = {
      ...formData,
      id: projectId,
      status: "Active",
      createdBy: user.uid,
      creatorEmail: user.email || "",
      startDate: new Date().toISOString(),
      teamIds: [user.uid]
    };

    try {
      await setDoc(doc(db, "projects", projectId), projectData);
      toast({ title: "Proyecto Creado" });
      router.push("/dashboard");
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse">CARGANDO...</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="max-w-2xl mx-auto mb-8 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft /></Button>
        </Link>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-primary">Nuevo Proyecto</h1>
      </header>

      <main className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-xl border-none">
            <CardHeader className="bg-primary/5 rounded-t-2xl border-b">
              <CardTitle className="text-primary flex items-center gap-2">
                <Briefcase className="h-5 w-5" /> Datos de la Obra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="font-bold uppercase text-[10px]">Nombre del Proyecto</Label>
                <Input placeholder="Ej: Instalación Sede Norte" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 font-bold" required />
              </div>

              <div className="space-y-2">
                <Label className="font-bold uppercase text-[10px]">Empresa Cliente</Label>
                <div className="flex gap-2">
                  <Input placeholder="Seleccione un cliente..." value={formData.clientName} readOnly className="h-12 bg-muted/20 cursor-default" />
                  <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-12 w-12"><Search className="h-5 w-5" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>Sin resultados.</CommandEmpty>
                          <CommandGroup>
                            {clients?.map((client) => (
                              <CommandItem key={client.id} onSelect={() => handleSelectClient(client)} className="p-3 cursor-pointer">
                                <User className="mr-2 h-4 w-4 text-primary" />
                                <span className="font-bold">{client.nombreCliente}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full h-16 bg-primary font-black uppercase text-lg shadow-xl rounded-2xl">
            {loading ? "Iniciando..." : "Crear e Iniciar Proyecto"}
          </Button>
        </form>
      </main>
    </div>
  );
}
