
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, LogOut, LayoutDashboard, 
  Eye, Download, Users, UserRound, 
  Trash2, History, Briefcase, FolderOpen, ClipboardList, BookOpen, Pencil, Menu, ChevronRight, FileText, Info, Clock, CheckCircle
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

  // Proyectos: Mostrar si es admin o si el usuario está en teamIds
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isProfileLoading) return null;
    const colRef = collection(db, "projects");
    if (isAdmin) {
      return query(colRef, orderBy("startDate", "desc"));
    }
    // Usamos array-contains para ver proyectos donde el usuario es colaborador
    return query(colRef, where("teamIds", "array-contains", user.uid), orderBy("startDate", "desc"));
  }, [db, user?.uid, isProfileLoading, isAdmin]);
  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  // Órdenes Activas
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isProfileLoading) return null;
    const colRef = collection(db, "ordenes");
    if (isAdmin) {
      return query(colRef, orderBy("startDate", "desc"));
    }
    return query(colRef, where("teamIds", "array-contains", user.uid), orderBy("startDate", "desc"));
  }, [db, user?.uid, isProfileLoading, isAdmin]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  // Historial de Órdenes
  const historyQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isProfileLoading) return null;
    const colRef = collection(db, "historial");
    if (isAdmin) {
      return query(colRef, orderBy("startDate", "desc"));
    }
    return query(colRef, where("teamIds", "array-contains", user.uid), orderBy("startDate", "desc"));
  }, [db, user?.uid, isProfileLoading, isAdmin]);
  const { data: historyOrders, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const activeProjects = useMemo(() => (projects || []).filter(p => p.status === 'Active' || p.status === 'Pendiente'), [projects]);
  const completedProjects = useMemo(() => (projects || []).filter(p => p.status === 'Completed' || p.status === 'Completado'), [projects]);

  const filteredProjects = useMemo(() => {
    const list = activeTab === "project-history" ? completedProjects : activeProjects;
    return list.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeProjects, completedProjects, activeTab, searchTerm]);

  const filteredOrders = useMemo(() => {
    const list = activeTab === "order-history" ? (historyOrders || []) : (orders || []);
    return list.filter(o => o.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || o.folio?.toString().includes(searchTerm));
  }, [orders, historyOrders, activeTab, searchTerm]);

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
      <div className="flex flex-col items-center mb-8 px-6">
        {logoImage && (
          <div className="relative w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-lg mb-2 p-2">
            <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain" />
          </div>
        )}
        <span className="font-black text-xl tracking-tighter text-white">ICSA Operaciones</span>
      </div>
      
      <nav className="flex-1 space-y-1 px-4">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Panel Resumen" },
          { id: "projects", icon: Briefcase, label: "Proyectos Activos" },
          { id: "project-history", icon: BookOpen, label: "Historial Proyectos" },
          { id: "orders", icon: ClipboardList, label: "Órdenes Activas" },
          { id: "order-history", icon: History, label: "Historial Órdenes" }
        ].map((item) => (
          <Button 
            key={item.id}
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-3 h-12 rounded-xl font-bold text-sm transition-all text-left",
              activeTab === item.id ? "bg-white text-primary shadow-md" : "text-white/70 hover:bg-white/10 hover:text-white"
            )} 
            onClick={() => { setActiveTab(item.id); setSearchTerm(""); setIsMobileMenuOpen(false); }}
          >
            <item.icon size={20} className="shrink-0" /> <span className="truncate">{item.label}</span>
          </Button>
        ))}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
            <Link href="/clients/new" className="block">
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-white/70 hover:bg-white/10 hover:text-white rounded-xl font-bold">
                <Users size={20} /> Gestión Clientes
              </Button>
            </Link>
            <Link href="/technicians/new" className="block">
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-white/70 hover:bg-white/10 hover:text-white rounded-xl font-bold">
                <UserRound size={20} /> Control Personal
              </Button>
            </Link>
          </div>
        )}
      </nav>

      <div className="px-4 mt-auto">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 text-white/50 hover:text-white hover:bg-destructive/20 h-12 rounded-xl font-bold">
          <LogOut size={20} /> Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  if (isUserLoading || !mounted || isProfileLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse bg-background text-primary">CARGANDO SISTEMA ICSA...</div>;

  const getPageTitle = () => {
    switch(activeTab) {
      case "dashboard": return "Resumen General";
      case "projects": return "Proyectos Activos";
      case "project-history": return "Historial de Proyectos";
      case "orders": return "Órdenes Activas";
      case "order-history": return "Historial de Órdenes";
      default: return "Panel";
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      <aside className="w-64 bg-primary text-white hidden md:flex flex-col shadow-xl sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <header className="md:hidden bg-primary text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-primary text-white border-none w-72">
            <SheetHeader className="sr-only"><SheetTitle>Navegación</SheetTitle></SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
          <span className="font-black tracking-tighter text-lg uppercase">ICSA</span>
          {logoImage && (
            <div className="relative w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
              <Image src={logoImage.imageUrl} alt="Logo" fill className="object-contain" />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tighter">
            {getPageTitle()}
          </h1>
          <div className="flex gap-2">
            <Link href="/projects/new">
              <Button className="bg-primary hover:bg-primary/90 font-bold rounded-xl h-10 shadow-md">
                <Plus size={18} className="mr-1" /> Nuevo Proyecto
              </Button>
            </Link>
            <Link href="/work-orders/new">
              <Button className="bg-accent hover:bg-accent/90 text-primary font-bold rounded-xl h-10 shadow-md">
                <Plus size={18} className="mr-1" /> Crear OT
              </Button>
            </Link>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-primary/5 p-4 border-b">
                <CardTitle className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <FolderOpen size={16} /> Proyectos en Ejecución
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ProjectTable projects={activeProjects.slice(0, 5)} isLoading={isProjectsLoading} />
              </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-accent/10 p-4 border-b">
                <CardTitle className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <ClipboardList size={16} /> Órdenes Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <OrderTable orders={(orders || []).slice(0, 5)} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} isAdmin={isAdmin} />
              </CardContent>
            </Card>
          </div>
        )}

        {(activeTab === "projects" || activeTab === "project-history") && (
          <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b bg-white">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar proyecto o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-muted/30 border-none rounded-xl font-bold" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ProjectTable projects={filteredProjects} isLoading={isProjectsLoading} />
            </CardContent>
          </Card>
        )}

        {(activeTab === "orders" || activeTab === "order-history") && (
          <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b bg-white">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por folio o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-muted/30 border-none rounded-xl font-bold" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <OrderTable 
                orders={filteredOrders} 
                isLoading={activeTab === "orders" ? isOrdersLoading : isHistoryLoading} 
                type={activeTab === "orders" ? "ordenes" : "historial"} 
                setDeleteConfirm={setDeleteConfirm} 
                isAdmin={isAdmin} 
              />
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-primary">¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">Esta acción borrará permanentemente el registro de los servidores de ICSA.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white rounded-xl font-bold">Eliminar permanentemente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectTable({ projects, isLoading }: { projects: any[], isLoading: boolean }) {
  if (isLoading) return <div className="p-12 text-center text-primary font-bold animate-pulse">Cargando Proyectos...</div>;
  if (projects.length === 0) return <div className="p-12 text-center text-muted-foreground italic">Sin proyectos registrados</div>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="font-black text-[10px] uppercase py-4 pl-6">Nombre de Proyecto</TableHead>
            <TableHead className="font-black text-[10px] uppercase">Cliente</TableHead>
            <TableHead className="font-black text-[10px] uppercase">Estado</TableHead>
            <TableHead className="text-right font-black text-[10px] uppercase pr-6">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} className="hover:bg-muted/10">
              <TableCell className="font-bold text-primary pl-6 py-4">{project.name}</TableCell>
              <TableCell className="text-xs font-medium">{project.clientName}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[9px] uppercase font-bold border-primary/20 text-primary">
                  {(project.status === 'Active' || project.status === 'Pendiente') ? 'EN EJECUCIÓN' : 'CERRADO'}
                </Badge>
              </TableCell>
              <TableCell className="text-right pr-6 py-4">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-lg"><Eye size={16} /></Button>
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
  if (isLoading) return <div className="p-12 text-center text-primary font-bold animate-pulse">Sincronizando OTs...</div>;
  if (orders.length === 0) return <div className="p-12 text-center text-muted-foreground italic">Sin órdenes registradas</div>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="font-black text-[10px] uppercase py-4 pl-6">Folio</TableHead>
            <TableHead className="font-black text-[10px] uppercase">Cliente</TableHead>
            <TableHead className="font-black text-[10px] uppercase">Estado</TableHead>
            <TableHead className="text-right font-black text-[10px] uppercase pr-6">Gestión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isCompleted = order.status === 'Completed' || order.status === 'Completado' || type === 'historial';
            return (
              <TableRow key={order.id} className="hover:bg-muted/10">
                <TableCell className="py-4 pl-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">#{order.folio}</span>
                    {order.isProjectSummary && <span className="text-[8px] font-black text-primary uppercase">Acta Final</span>}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium">{order.clientName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[9px] uppercase font-bold border-none", isCompleted ? "bg-accent/20 text-primary" : "bg-primary/10 text-primary")}>
                    {isCompleted ? 'FINALIZADO' : 'PENDIENTE'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6 py-4">
                  <div className="flex justify-end gap-1">
                    {!isCompleted ? (
                      <Link href={`/work-orders/${order.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-lg"><Pencil size={16} /></Button>
                      </Link>
                    ) : (
                      <Link href={`/work-orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-lg"><Eye size={16} /></Button>
                      </Link>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-primary rounded-lg" onClick={() => generateWorkOrderPDF(order)}><Download size={16} /></Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white rounded-lg" onClick={() => setDeleteConfirm({ id: order.id, type })}><Trash2 size={16} /></Button>
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
