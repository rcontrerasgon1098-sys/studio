
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Briefcase, Calendar, User, FileCheck, Plus, CheckCircle2, History as HistoryIcon, Clock } from "lucide-react";
import Link from "next/link";
import { useFirebase, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { closeProject } from "@/ai/flows/close-project-flow";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore: db, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [closing, setClosing] = useState(false);

  const projectRef = useMemoFirebase(() => (db ? doc(db, "projects", id) : null), [db, id]);
  const { data: project, isLoading: isProjectLoading } = useDoc(projectRef);

  const activeOtsQuery = useMemoFirebase(() => (db ? query(collection(db, "ordenes"), where("projectId", "==", id)) : null), [db, id]);
  const { data: activeOts, isLoading: isActiveLoading } = useCollection(activeOtsQuery);

  const historyOtsQuery = useMemoFirebase(() => (db ? query(collection(db, "historial"), where("projectId", "==", id)) : null), [db, id]);
  const { data: historyOts, isLoading: isHistoryLoading } = useCollection(historyOtsQuery);

  const handleCloseProject = async () => {
    if (!user) return;
    setClosing(true);
    try {
      const result = await closeProject({ projectId: id, closedByUid: user.uid });
      if (result.success) {
        toast({ title: "Proyecto Finalizado", description: "Se ha generado el resumen en el historial." });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error al cerrar proyecto" });
    } finally {
      setClosing(false);
    }
  };

  if (isProjectLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary animate-pulse font-black">CARGANDO PROYECTO...</div>;
  if (!project) return <div className="p-20 text-center font-bold text-muted-foreground">El proyecto no existe.</div>;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <header className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-primary uppercase tracking-tighter leading-none">{project.name}</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Proyecto de Ingeniería ICSA</p>
          </div>
        </div>
        <div className="flex gap-2">
          {project.status === 'Active' && (
            <Button onClick={handleCloseProject} disabled={closing} className="bg-primary hover:bg-primary/90 font-black px-6 h-12 rounded-xl shadow-lg uppercase text-xs">
              {closing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Finalizar Obra y Generar Acta
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ficha del Proyecto */}
          <Card className="lg:col-span-1 shadow-xl border-none h-fit">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Detalle de Obra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-[9px] uppercase font-black text-muted-foreground">Cliente</Label>
                  <p className="font-bold flex items-center gap-2 text-primary mt-1"><User size={14}/> {project.clientName}</p>
                </div>
                <div>
                  <Label className="text-[9px] uppercase font-black text-muted-foreground">Estado Actual</Label>
                  <div className="mt-1">
                    <Badge className={cn("font-black text-[9px] tracking-tighter", project.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-primary')}>
                      {project.status === 'Active' ? 'EN EJECUCIÓN' : 'PROYECTO CERRADO'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-[9px] uppercase font-black text-muted-foreground">Fecha Inicio</Label>
                  <p className="font-bold flex items-center gap-2 text-xs mt-1"><Calendar size={14}/> {new Date(project.startDate).toLocaleDateString()}</p>
                </div>
                {project.endDate && (
                  <div>
                    <Label className="text-[9px] uppercase font-black text-muted-foreground">Fecha Cierre</Label>
                    <p className="font-bold flex items-center gap-2 text-xs text-accent mt-1"><FileCheck size={14}/> {new Date(project.endDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Listado de OTs */}
          <div className="lg:col-span-2 space-y-6">
            {/* OTs Activas */}
            <Card className="shadow-lg border-none overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> OTs Activas del Proyecto
                </CardTitle>
                {project.status === 'Active' && (
                  <Link href={`/work-orders/new?projectId=${id}&clientId=${project.clientId}`}>
                    <Button variant="outline" size="sm" className="h-8 font-black uppercase text-[9px] tracking-widest">
                      <Plus size={14} className="mr-1"/> Añadir OT
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <OTTable orders={activeOts || []} isLoading={isActiveLoading} />
              </CardContent>
            </Card>

            {/* OTs Históricas */}
            <Card className="shadow-lg border-none overflow-hidden">
              <CardHeader className="bg-muted/10 border-b">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4 text-primary" /> Historial de la Obra
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
  if (isLoading) return <div className="p-10 text-center animate-pulse">CARGANDO...</div>;
  if (orders.length === 0) return <div className="p-10 text-center text-muted-foreground italic text-xs">Sin registros asociados.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="font-bold text-[10px] uppercase">Folio</TableHead>
          <TableHead className="font-bold text-[10px] uppercase">Descripción</TableHead>
          <TableHead className="text-right font-bold text-[10px] uppercase">Ver</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((ot) => (
          <TableRow key={ot.id}>
            <TableCell className="font-black text-primary text-xs">
              #{ot.folio} {ot.isProjectSummary && <Badge className="bg-accent/20 text-primary text-[7px] ml-1">ACTA FINAL</Badge>}
            </TableCell>
            <TableCell className="text-[10px] font-medium text-muted-foreground line-clamp-1 max-w-[200px]">
              {ot.description || "N/A"}
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/work-orders/${ot.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><Eye className="h-4 w-4" /></Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
