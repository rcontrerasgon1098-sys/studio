
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, FileText, Search, LogOut, LayoutDashboard, 
  Eye, Download, Users, UserRound, 
  Trash2, History, Briefcase, FolderOpen, ClipboardList, BookOpen, Pencil, Menu, ChevronRight
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const isAdmin = userProfile?.rol_t === 'admin' || userProfile?.rol_t === 'Administrador';

  // --- QUERIES FILTRADAS POR PROPIEDAD SI NO ES ADMIN ---
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isProfileLoading) return null;
    const colRef = collection(db, "projects");
    if (isAdmin) {
      return query(colRef, orderBy("startDate", "desc"));
    }
    return query(colRef, where("createdBy", "==", user.uid), orderBy("startDate", "desc"));
  }, [db, user?.uid, isProfileLoading, isAdmin]);
  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isProfileLoading) return null;
    const colRef = collection(db, "ordenes");
    if (isAdmin) {
      return query(colRef, orderBy("startDate", "desc"));
    }
    return query(colRef, where("createdBy", "==", user.uid), orderBy("startDate", "desc"));
  }, [db, user?.uid, isProfileLoading, isAdmin]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isProfileLoading) return null;
    const colRef = collection(db, "historial");
    if (isAdmin) {
      return query(colRef, orderBy("startDate", "desc"));
    }
    return query(colRef, where("createdBy", "==", user.uid), orderBy("startDate", "desc"));
  }, [db, user?.uid, isProfileLoading, isAdmin]);
  const { data: history, isLoading: isHistoryLoading } = useCollection(historyQuery);

  // --- FILTERS ---
  const activeProjects = useMemo(() => (projects || []).filter(p => p.status === 'Active' || p.status === 'Pendiente'), [projects]);
  const completedProjects = useMemo(() => (projects || []).filter(p => p.status === 'Completed' || p.status === 'Completado'), [projects]);

  const filteredProjects = useMemo(() => {
    const list = activeTab === "project-history" ? completedProjects : activeProjects;
    return list.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeProjects, completedProjects, activeTab, searchTerm]);

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
          <div className="relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl mb-4 p-2">
            <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain" />
          </div>
        )}
        <span className="font-black text-2xl tracking-tighter text-white">ICSA</span>
        <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">Sistemas de Control</span>
      </div>
      
      <nav className="flex-1 space-y-2 px-4">
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Menú Principal</p>
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Panel Resumen" },
          { id: "projects", icon: Briefcase, label: "Obras Activas" },
          { id: "project-history", icon: BookOpen, label: "Historial Obras" },
          { id: "orders", icon: ClipboardList, label: "Órdenes de Trabajo" },
          { id: "history", icon: History, label: "Archivo Digital" }
        ].map((item) => (
          <Button 
            key={item.id}
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-4 h-14 rounded-2xl font-black text-sm transition-all duration-300",
              activeTab === item.id 
                ? "bg-white text-primary shadow-[0_10px_20px_rgba(0,0,0,0.1)] translate-x-1" 
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )} 
            onClick={() => { setActiveTab(item.id); setSearchTerm(""); setIsMobileMenuOpen(false); }}
          >
            <item.icon size={22} className={activeTab === item.id ? "text-primary" : "text-white/40"} /> 
            {item.label}
            {activeTab === item.id && <ChevronRight size={16} className="ml-auto opacity-40" />}
          </Button>
        ))}

        {isAdmin && (
          <div className="pt-6 mt-6 border-t border-white/10 space-y-2">
            <p className="px-4 text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Administración</p>
            <Link href="/clients/new" className="block">
              <Button variant="ghost" className="w-full justify-start gap-4 h-14 text-white/70 hover:bg-white/10 hover:text-white rounded-2xl font-black">
                <Users size={22} className="text-white/40" /> Gestión Clientes
              </Button>
            </Link>
            <Link href="/technicians/new" className="block">
              <Button variant="ghost" className="w-full justify-start gap-4 h-14 text-white/70 hover:bg-white/10 hover:text-white rounded-2xl font-black">
                <UserRound size={22} className="text-white/40" /> Control Personal
              </Button>
            </Link>
          </div>
        )}
      </nav>

      <div className="px-4 mt-auto">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-4 text-white/50 hover:text-white hover:bg-destructive/20 h-14 rounded-2xl font-black transition-colors">
          <LogOut size={22} /> Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  if (isUserLoading || !mounted || isProfileLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-6">
      <div className="relative w-24 h-24 animate-pulse">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-ping" />
        <Briefcase size={96} className="text-primary opacity-20" />
      </div>
      <p className="font-black tracking-widest text-xs uppercase animate-pulse">Sincronizando con Servidor ICSA...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-body">
      <aside className="w-72 bg-primary text-white hidden md:flex flex-col shadow-[10px_0_50px_rgba(0,0,0,0.05)] sticky top-0 h-screen z-50">
        <SidebarContent />
      </aside>

      <header className="md:hidden bg-primary text-white p-4 flex items-center justify-between shadow-xl sticky top-0 z-50 rounded-b-3xl">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl h-12 w-12">
              <Menu size={28} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-primary text-white border-none w-80">
            <SheetHeader className="sr-only"><SheetTitle>Menu de Navegación</SheetTitle></SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="font-black tracking-tighter text-xl leading-none uppercase">ICSA</span>
            <span className="text-[7px] font-bold opacity-50 uppercase tracking-widest">Digital Operativo</span>
          </div>
          {logoImage && (
            <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-inner">
              <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain" />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 md:p-10 lg:p-12 overflow-y-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary uppercase tracking-tighter leading-none">
              {activeTab === "dashboard" ? "Resumen General" : activeTab === "projects" ? "Obras en Terreno" : activeTab === "project-history" ? "Archivo de Obras" : activeTab === "orders" ? "Órdenes Pendientes" : "Archivo Histórico"}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary/20 text-primary font-black py-1 px-3 rounded-full text-[10px] uppercase">
                {userProfile?.rol_t || "Usuario"}
              </Badge>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Bienvenido, {userProfile?.nombre_t?.split(' ')[0] || "Usuario"}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {(activeTab === "dashboard" || activeTab === "projects") && (
              <Link href="/projects/new">
                <Button className="bg-primary hover:bg-primary/90 text-white font-black h-14 px-8 rounded-2xl shadow-[0_10px_25px_rgba(56,163,165,0.3)] w-full sm:w-auto uppercase text-xs tracking-widest gap-3 transition-transform active:scale-95">
                  <Plus size={20} /> Nueva Obra
                </Button>
              </Link>
            )}
            {(activeTab === "dashboard" || activeTab === "orders") && (
              <Link href="/work-orders/new">
                <Button className="bg-accent hover:bg-accent/90 text-primary font-black h-14 px-8 rounded-2xl shadow-[0_10px_25px_rgba(67,216,139,0.3)] w-full sm:w-auto uppercase text-xs tracking-widest gap-3 transition-transform active:scale-95">
                  <Plus size={20} /> Crear Orden
                </Button>
              </Link>
            )}
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-primary/[0.03] p-8 border-b border-primary/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-primary tracking-widest">
                    <div className="p-2 bg-primary/10 rounded-xl"><FolderOpen size={18} /></div>
                    Obras en Ejecución
                  </CardTitle>
                  <Badge className="bg-primary text-white text-[10px] uppercase font-black px-3 py-1 rounded-lg">{activeProjects.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ProjectTable projects={activeProjects.slice(0, 5)} isLoading={isProjectsLoading} />
                {activeProjects.length > 5 && (
                  <div className="p-6 bg-muted/5 border-t">
                    <Button variant="ghost" className="w-full h-12 text-xs font-black uppercase text-primary hover:bg-primary/5 rounded-xl" onClick={() => setActiveTab("projects")}>
                      Explorar todos los proyectos <ChevronRight size={14} className="ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="bg-accent/[0.03] p-8 border-b border-accent/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-primary tracking-widest">
                    <div className="p-2 bg-accent/20 rounded-xl"><ClipboardList size={18} /></div>
                    Tareas Pendientes
                  </CardTitle>
                  <Badge className="bg-accent text-primary text-[10px] uppercase font-black px-3 py-1 rounded-lg">{orders?.length || 0}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <OrderTable orders={(orders || []).slice(0, 5)} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
                {(orders || []).length > 5 && (
                  <div className="p-6 bg-muted/5 border-t">
                    <Button variant="ghost" className="w-full h-12 text-xs font-black uppercase text-primary hover:bg-accent/10 rounded-xl" onClick={() => setActiveTab("orders")}>
                      Gestionar todas las órdenes <ChevronRight size={14} className="ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {(activeTab === "projects" || activeTab === "project-history") && (
          <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="border-b border-primary/5 bg-white p-8">
              <div className="relative max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-40" />
                <Input placeholder="Filtrar por obra o mandante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-14 h-14 bg-muted/20 border-none shadow-inner rounded-2xl font-bold text-base" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ProjectTable projects={filteredProjects} isLoading={isProjectsLoading} />
            </CardContent>
          </Card>
        )}

        {activeTab === "orders" && (
          <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="border-b border-primary/5 bg-white p-8">
              <div className="relative max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-40" />
                <Input placeholder="Buscar por folio o mandante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-14 h-14 bg-muted/20 border-none shadow-inner rounded-2xl font-bold text-base" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <OrderTable orders={filteredOrders} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
            </CardContent>
          </Card>
        )}

        {activeTab === "history" && (
          <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.03)] border-none bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="border-b border-primary/5 bg-white p-8">
              <div className="relative max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-40" />
                <Input placeholder="Buscar en el archivo histórico..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-14 h-14 bg-muted/20 border-none shadow-inner rounded-2xl font-bold text-base" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <OrderTable orders={filteredHistory} isLoading={isHistoryLoading} type="historial" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10 max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 size={40} />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-primary text-center">¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-medium text-muted-foreground">
              Esta acción borrará permanentemente el registro de los servidores de ICSA. No podrá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="h-14 rounded-2xl font-black uppercase text-xs flex-1 bg-muted/50 border-none">Mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-14 rounded-2xl font-black uppercase text-xs flex-1 bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectTable({ projects, isLoading }: { projects: any[], isLoading: boolean }) {
  if (isLoading) return (
    <div className="p-24 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary/40">Cargando Obras...</p>
    </div>
  );
  
  if (projects.length === 0) return (
    <div className="p-24 text-center text-muted-foreground flex flex-col items-center gap-4 opacity-30">
      <FolderOpen className="h-16 w-16" />
      <p className="font-bold text-sm uppercase tracking-widest">Sin obras registradas</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-6 pl-8 text-primary">Nombre de Obra</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-6 text-primary">Mandante</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-6 text-primary">Estado</TableHead>
            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-6 pr-8 text-primary">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} className="hover:bg-primary/[0.02] transition-colors border-b border-primary/5">
              <TableCell className="font-black text-primary text-base pl-8 py-6">{project.name}</TableCell>
              <TableCell className="text-xs font-bold text-muted-foreground uppercase">{project.clientName}</TableCell>
              <TableCell>
                <Badge className={cn(
                  "text-[9px] uppercase font-black tracking-tighter px-3 py-1 rounded-full border-none", 
                  (project.status === 'Completed' || project.status === 'Completado') 
                    ? 'bg-accent/20 text-primary' 
                    : 'bg-primary/10 text-primary'
                )}>
                  {(project.status === 'Active' || project.status === 'Pendiente') ? 'EJECUCIÓN' : 'CERRADO'}
                </Badge>
              </TableCell>
              <TableCell className="text-right pr-8 py-6">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="icon" className="h-12 w-12 text-primary hover:bg-primary hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-lg">
                    <Eye className="h-6 w-6" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderTable({ orders, isLoading, type, setDeleteConfirm, isAdmin }: { orders: any[], isLoading: boolean, type: string, setDeleteConfirm: any, isAdmin: boolean }) {
  if (isLoading) return (
    <div className="p-24 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent align-[-0.125em]" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary/40">Sincronizando OTs...</p>
    </div>
  );

  if (orders.length === 0) return (
    <div className="p-24 text-center text-muted-foreground flex flex-col items-center gap-4 opacity-30">
      <ClipboardList className="h-16 w-16" />
      <p className="font-bold text-sm uppercase tracking-widest">Sin órdenes registradas</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-6 pl-8 text-primary">Folio ID</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-6 text-primary">Mandante</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-6 text-primary">Estado</TableHead>
            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-6 pr-8 text-primary">Gestión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isCompleted = order.status === 'Completed' || order.status === 'Completado';
            return (
              <TableRow key={order.id} className="hover:bg-accent/[0.02] transition-colors border-b border-primary/5">
                <TableCell className="py-6 pl-8">
                  <div className="flex flex-col">
                    <span className="font-black text-primary text-base">#{order.folio}</span>
                    {order.isProjectSummary && <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-1">Acta Consolidada</span>}
                  </div>
                </TableCell>
                <TableCell className="font-bold text-xs text-muted-foreground uppercase">{order.clientName}</TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[9px] uppercase font-black tracking-tighter px-3 py-1 rounded-full border-none", 
                    isCompleted ? "bg-accent/20 text-primary" : "bg-primary/10 text-primary"
                  )}>
                    {isCompleted ? 'FINALIZADO' : 'PENDIENTE'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8 py-6">
                  <div className="flex justify-end gap-2">
                    {!isCompleted ? (
                      <Link href={`/work-orders/${order.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-12 w-12 text-primary hover:bg-primary hover:text-white rounded-2xl shadow-sm"><Pencil className="h-5 w-5" /></Button>
                      </Link>
                    ) : (
                      <Link href={`/work-orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-12 w-12 text-primary hover:bg-primary hover:text-white rounded-2xl shadow-sm"><Eye className="h-5 w-5" /></Button>
                      </Link>
                    )}
                    <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:bg-accent hover:text-primary rounded-2xl shadow-sm" onClick={() => generateWorkOrderPDF(order)}>
                      <Download className="h-5 w-5" />
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-12 w-12 text-destructive hover:bg-destructive hover:text-white rounded-2xl shadow-sm" onClick={() => setDeleteConfirm({ id: order.id, type })}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
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
