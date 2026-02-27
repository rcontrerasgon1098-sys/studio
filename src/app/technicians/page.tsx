
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowLeft, Pencil, Trash2, User, Mail, ShieldCheck, Loader2, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useUserProfile } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

export default function TechniciansListPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = userProfile?.rol_t === 'admin' || userProfile?.rol_t === 'Administrador';

  const personnelQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "personnel"), orderBy("nombre_t", "asc"));
  }, [db]);

  const { data: staff, isLoading } = useCollection(personnelQuery);

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    return staff.filter(s => 
      s.nombre_t?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email_t?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rol_t?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  const handleDelete = () => {
    if (!deleteId || !db) return;
    deleteDocumentNonBlocking(doc(db, "personnel", deleteId));
    toast({ title: "Perfil de personal eliminado" });
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
            <h1 className="font-black text-lg text-primary uppercase tracking-tighter">Control de Personal</h1>
          </div>
          {isAdmin && (
            <Link href="/technicians/new">
              <Button className="bg-primary hover:bg-primary/90 font-bold rounded-xl h-10 shadow-md">
                <Plus size={18} className="mr-1" /> Registrar Personal
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 space-y-6">
        <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, email o rol..." 
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
                <p className="font-bold text-primary uppercase tracking-widest text-xs">Sincronizando nómina...</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground italic">
                No hay personal registrado en el sistema.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-black text-[10px] uppercase py-4 pl-6">Nombre del Colaborador</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Email / Contacto</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Rol</TableHead>
                      <TableHead className="font-black text-[10px] uppercase">Estado</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase pr-6">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((person) => (
                      <TableRow key={person.id} className="hover:bg-muted/10">
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                              {person.nombre_t?.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-primary uppercase text-xs">{person.nombre_t}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium flex items-center gap-1"><Mail size={10} className="text-muted-foreground"/> {person.email_t}</span>
                            {person.cel_t && <span className="text-[10px] text-muted-foreground">{person.cel_t}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[9px] font-black uppercase bg-primary/5 text-primary border-none">
                            {person.rol_t}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[9px] font-bold border-none", person.estado_t === 'Inactivo' ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-primary")}>
                            {person.estado_t?.toUpperCase() || 'ACTIVO'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex justify-end gap-2">
                            {isAdmin && (
                              <>
                                <Link href={`/technicians/${person.id}/edit`}>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary hover:text-white rounded-xl" title="Editar Perfil">
                                    <Pencil size={16} />
                                  </Button>
                                </Link>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 text-destructive hover:bg-destructive hover:text-white rounded-xl"
                                  onClick={() => setDeleteId(person.id)}
                                  title="Eliminar Perfil"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </>
                            )}
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
            <AlertDialogTitle className="font-black text-primary uppercase">¿Eliminar Perfil de Personal?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción revocará el acceso de este usuario al sistema ICSA de forma inmediata. Se recomienda desactivar en lugar de eliminar si tiene registros históricos.</AlertDialogDescription>
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
