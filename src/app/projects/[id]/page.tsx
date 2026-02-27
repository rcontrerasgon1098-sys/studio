
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Briefcase, Calendar, User, FileCheck, Plus, CheckCircle2, History as HistoryIcon, Clock, Eye, Pencil, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useFirebase, useDoc, useCollection, useMemoFirebase, useUserProfile } from "@/firebase";
import { doc, collection, query, where, getDocs, writeBatch, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore: db, user } = useFirebase();
  const { userProfile, isProfileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const [closing, setClosing] = useState(false);

  const projectRef = useMemoFirebase(() => (db ? doc(db, "projects", id) : null), [db, id]);
  const { data: project, isLoading: isProjectLoading, error: projectError } = useDoc(projectRef);

  const isAdmin = userProfile?.rol_t === 'admin' || userProfile?.rol_t === 'Administrador';

  const activeOtsQuery = useMemoFirebase(() => (db ? query(collection(db, "ordenes"), where("projectId", "==", id)) : null), [db, id]);
  const { data: activeOts, isLoading: isActiveLoading } = useCollection(activeOtsQuery);

  const historyOtsQuery = useMemoFirebase(() => (db ? query(collection(db, "historial"), where("projectId", "==", id)) : null), [db, id]);
  const { data: historyOts, isLoading: isHistoryLoading } = useCollection(historyOtsQuery);

  const handleCloseProject = async () => {
    if (!user || !db || !project) return;
    setClosing(true);
    
    try {
      // 1. Obtener todas las OTs relacionadas (activas e históricas)
      const activeSnap = await getDocs(query(collection(db, "ordenes"), where("projectId", "==", id)));
      const historySnap = await getDocs(query(collection(db, "historial"), where("projectId", "==", id)));
      
      const allOts = [...activeSnap.docs, ...historySnap.docs].map(d => d.data());
      
      // 2. Generar texto del resumen
      const summaryText = `ACTA DE CIERRE FINAL - PROYECTO: ${project.name.toUpperCase()}
--------------------------------------------------
Resumen consolidado de trabajos realizados:
${allOts.map((ot) => `- Folio #${ot.folio}: ${ot.description || 'Sin descripción'}`).join('\n')}

Este documento certifica la entrega total y recepción conforme de todas las etapas del proyecto mencionado.`;

      const batch = writeBatch(db);

      // 3. Actualizar estado del proyecto
      batch.update(doc(db, "projects", id), {
        status: 'Completed',
        endDate: new Date().toISOString(),
        summary: summaryText
      });

      // 4. Crear Acta Final como una OT pendiente
      const summaryOtId = `ACTA-${id}`;
      const summaryOtData = {
        id: summaryOtId,
        folio: Math.floor(100000 + Math.random() * 900000),
        projectId: id,
        isProjectSummary: true,
        clientName: project.clientName || "Sin Cliente",
        clientId: project.clientId || "",
        createdBy: user.uid,
        status: 'Pendiente',
        description: summaryText,
        startDate: project.startDate || new Date().toISOString(),
        address: allOts[0]?.address || 'Dirección de Proyecto',
        building: allOts[0]?.building || '',
        floor: allOts[0]?.floor || '',
        updatedAt: new Date().toISOString(),
        team: project.teamNames || [user.email || "Admin"],
        teamIds: project.teamIds || [user.uid]
      };

      batch.set(doc(db, "ordenes", summaryOtId), summaryOtData);

      await batch.commit();
      toast({ title: "Proyecto Finalizado", description: "Se ha generado el acta de cierre en órdenes pendientes." });
      router.refresh();
    } catch (e: any) {
      console.error("Error closing project:", e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar el proyecto: " + e.message });
    } finally {
      setClosing(false);
    }
  };

  if (isProjectLoading || isProfileLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary animate-pulse font-black uppercase tracking-tighter">Cargando Proyecto...</div>;
  
  if (projectError || !project) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center font-bold text-muted-foreground bg-background gap-6">
      <AlertTriangle className="h-20 w-20 text-destructive/20" />
      <div className="space-y-2">
        <h1 className="text-xl font-black text-primary uppercase">Proyecto no encontrado</h1>
        <p className="text-sm font-medium">No se pudo cargar la información del proyecto.</p>
      </div>
      <Link href="/dashboard">
        <Button variant="outline" className="font-black uppercase text-xs tracking-widest rounded-xl">Volver al Panel</Button>
      </Link>
    </div>
  );

  const isCompleted = project.status === 'Completed' || project.status === 'Completado';

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted"><ArrowLeft /></Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-sm md:text-xl font-black text-primary uppercase tracking-tighter leading-none">{project.name}</h1>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 hidden sm:block">Control de Proyecto ICSA</p>
            </div>
          </div>
          {!isCompleted && (
            <Button onClick={handleCloseProject} disabled={closing} className="bg-primary hover:bg-primary/90 text-white font-black h-10 px-4 rounded-xl shadow-lg uppercase text-[10px] tracking-widest">
              {closing ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">Finalizar Obra</span>
              <span className="sm:hidden">Cerrar</span>
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-5xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-xl border-none rounded-3xl overflow-hidden h-fit">
            <CardHeader className="bg-primary/5 border-b p-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Ficha del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-2xl">
                  <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Cliente</Label>
                  <p className="font-black text-primary text-base mt-1 flex items-center gap-2">
                    <User size={16} className="opacity-40" /> {project.clientName}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div>
                    <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Estado</Label>
                    <div className="mt-1">
                      <Badge className={cn(
                        "font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-tighter border-none", 
                        isCompleted ? 'bg-accent/20 text-primary' : 'bg-primary/10 text-primary'
                      )}>
                        {!isCompleted ? 'EN EJECUCIÓN' : 'PROYECTO CERRADO'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Fecha Inicio</Label>
                    <p className="font-bold flex items-center gap-2 text-xs text-primary mt-1">
                      <Calendar size={14} className="opacity-40" /> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {project.endDate && (
                  <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20">
                    <Label className="text-[9px] uppercase font-black text-primary tracking-widest">Fecha de Cierre</Label>
                    <p className="font-black flex items-center gap-2 text-xs text-primary mt-1">
                      <FileCheck size={14} /> {new Date(project.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-white p-6">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-primary tracking-widest">
                  <Clock className="h-5 w-5" /> Órdenes en Curso
                </CardTitle>
                {!isCompleted && (
                  <Link href={`/work-orders/new?projectId=${id}&clientId=${project.clientId}&clientName=${encodeURIComponent(project.clientName || '')}`}>
                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 transition-all">
                      <Plus size={16} className="mr-2"/> Nueva OT
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <OTTable orders={activeOts || []} isLoading={isActiveLoading} />
              </CardContent>
            </Card>

            <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/10 border-b p-6">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-primary tracking-widest">
                  <HistoryIcon className="h-5 w-5" /> Histórico del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <OTTable orders={historyOts || []} isLoading={isHistoryLoading} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function OTTable({ orders, isLoading }: { orders: any[], isLoading: boolean }) {
  if (isLoading) return <div className="p-16 text-center animate-pulse text-primary font-black uppercase text-[10px] tracking-widest">Sincronizando...</div>;
  if (orders.length === 0) return <div className="p-16 text-center text-muted-foreground italic text-xs font-medium flex flex-col items-center gap-3">
    <Clock className="h-10 w-10 opacity-10" />
    Sin registros asociados.
  </div>;

  return (
    <div className="min-w-[450px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 pl-6 text-primary">Folio</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-primary">Descripción</TableHead>
            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-4 pr-6 text-primary">Gestión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((ot) => {
            const isPending = ot.status === 'Pendiente' || ot.status === 'Pending';
            return (
              <TableRow key={ot.id} className="hover:bg-primary/5 transition-colors border-b border-muted/20">
                <TableCell className="font-black text-primary text-xs pl-6 py-4">
                  #{ot.folio} {ot.isProjectSummary && <Badge className="bg-primary text-white text-[7px] ml-2 px-1.5 uppercase font-black">ACTA</Badge>}
                </TableCell>
                <TableCell className="text-[10px] font-bold text-muted-foreground">
                  <p className="line-clamp-1 max-w-[200px]">{ot.description || "N/A"}</p>
                </TableCell>
                <TableCell className="text-right pr-6 py-4">
                  <div className="flex justify-end gap-1">
                    {isPending ? (
                      <Link href={`/work-orders/${ot.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary hover:text-white rounded-xl"><Pencil className="h-5 w-5" /></Button>
                      </Link>
                    ) : (
                      <Link href={`/work-orders/${ot.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary hover:text-white rounded-xl"><Eye className="h-5 w-5" /></Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
