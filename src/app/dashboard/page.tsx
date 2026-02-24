
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { 
  Plus, FileText, Search, LogOut, LayoutDashboard, 
  Eye, Download, Menu, Users, UserRound, 
  Pencil, Trash2, PieChart as PieChartIcon,
  History, Activity, Building, ShieldCheck, Loader2,
  Briefcase, FolderOpen, ClipboardList
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
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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

export default function Dashboard() {
  const { user, isUserLoading, auth, firestore: db } = useFirebase();
  const { userProfile, isProfileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'clients' | 'personnel' | 'ordenes' | 'historial' | 'projects' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const isAdmin = userProfile?.rol_t === 'admin' || userProfile?.rol_t === 'Administrador';

  // --- QUERIES ---
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !userProfile) return null;
    const colRef = collection(db, "projects");
    if (isAdmin) return query(colRef, orderBy("startDate", "desc"));
    return query(colRef, where("createdBy", "==", user.uid), orderBy("startDate", "desc"));
  }, [db, user?.uid, userProfile, isAdmin]);
  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !userProfile) return null;
    const colRef = collection(db, "ordenes");
    if (isAdmin) return query(colRef, orderBy("startDate", "desc"));
    return query(colRef, where("createdBy", "==", user.uid));
  }, [db, user?.uid, userProfile, isAdmin]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !userProfile) return null;
    const colRef = collection(db, "historial");
    if (isAdmin) return query(colRef, orderBy("startDate", "desc"));
    return query(colRef, where("createdBy", "==", user.uid));
  }, [db, user?.uid, userProfile, isAdmin]);
  const { data: history, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !userProfile) return null;
    return query(collection(db, "clients"), orderBy("nombreCliente", "asc"));
  }, [db, userProfile]);
  const { data: clients } = useCollection(clientsQuery);

  const personnelQuery = useMemoFirebase(() => {
    if (!db || !userProfile || !isAdmin) return null;
    return query(collection(db, "personnel"), orderBy("nombre_t", "asc"));
  }, [db, userProfile, isAdmin]);
  const { data: personnel } = useCollection(personnelQuery);

  // --- FILTERS ---
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [projects, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => o.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || o.folio?.toString().includes(searchTerm));
  }, [orders, searchTerm]);

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter(o => o.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || o.folio?.toString().includes(searchTerm));
  }, [history, searchTerm]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/login");
  };

  const handleDelete = () => {
    if (!deleteConfirm || !db) return;
    const docRef = doc(db, deleteConfirm.type, deleteConfirm.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Registro eliminado" });
    setDeleteConfirm(null);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-8">
      <div className="flex flex-col items-center mb-12 px-6">
        {logoImage && (
          <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl mb-4">
            <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain p-2" />
          </div>
        )}
        <span className="font-black text-xl tracking-tighter text-white">ICSA</span>
      </div>
      <nav className="flex-1 space-y-2 px-4">
        <Button variant={activeTab === "dashboard" ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-12" onClick={() => setActiveTab("dashboard")}>
          <LayoutDashboard size={20} /> Inicio
        </Button>
        <Button variant={activeTab === "projects" ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-12" onClick={() => setActiveTab("projects")}>
          <Briefcase size={20} /> Proyectos
        </Button>
        <Button variant={activeTab === "orders" ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-12" onClick={() => setActiveTab("orders")}>
          <FileText size={20} /> Órdenes Activas
        </Button>
        <Button variant={activeTab === "history" ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-12" onClick={() => setActiveTab("history")}>
          <History size={20} /> Historial OTs
        </Button>
        {isAdmin && <>
          <Button variant={activeTab === "clients" ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-12" onClick={() => setActiveTab("clients")}>
            <Users size={20} /> Clientes
          </Button>
          <Button variant={activeTab === "personnel" ? "secondary" : "ghost"} className="w-full justify-start gap-3 h-12" onClick={() => setActiveTab("personnel")}>
            <UserRound size={20} /> Personal
          </Button>
        </>}
      </nav>
      <div className="px-4 mt-auto">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 text-white/70 hover:text-white h-12">
          <LogOut size={20} /> Salir
        </Button>
      </div>
    </div>
  );

  if (isUserLoading || !mounted || isProfileLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary font-black animate-pulse">CARGANDO...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col shadow-2xl">
        <SidebarContent />
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">
            {activeTab === "dashboard" ? "Inicio" : activeTab === "projects" ? "Proyectos" : activeTab === "orders" ? "Órdenes de Trabajo" : "Archivo Histórico"}
          </h1>
          <div className="flex gap-2">
            {activeTab === "projects" && (
              <Link href="/projects/new">
                <Button className="bg-accent text-primary font-black h-12 px-6 rounded-xl shadow-lg">
                  <Plus size={20} className="mr-2" /> Nuevo Proyecto
                </Button>
              </Link>
            )}
            {(activeTab === "dashboard" || activeTab === "orders") && (
              <Link href="/work-orders/new">
                <Button className="bg-accent text-primary font-black h-12 px-6 rounded-xl shadow-lg">
                  <Plus size={20} className="mr-2" /> Nueva OT
                </Button>
              </Link>
            )}
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-none bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" /> Proyectos Activos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ProjectTable projects={(projects || []).filter(p => p.status === 'Active').slice(0, 5)} isLoading={isProjectsLoading} />
              </CardContent>
            </Card>
            <Card className="shadow-lg border-none bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" /> OTs Recientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <OrderTable orders={(orders || []).slice(0, 5)} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "projects" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
            <CardHeader className="border-b space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar proyecto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-12 bg-muted/20 border-none shadow-inner" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ProjectTable projects={filteredProjects} isLoading={isProjectsLoading} />
            </CardContent>
          </Card>
        )}

        {activeTab === "orders" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
            <CardHeader className="border-b space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por folio o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-12 bg-muted/20 border-none shadow-inner" />
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar en el histórico..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-12 bg-muted/20 border-none shadow-inner" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <OrderTable orders={filteredHistory} isLoading={isHistoryLoading} type="historial" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase">Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 font-black">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectTable({ projects, isLoading }: { projects: any[], isLoading: boolean }) {
  if (isLoading) return <div className="p-10 text-center animate-pulse">CARGANDO...</div>;
  if (projects.length === 0) return <div className="p-10 text-center text-muted-foreground italic">Sin proyectos registrados.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="font-bold text-[10px] uppercase">Nombre Proyecto</TableHead>
          <TableHead className="font-bold text-[10px] uppercase">Cliente</TableHead>
          <TableHead className="font-bold text-[10px] uppercase">Estado</TableHead>
          <TableHead className="text-right font-bold text-[10px] uppercase">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-bold text-primary">{project.name}</TableCell>
            <TableCell className="text-xs font-medium">{project.clientName}</TableCell>
            <TableCell>
              <Badge className={cn("text-[9px] uppercase font-black", project.status === 'Completed' ? 'bg-accent/20 text-primary' : 'bg-primary/10 text-primary')}>
                {project.status === 'Active' ? 'ACTIVO' : project.status === 'Completed' ? 'FINALIZADO' : 'CANCELADO'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/projects/${project.id}`}>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-primary"><Eye className="h-4 w-4" /></Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OrderTable({ orders, isLoading, type, setDeleteConfirm, isAdmin }: { orders: any[], isLoading: boolean, type: string, setDeleteConfirm: any, isAdmin: boolean }) {
  if (isLoading) return <div className="p-10 text-center animate-pulse">CARGANDO...</div>;
  if (orders.length === 0) return <div className="p-10 text-center text-muted-foreground italic">Sin órdenes registradas.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="font-bold text-[10px] uppercase">Folio</TableHead>
          <TableHead className="font-bold text-[10px] uppercase">Cliente</TableHead>
          <TableHead className="font-bold text-[10px] uppercase">Estado</TableHead>
          <TableHead className="text-right font-bold text-[10px] uppercase">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-black text-primary">#{order.folio} {order.isProjectSummary && <Badge className="bg-accent/20 text-primary ml-2 text-[8px]">RESUMEN</Badge>}</TableCell>
            <TableCell className="font-bold text-xs">{order.clientName}</TableCell>
            <TableCell>
              <Badge className="text-[9px] uppercase font-black bg-primary/10 text-primary">
                {order.status === 'Completed' ? 'FINALIZADO' : 'EN CURSO'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Link href={`/work-orders/${order.id}`}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary"><Eye className="h-4 w-4" /></Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => generateWorkOrderPDF(order)}>
                  <Download className="h-4 w-4" />
                </Button>
                {isAdmin && <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setDeleteConfirm({ id: order.id, type })}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
