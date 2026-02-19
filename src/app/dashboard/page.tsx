
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { 
  Plus, FileText, Search, LogOut, LayoutDashboard, 
  Eye, Download, Menu, Users, UserRound, 
  Pencil, Trash2, PieChart as PieChartIcon,
  History, Activity, TrendingUp, Trophy, Building, ShieldCheck, Loader2,
  UserX, UserCheck
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirebase, useCollection, useMemoFirebase, useUserProfile } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
import {
  PieChart,
  Pie,
  Cell as RechartsCell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function Dashboard() {
  const { user, isUserLoading, auth, firestore: db } = useFirebase();
  const { userProfile, isProfileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'clients' | 'personnel' | 'ordenes' | 'historial' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // Consultas unificadas por createdBy
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !userProfile) return null;
    const baseCollection = collection(db, "ordenes");
    if (userProfile.rol_t === 'supervisor' || userProfile.rol_t === 'Supervisor') {
      return query(baseCollection, where("createdBy", "==", user.uid));
    }
    if (userProfile.rol_t === 'admin' || userProfile.rol_t === 'Administrador') {
      return query(baseCollection, orderBy("startDate", "desc"));
    }
    return null;
  }, [db, user?.uid, userProfile]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !userProfile) return null;
    const baseCollection = collection(db, "historial");
    if (userProfile.rol_t === 'supervisor' || userProfile.rol_t === 'Supervisor') {
      return query(baseCollection, where("createdBy", "==", user.uid));
    }
    if (userProfile.rol_t === 'admin' || userProfile.rol_t === 'Administrador') {
      return query(baseCollection, orderBy("startDate", "desc"));
    }
    return null;
  }, [db, user?.uid, userProfile]);
  const { data: history, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !userProfile || (userProfile.rol_t !== 'admin' && userProfile.rol_t !== 'Administrador')) return null;
    return query(collection(db, "clients"), orderBy("nombreCliente", "asc"));
  }, [db, userProfile]);
  const { data: clients, isLoading: isClientsLoading } = useCollection(clientsQuery);

  const personnelQuery = useMemoFirebase(() => {
    if (!db || !userProfile || (userProfile.rol_t !== 'admin' && userProfile.rol_t !== 'Administrador')) return null;
    return query(collection(db, "personnel"), orderBy("nombre_t", "asc"));
  }, [db, userProfile]);
  const { data: personnel, isLoading: isPersonnelLoading } = useCollection(personnelQuery);

  // Stats
  const statsData = useMemo(() => {
    const pendingCount = orders?.length || 0;
    const completedCount = history?.length || 0;
    return [
      { name: "Pendientes", value: pendingCount, color: "hsl(var(--primary))" },
      { name: "Completadas", value: completedCount, color: "hsl(var(--accent))" }
    ];
  }, [orders, history]);

  const supervisorPerformanceData = useMemo(() => {
    if (!orders || !history || !personnel) return [];
    const allWorkOrders = [...orders, ...history];
    const countMap = new Map<string, number>();
    allWorkOrders.forEach(order => {
      const creatorId = order.createdBy;
      if (creatorId) {
        countMap.set(creatorId, (countMap.get(creatorId) || 0) + 1);
      }
    });
    return Array.from(countMap.entries())
      .map(([uid, count]) => {
        const person = personnel.find(p => p.id === uid);
        return {
          name: person?.nombre_t || uid.substring(0, 5),
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders, history, personnel]);

  const clientRankingData = useMemo(() => {
    if (!orders || !history) return [];
    const allWorkOrders = [...orders, ...history];
    const countMap = new Map<string, number>();
    allWorkOrders.forEach(order => {
      const client = order.clientName;
      if (client) {
        countMap.set(client, (countMap.get(client) || 0) + 1);
      }
    });
    return Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders, history]);
  
  // Filtros dinámicos
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const folioStr = o.folio?.toString() || "";
      const clientStr = o.clientName?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return folioStr.includes(searchTerm) || clientStr.includes(term);
    });
  }, [orders, searchTerm]);

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter(o => {
      const folioStr = o.folio?.toString() || "";
      const clientStr = o.clientName?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return folioStr.includes(searchTerm) || clientStr.includes(term);
    });
  }, [history, searchTerm]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => {
      const name = c.nombreCliente?.toLowerCase() || "";
      const rut = c.rutCliente?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return name.includes(term) || rut.includes(term);
    });
  }, [clients, searchTerm]);

  const filteredPersonnel = useMemo(() => {
    if (!personnel) return [];
    return personnel.filter(p => {
      const name = p.nombre_t?.toLowerCase() || "";
      const rut = p.rut_t?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return name.includes(term) || rut.includes(term);
    });
  }, [personnel, searchTerm]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/login");
  };

  const handleDelete = () => {
    if (!deleteConfirm || !db) return;

    // Si es personal, implementamos DESACTIVACIÓN en lugar de eliminación física
    // para permitir reingresos con el mismo correo.
    if (deleteConfirm.type === 'personnel') {
      const docRef = doc(db, 'personnel', deleteConfirm.id);
      updateDocumentNonBlocking(docRef, { 
        estado_t: "Inactivo",
        updatedAt: new Date().toISOString()
      });
      toast({ 
        title: "Personal Desactivado", 
        description: "El acceso ha sido revocado. El perfil permanece en el sistema para posibles reingresos." 
      });
    } else {
      // Para clientes y órdenes, mantenemos eliminación definitiva
      const docRef = doc(db, deleteConfirm.type, deleteConfirm.id);
      deleteDocumentNonBlocking(docRef);
      toast({ 
        title: "Registro eliminado", 
        description: "El elemento ha sido removido permanentemente del sistema." 
      });
    }
    setDeleteConfirm(null);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-8">
      <div className="flex flex-col items-center mb-12 px-6">
        {logoImage && (
          <div className="relative w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl mb-4 p-2">
            <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain p-2" />
          </div>
        )}
        <div className="flex flex-col items-center text-center leading-none">
          <span className="font-black text-2xl tracking-tighter text-white">ICSA</span>
          <span className="text-[9px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1 text-white">ingeniería comunicaciones S.A.</span>
        </div>
      </div>
      <nav className="flex-1 space-y-2 px-4">
        <Button 
          variant={activeTab === "dashboard" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "dashboard" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("dashboard"); setSearchTerm(""); }}
        >
          <LayoutDashboard size={20} /> Inicio
        </Button>
        {(userProfile?.rol_t === 'admin' || userProfile?.rol_t === 'Administrador') && <Button 
          variant={activeTab === "stats" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "stats" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("stats"); setSearchTerm(""); }}
        >
          <PieChartIcon size={20} /> Estadísticas
        </Button>}
        <Button 
          variant={activeTab === "orders" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "orders" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("orders"); setSearchTerm(""); }}
        >
          <FileText size={20} /> Órdenes Activas
        </Button>
        <Button 
          variant={activeTab === "history" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "history" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("history"); setSearchTerm(""); }}
        >
          <History size={20} /> Historial
        </Button>
        {(userProfile?.rol_t === 'admin' || userProfile?.rol_t === 'Administrador') && <>
          <Button 
            variant={activeTab === "clients" ? "secondary" : "ghost"} 
            className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "clients" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
            onClick={() => { setActiveTab("clients"); setSearchTerm(""); }}
          >
            <Users size={20} /> Clientes
          </Button>
          <Button 
            variant={activeTab === "personnel" ? "secondary" : "ghost"} 
            className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "personnel" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
            onClick={() => { setActiveTab("personnel"); setSearchTerm(""); }}
          >
            <UserRound size={20} /> Personal
          </Button>
        </>}
      </nav>
      <div className="px-4 mt-auto">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 hover:bg-white/20 text-white/70 hover:text-white h-12">
          <LogOut size={20} /> Salir
        </Button>
      </div>
    </div>
  );

  const isLoading = isOrdersLoading || isHistoryLoading || !mounted || isProfileLoading;
  if (isUserLoading || !mounted || isProfileLoading) return <div className="min-h-screen flex items-center justify-center text-primary font-black animate-pulse bg-background">CARGANDO...</div>;

  const isAdmin = userProfile?.rol_t === 'admin' || userProfile?.rol_t === 'Administrador';

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-72 bg-primary text-white hidden md:flex flex-col shadow-2xl">
        <SidebarContent />
      </aside>

      <header className="md:hidden bg-primary p-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-primary p-0 border-none w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="font-black text-xl text-white">ICSA</span>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight uppercase">
              {activeTab === "dashboard" ? (userProfile?.nombre_t ? `BIENVENIDO, ${userProfile.nombre_t}` : "Inicio") : 
               activeTab === "stats" ? "Estadísticas Operativas" :
               activeTab === "orders" ? "Órdenes Activas" : 
               activeTab === "history" ? "Historial de Trabajo" : 
               activeTab === "clients" ? "Listado de Clientes" : "Gestión de Personal"}
            </h1>
          </div>
          <div className="flex-shrink-0">
            {activeTab === "dashboard" && (
              <Link href="/work-orders/new">
                <Button className="bg-accent text-primary font-black h-12 px-6 shadow-lg rounded-xl">
                  <Plus size={20} className="mr-2" /> Nueva Orden
                </Button>
              </Link>
            )}
            {activeTab === "clients" && isAdmin && (
                <Link href="/clients/new">
                <Button className="bg-accent text-primary font-black h-12 px-6 shadow-lg rounded-xl">
                    <Plus size={20} className="mr-2" /> Nuevo Cliente
                </Button>
                </Link>
            )}
            {activeTab === "personnel" && isAdmin && (
                <Link href="/technicians/new">
                <Button className="bg-accent text-primary font-black h-12 px-6 shadow-lg rounded-xl">
                    <Plus size={20} className="mr-2" /> Nuevo Personal
                </Button>
                </Link>
            )}
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <Card className="shadow-lg border-none bg-white rounded-2xl overflow-hidden group">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Órdenes Activas</p>
                  <h3 className="text-4xl font-black text-primary leading-none mt-1">
                    {isOrdersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (orders?.length || 0)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-none bg-white rounded-2xl">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-bold">Resumen de Actividad</CardTitle>
                <CardDescription>Visualización inmediata de órdenes asignadas.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <OrderTable orders={orders || []} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "stats" && isAdmin && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-none shadow-md overflow-hidden rounded-2xl">
                <CardHeader className="border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-primary" /> Carga Global
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statsData.map((entry, index) => (
                            <RechartsCell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-md overflow-hidden rounded-2xl">
                <CardHeader className="border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" /> Top Supervisores
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={supervisorPerformanceData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold' }} width={120} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-md overflow-hidden rounded-2xl">
                <CardHeader className="border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Ranking Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clientRankingData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
             <CardHeader className="border-b space-y-4">
               <CardTitle className="text-lg font-bold">Órdenes en Curso</CardTitle>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Buscar por folio o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-muted/20 border-none" />
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <OrderTable orders={filteredOrders} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
             </CardContent>
          </Card>
        )}

        {activeTab === "history" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
             <CardHeader className="border-b space-y-4">
               <CardTitle className="text-lg font-bold">Archivo Histórico</CardTitle>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Buscar en historial..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-muted/20 border-none" />
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <OrderTable orders={filteredHistory} isLoading={isHistoryLoading} type="historial" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin}/>
             </CardContent>
          </Card>
        )}

        {activeTab === "clients" && isAdmin && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
             <CardHeader className="border-b space-y-4">
               <CardTitle className="text-lg font-bold">Clientes</CardTitle>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Buscar por nombre o RUT..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-muted/20 border-none" />
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <ClientTable clients={filteredClients} isLoading={isClientsLoading} setDeleteConfirm={setDeleteConfirm} />
             </CardContent>
          </Card>
        )}

        {activeTab === "personnel" && isAdmin && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
             <CardHeader className="border-b space-y-4">
               <CardTitle className="text-lg font-bold">Personal</CardTitle>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Buscar por nombre o RUT..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-muted/20 border-none" />
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <PersonnelTable personnel={filteredPersonnel} isLoading={isPersonnelLoading} setDeleteConfirm={setDeleteConfirm} />
             </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-black uppercase">
              {deleteConfirm?.type === 'personnel' ? "Confirmar Desactivación" : "Confirmar Eliminación Definitiva"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'personnel' 
                ? "Esta acción revocará el acceso del personal. Los datos se mantendrán en el sistema para permitir un futuro reingreso sin dramas."
                : "Esta acción eliminará el registro de forma permanente. Esta operación no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 font-black">
              {deleteConfirm?.type === 'personnel' ? "Desactivar Acceso" : "Eliminar de todo el sistema"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OrderTable({ orders, isLoading, type, setDeleteConfirm, isAdmin }: { orders: any[], isLoading: boolean, type: string, setDeleteConfirm: any, isAdmin: boolean }) {
  if (isLoading) return <div className="p-10 text-center font-bold text-muted-foreground animate-pulse">Cargando registros...</div>;
  if (orders.length === 0) return <div className="p-10 text-center text-muted-foreground">Sin registros.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="font-bold">Folio</TableHead>
          <TableHead className="font-bold">Cliente</TableHead>
          <TableHead className="font-bold">Fecha</TableHead>
          <TableHead className="font-bold">Estado</TableHead>
          <TableHead className="text-right font-bold">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} className="hover:bg-muted/10">
            <TableCell className="font-black text-primary">#{order.folio}</TableCell>
            <TableCell className="font-bold">{order.clientName}</TableCell>
            <TableCell className="text-xs">{order.startDate ? new Date(order.startDate).toLocaleDateString() : "N/A"}</TableCell>
            <TableCell>
              <Badge className={cn("border-none text-[10px] px-2 py-0.5 uppercase font-bold", order.status === 'Completed' ? 'bg-accent/15 text-primary' : 'bg-primary/10 text-primary')}>
                {order.status === 'Completed' ? 'Completado' : order.status === 'Pending Signature' ? 'Esperando Firma' : 'En Curso'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {order.status === 'Completed' ? (
                  <Link href={`/work-orders/${order.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                  </Link>
                ) : (
                  <Link href={`/work-orders/${order.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><Pencil className="h-4 w-4" /></Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => generateWorkOrderPDF(order)} disabled={order.status === 'Pending'}><Download className="h-4 w-4" /></Button>
                {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm({ id: order.id, type })}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ClientTable({ clients, isLoading, setDeleteConfirm }: { clients: any[], isLoading: boolean, setDeleteConfirm: any }) {
  if (isLoading) return <div className="p-10 text-center font-bold text-muted-foreground animate-pulse">Cargando Clientes...</div>;
  if (clients.length === 0) return <div className="p-10 text-center text-muted-foreground">Sin clientes.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="font-bold">Nombre</TableHead>
          <TableHead className="font-bold">RUT</TableHead>
          <TableHead className="font-bold">Estado</TableHead>
          <TableHead className="text-right font-bold">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id} className="hover:bg-muted/10">
            <TableCell className="font-bold text-primary flex items-center gap-2">
              <Building className="h-4 w-4 opacity-40" /> {client.nombreCliente}
            </TableCell>
            <TableCell className="text-xs font-medium">{client.rutCliente}</TableCell>
            <TableCell>
              <Badge variant={client.estadoCliente === "Activo" ? "default" : "secondary"} className="text-[10px] px-2 py-0">
                {client.estadoCliente}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Link href={`/clients/${client.id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm({ id: client.id, type: "clients" })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PersonnelTable({ personnel, isLoading, setDeleteConfirm }: { personnel: any[], isLoading: boolean, setDeleteConfirm: any }) {
  if (isLoading) return <div className="p-10 text-center font-bold text-muted-foreground animate-pulse">Cargando Personal...</div>;
  if (personnel.length === 0) return <div className="p-10 text-center text-muted-foreground">Sin personal registrado.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="font-bold">Nombre</TableHead>
          <TableHead className="font-bold">Rol</TableHead>
          <TableHead className="font-bold">Estado</TableHead>
          <TableHead className="text-right font-bold">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {personnel.map((person) => (
          <TableRow key={person.id} className="hover:bg-muted/10">
            <TableCell className="font-bold text-primary flex items-center gap-2">
              <UserRound className="h-4 w-4 opacity-40" /> {person.nombre_t}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-[10px] px-2 py-0 uppercase border-primary/30 text-primary">
                {person.rol_t}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={person.estado_t === "Activo" ? "default" : "destructive"} className="text-[10px] px-2 py-0">
                {person.estado_t || "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Link href={`/technicians/${person.id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar datos"><Pencil className="h-4 w-4" /></Button>
                </Link>
                {person.estado_t === "Inactivo" ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-accent"
                    title="Re-activar Personal"
                    onClick={() => {
                      const docRef = doc(db as any, 'personnel', person.id);
                      updateDocumentNonBlocking(docRef, { estado_t: "Activo" });
                    }}
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    title="Desactivar Acceso"
                    onClick={() => setDeleteConfirm({ id: person.id, type: "personnel" })}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
