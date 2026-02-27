
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowLeft, Pencil, Trash2, Building2, User, Phone, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClientsListPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const clientsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "clients"), orderBy("nombreCliente", "asc"));
  }, [db]);

  const { data: clients, isLoading } = useCollection(clientsQuery);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => 
      c.nombreCliente?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.rutCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleDelete = () => {
    if (!deleteId || !db) return;
    deleteDocumentNonBlocking(doc(db, "clients", deleteId));
    toast({ title: "Cliente eliminado con éxito" });
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm h-16 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-black text-lg text-primary uppercase tracking-tighter">Gestión de Clientes</h1>
          </div>
          <Link href="/clients/new">
            <Button className="bg-primary hover:bg-primary/90 font-bold rounded-xl h-10 shadow-md">
              <Plus size={18} className="mr-1" /> Registrar Cliente
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 space-y-6">
        <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, RUT o razón social..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10 h-12 bg-muted/30 border-none rounded-xl font-bold" 
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-bold text-primary uppercase tracking-widest text-xs">Cargando base de datos...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground italic">
                No se encontraron clientes registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-black text-[10px] uppercase py-4 pl-6">Cliente / Empresa</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">RUT</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Contacto</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Estado</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase pr-6">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/10">
                        <TableCell className="py-4 pl-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-primary uppercase">{client.nombreCliente}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">{client.razonSocial || "Sin razón social"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-xs">{client.rutCliente}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {client.telefonoCliente && <span className="text-[10px] flex items-center gap-1 font-medium"><Phone size={10} className="text-primary"/> {client.telefonoCliente}</span>}
                            {client.emailClientes && <span className="text-[10px] flex items-center gap-1 font-medium"><Mail size={10} className="text-primary"/> {client.emailClientes}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[9px] font-bold border-none", client.estadoCliente === 'Inactivo' ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-primary")}>
                            {client.estadoCliente?.toUpperCase() || 'ACTIVO'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Link href={`/clients/${client.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary hover:text-white rounded-xl">
                                <Pencil size={16} />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-destructive hover:bg-destructive hover:text-white rounded-xl"
                              onClick={() => setDeleteId(client.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-primary uppercase">¿Eliminar Cliente?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente y eliminará todos los datos asociados a este cliente en el sistema ICSA.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white rounded-xl font-bold">Confirmar Eliminación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
