
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
  Trash2, History, Briefcase, FolderOpen, ClipboardList, BookOpen, Pencil, Menu
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

  // --- QUERIES ---
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !userProfile) return null;
    const colRef = collection(db, "projects");
    if (isAdmin) return query(colRef, orderBy("startDate", "desc"));
    return query(colRef, where("createdBy", "==", user.uid));
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
    <div className="flex flex-col h-full py-6">
      <div className="flex flex-col items-center mb-10 px-6">
        {logoImage && (
          <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl mb-4">
            <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain p-2" />
          </div>
        )}
        <span className="font-black text-xl tracking-tighter">ICSA</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Inicio" },
          { id: "projects", icon: Briefcase, label: "Proyectos Activos" },
          { id: "project-history", icon: BookOpen, label: "Historial Proyectos" },
          { id: "orders", icon: FileText, label: "Órdenes Activas" },
          { id: "history", icon: History, label: "Historial OTs" }
        ].map((item) => (
          <Button 
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"} 
            className={cn(
              "w-full justify-start gap-3 h-12 rounded-xl font-bold transition-all",
              activeTab === item.id ? "bg-white text-primary shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            )} 
            onClick={() => { setActiveTab(item.id); setSearchTerm(""); setIsMobileMenuOpen(false); }}
          >
            <item.icon size={20} /> {item.label}
          </Button>
        ))}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
            <p className="px-4 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Administración</p>
            <Link href="/clients/new" className="block">
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-white/80 hover:bg-white/10 hover:text-white rounded-xl font-bold">
                <Users size={20} /> Clientes
              </Button>
            </Link>
            <Link href="/technicians/new" className="block">
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-white/80 hover:bg-white/10 hover:text-white rounded-xl font-bold">
                <UserRound size={20} /> Personal
              </Button>
            </Link>
          </div>
        )}
      </nav>
      <div className="px-3 mt-auto">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 text-white/70 hover:text-white hover:bg-destructive/20 h-12 rounded-xl font-bold">
          <LogOut size={20} /> Salir
        </Button>
      </div>
    </div>
  );

  if (isUserLoading || !mounted || isProfileLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary font-black animate-pulse uppercase tracking-tighter">Cargando Sistema...</div>;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* SIDEBAR DESKTOP */}
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col shadow-2xl sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-primary text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {logoImage && (
            <div className="relative w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden">
              <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain p-1" />
            </div>
          )}
          <span className="font-black tracking-tighter text-lg uppercase">ICSA</span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-primary text-white border-none w-72">
            <SheetHeader className="sr-only"><SheetTitle>Menu</SheetTitle></SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-primary uppercase tracking-tighter leading-tight">
              {activeTab === "dashboard" ? "Resumen de Operaciones" : activeTab === "projects" ? "Proyectos Activos" : activeTab === "project-history" ? "Historial Proyectos" : activeTab === "orders" ? "Órdenes de Trabajo" : "Archivo Histórico"}
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {userProfile?.nombre_t || user?.email} • {userProfile?.rol_t || "Usuario"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {(activeTab === "dashboard" || activeTab === "projects") && (
              <Link href="/projects/new">
                <Button className="bg-primary hover:bg-primary/90 text-white font-black h-12 px-6 rounded-xl shadow-lg w-full sm:w-auto uppercase text-xs tracking-widest">
                  <Plus size={18} className="mr-2" /> Iniciar Proyecto
                </Button>
              </Link>
            )}
            {(activeTab === "dashboard" || activeTab === "orders") && (
              <Link href="/work-orders/new">
                <Button className="bg-accent hover:bg-accent/90 text-primary font-black h-12 px-6 rounded-xl shadow-lg w-full sm:w-auto uppercase text-xs tracking-widest">
                  <Plus size={18} className="mr-2" /> Nueva Orden
                </Button>
              </Link>
            )}
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 p-6 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-primary">
                    <FolderOpen className="h-5 w-5" /> Proyectos en Terreno
                  </CardTitle>
                  <Badge className="bg-primary text-white text-[10px] uppercase font-black px-2">{activeProjects.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <ProjectTable projects={activeProjects.slice(0, 5)} isLoading={isProjectsLoading} />
                {activeProjects.length > 5 && (
                  <div className="p-4 bg-muted/5 border-t">
                    <Button variant="ghost" className="w-full text-xs font-black uppercase text-primary" onClick={() => setActiveTab("projects")}>
                      Ver todos los proyectos <Plus size={14} className="ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-accent/5 p-6 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-primary">
                    <ClipboardList className="h-5 w-5" /> Órdenes Pendientes
                  </CardTitle>
                  <Badge className="bg-accent text-primary text-[10px] uppercase font-black px-2">{orders?.length || 0}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <OrderTable orders={(orders || []).slice(0, 5)} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
                {(orders || []).length > 5 && (
                  <div className="p-4 bg-muted/5 border-t">
                    <Button variant="ghost" className="w-full text-xs font-black uppercase text-primary" onClick={() => setActiveTab("orders")}>
                      Ver todas las órdenes <Plus size={14} className="ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {(activeTab === "projects" || activeTab === "project-history") && (
          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="border-b bg-white p-6 space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filtrar por nombre o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-muted/20 border-none shadow-inner rounded-xl font-medium" />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <ProjectTable projects={filteredProjects} isLoading={isProjectsLoading} />
            </CardContent>
          </Card>
        )}

        {activeTab === "orders" && (
          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="border-b bg-white p-6 space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por folio o empresa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-muted/20 border-none shadow-inner rounded-xl font-medium" />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <OrderTable orders={filteredOrders} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
            </CardContent>
          </Card>
        )}

        {activeTab === "history" && (
          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="border-b bg-white p-6 space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar en el archivo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-muted/20 border-none shadow-inner rounded-xl font-medium" />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <OrderTable orders={filteredHistory} isLoading={isHistoryLoading} type="historial" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
            </CardContent>
          </Card>
        )}
      </main>

      {/* MODALES */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-primary">Confirmar Acción</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Esta operación eliminará permanentemente el registro de la base de datos central de ICSA. Esta acción no se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-bold border-none bg-muted/50">Mantener Registro</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-12 rounded-xl font-black uppercase bg-destructive text-white hover:bg-destructive/90">Eliminar Definitivamente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectTable({ projects, isLoading }: { projects: any[], isLoading: boolean }) {
  if (isLoading) return <div className="p-16 text-center animate-pulse text-primary font-black uppercase text-sm tracking-widest">Consultando Proyectos...</div>;
  if (projects.length === 0) return <div className="p-16 text-center text-muted-foreground italic font-medium flex flex-col items-center gap-3">
    <FolderOpen className="h-12 w-12 opacity-20" />
    No se encontraron proyectos registrados.
  </div>;

  return (
    <div className="min-w-[600px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-none">
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-5 pl-6 text-primary">Obra / Proyecto</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-5 text-primary">Empresa Cliente</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-5 text-primary">Estado Operativo</TableHead>
            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-5 pr-6 text-primary">Visualizar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} className="hover:bg-primary/5 transition-colors border-b border-muted/20">
              <TableCell className="font-black text-primary pl-6 py-4">{project.name}</TableCell>
              <TableCell className="text-xs font-bold text-muted-foreground">{project.clientName}</TableCell>
              <TableCell>
                <Badge className={cn(
                  "text-[9px] uppercase font-black tracking-tighter px-2.5 py-1 rounded-full", 
                  (project.status === 'Completed' || project.status === 'Completado') 
                    ? 'bg-accent/20 text-primary border-none' 
                    : 'bg-primary/10 text-primary border-none'
                )}>
                  {(project.status === 'Active' || project.status === 'Pendiente') ? 'EJECUCIÓN' : 'CERRADO'}
                </Badge>
              </TableCell>
              <TableCell className="text-right pr-6 py-4">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"><Eye className="h-5 w-5" /></Button>
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
  if (isLoading) return <div className="p-16 text-center animate-pulse text-primary font-black uppercase text-sm tracking-widest">Cargando Órdenes de Trabajo...</div>;
  if (orders.length === 0) return <div className="p-16 text-center text-muted-foreground italic font-medium flex flex-col items-center gap-3">
    <ClipboardList className="h-12 w-12 opacity-20" />
    No hay órdenes de trabajo registradas.
  </div>;

  return (
    <div className="min-w-[600px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-none">
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-5 pl-6 text-primary">ID Folio</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-5 text-primary">Mandante</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest py-5 text-primary">Estado OT</TableHead>
            <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-5 pr-6 text-primary">Gestión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isCompleted = order.status === 'Completed' || order.status === 'Completado';
            return (
              <TableRow key={order.id} className="hover:bg-accent/5 transition-colors border-b border-muted/20">
                <TableCell className="font-black text-primary pl-6 py-4 flex items-center gap-2">
                  #{order.folio} 
                  {order.isProjectSummary && <Badge className="bg-primary text-white text-[8px] uppercase font-black h-4">ACTA FINAL</Badge>}
                </TableCell>
                <TableCell className="font-bold text-xs text-muted-foreground">{order.clientName}</TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[9px] uppercase font-black tracking-tighter px-2.5 py-1 rounded-full", 
                    isCompleted ? "bg-accent/20 text-primary border-none" : "bg-primary/10 text-primary border-none"
                  )}>
                    {isCompleted ? 'FINALIZADO' : 'PENDIENTE'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6 py-4">
                  <div className="flex justify-end gap-1">
                    {!isCompleted ? (
                      <Link href={`/work-orders/${order.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary hover:text-white rounded-xl"><Pencil className="h-5 w-5" /></Button>
                      </Link>
                    ) : (
                      <Link href={`/work-orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary hover:text-white rounded-xl"><Eye className="h-5 w-5" /></Button>
                      </Link>
                    )}
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-accent hover:text-primary rounded-xl" onClick={() => generateWorkOrderPDF(order)}>
                      <Download className="h-5 w-5" />
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive hover:text-white rounded-xl" onClick={() => setDeleteConfirm({ id: order.id, type })}>
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
