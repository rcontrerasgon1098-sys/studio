
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFirestore, useUser, useUserProfile } from "@/firebase";
import { collection, getDocs, writeBatch, query, where, deleteField } from "firebase/firestore";
import { Loader2, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function MigrationPage() {
  const { user } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const db = useFirestore();
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");

  const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  const runMigration = async () => {
    if (!db || !user) return;
    setIsMigrating(true);
    setStatus("running");
    setLog([]);
    addLog("Iniciando depuración y migración de datos...");

    try {
      const batch = writeBatch(db);
      let count = 0;

      // 1. Corregir Historial: Asegurar createdBy y eliminar supervisorId
      addLog("Consultando historial...");
      const historialSnap = await getDocs(collection(db, "historial"));
      addLog(`Encontrados ${historialSnap.size} documentos en historial.`);

      for (const d of historialSnap.docs) {
        const data = d.data();
        const updates: any = {};

        // Eliminar campo supervisorId si existe
        if ("supervisorId" in data) {
          updates.supervisorId = deleteField();
        }

        if (!data.createdBy) {
          if (data.technicianId) {
            updates.createdBy = data.technicianId;
            addLog(`Fijando createdBy=${data.technicianId} para OT #${data.folio}`);
          } else if (data.techName) {
             const personnelSnap = await getDocs(query(collection(db, "personnel"), where("nombre_t", "==", data.techName)));
             if (!personnelSnap.empty) {
               const pId = personnelSnap.docs[0].id;
               updates.createdBy = pId;
               addLog(`Deducido createdBy=${pId} por nombre para OT #${data.folio}`);
             }
          }
        }

        if (Object.keys(updates).length > 0) {
          batch.update(d.ref, { ...updates, _migratedAt: new Date().toISOString() });
          count++;
        }
      }

      // 2. Corregir Ordenes Activas: Eliminar supervisorId
      addLog("Consultando órdenes activas...");
      const ordenesSnap = await getDocs(collection(db, "ordenes"));
      for (const d of ordenesSnap.docs) {
        const data = d.data();
        const updates: any = {};
        
        if ("supervisorId" in data) {
          updates.supervisorId = deleteField();
        }

        if (!data.technicianId && data.techName) {
            const personnelSnap = await getDocs(query(collection(db, "personnel"), where("nombre_t", "==", data.techName)));
            if (!personnelSnap.empty) {
                updates.technicianId = personnelSnap.docs[0].id;
                addLog(`Actualizado technicianId para activa OT #${data.folio}`);
            }
        }

        if (Object.keys(updates).length > 0) {
          batch.update(d.ref, updates);
          count++;
        }
      }

      if (count > 0) {
        await batch.commit();
        addLog(`Éxito: Se actualizaron/limpiaron ${count} documentos.`);
      } else {
        addLog("No se encontraron documentos inconsistentes.");
      }

      setStatus("completed");
      toast({ title: "Depuración Finalizada", description: `Se corrigieron ${count} registros.` });
    } catch (e: any) {
      addLog(`ERROR: ${e.message}`);
      setStatus("error");
      toast({ variant: "destructive", title: "Error en Migración", description: e.message });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isProfileLoading) return <div className="p-20 text-center animate-pulse font-black text-primary">CARGANDO PERFIL...</div>;

  if (userProfile?.rol_t !== "admin" && userProfile?.rol_t !== "Administrador") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/20">
        <ShieldAlert className="h-20 w-20 text-destructive mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-tighter">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2 font-medium">Solo los administradores pueden ejecutar scripts de migración.</p>
        <Link href="/dashboard" className="mt-6">
          <Button variant="outline" className="font-bold">Volver al Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="border-2 border-primary/20 shadow-xl overflow-hidden rounded-2xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-tighter">
              <AlertTriangle className="text-destructive" /> Utilidad de Depuración de Datos
            </CardTitle>
            <CardDescription className="font-medium text-xs">
              Este script normaliza el historial agregando el campo <strong>createdBy</strong> y eliminando el campo inexistente <strong>supervisorId</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20">
              <p className="text-[10px] font-black text-destructive flex items-center gap-2 uppercase tracking-widest">
                <AlertTriangle className="h-4 w-4" /> Atención: Esta acción modificará registros en producción.
              </p>
            </div>

            <Button 
              onClick={runMigration} 
              disabled={isMigrating} 
              className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-lg rounded-xl"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Procesando Depuración...
                </>
              ) : (
                "Iniciar Reparación de BD"
              )}
            </Button>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Log de Consola</Label>
              <div className="bg-black text-green-400 p-4 rounded-xl font-mono text-[10px] h-64 overflow-y-auto border-2 border-primary/20 shadow-inner">
                {log.length === 0 && <p className="opacity-40 italic">Esperando ejecución del proceso...</p>}
                {log.map((line, i) => (
                  <p key={i} className="mb-1">{line}</p>
                ))}
                {status === "completed" && (
                  <p className="text-white mt-4 font-black flex items-center gap-2 uppercase tracking-widest">
                    <CheckCircle2 className="h-4 w-4 text-green-400" /> Proceso finalizado con éxito.
                  </p>
                )}
              </div>
            </div>

            {status === "completed" && (
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full h-12 font-black uppercase text-xs tracking-widest rounded-xl">
                  Volver al Panel de Control
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
