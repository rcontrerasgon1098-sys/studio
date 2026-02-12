"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, isSameDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Plus, FileText, Search, LogOut, LayoutDashboard, 
  Eye, Download, Menu, TrendingUp, Users, UserRound, Shield,
  Pencil, Trash2, PieChart as PieChartIcon, BarChart as BarChartIcon,
  Briefcase, Clock, Calendar as CalendarIcon, FilterX, Loader2, RefreshCw, History,
  Activity, BarChartBig
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
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
import {
  PieChart,
  Pie,
  Cell,
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
  const router = useRouter();
  const { toast } = useToast();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
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

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "ordenes"), orderBy("startDate", "desc"));
  }, [db]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  const historyQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "historial"), orderBy("startDate", "desc"));
  }, [db]);
  const { data: history, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "clients"), orderBy("nombreCliente", "asc"));
  }, [db]);
  const { data: clients } = useCollection(clientsQuery);

  const personnelQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "personnel"), orderBy("nombre_t", "asc"));
  }, [db]);
  const { data: personnel } = useCollection(personnelQuery);

  const statsData = useMemo(() => {
    const pendingCount = orders?.filter(o => o.status === "Pending").length || 0;
    const completedCount = history?.length || 0;
    
    return [
      { name: "Pendientes", value: pendingCount, color: "hsl(var(--primary))" },
      { name: "Completadas", value: completedCount, color: "hsl(var(--accent))" }
    ];
  }, [orders, history]);

  const activityData = useMemo(() => {
    if (!history) return [];
    
    const activityMap = new Map<string, number>();
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

    history.forEach(order => {
      if (order.startDate) {
        const orderDate = startOfDay(new Date(order.startDate));
        
        if (orderDate >= sevenDaysAgo) {
          const dayKey = format(orderDate, 'yyyy-MM-dd');
          activityMap.set(dayKey, (activityMap.get(dayKey) || 0) + 1);
        }
      }
    });

    const result = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(startOfDay(new Date()), 6 - i);
      const dayKey = format(d, 'yyyy-MM-dd');
      
      return {
        date: format(d, "EEEEEE, dd/MM", { locale: es }),
        count: activityMap.get(dayKey) || 0,
      };
    });

    return result;
  }, [history]);
  
  const topClientsData = useMemo(() => {
    if (!history) return [];
    const counts = history.reduce((acc, order) => {
        const client = order.clientName || "Desconocido";
        acc[client] = (acc[client] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
  }, [history]);

  const techProductivityData = useMemo(() => {
    if (!history) return [];
    const counts = history.reduce((acc, order) => {
        const tech = order.techName || "No Asignado";
        acc[tech] = (acc[tech] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
        .map(([name, count]) => ({
            name: name.split(" ")[0], // Use only the first name for brevity
            count 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
  }, [history]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const folioStr = o.folio?.toString() || "";
      const clientStr = o.clientName?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      const matchesSearch = folioStr.includes(searchTerm) || clientStr.includes(term);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      let matchesDate = true;
      if (dateFilter && o.startDate) {
        matchesDate = isSameDay(new Date(o.startDate), dateFilter);
      }
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter(o => {
      const folioStr = o.folio?.toString() || "";
      const clientStr = o.clientName?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      const matchesSearch = folioStr.includes(searchTerm) || clientStr.includes(term);
      let matchesDate = true;
      if (dateFilter && o.startDate) {
        matchesDate = isSameDay(new Date(o.startDate), dateFilter);
      }
      return matchesSearch && matchesDate;
    });
  }, [history, searchTerm, dateFilter]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => 
      c.nombreCliente?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.rutCliente?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const filteredPersonnel = useMemo(() => {
    if (!personnel) return [];
    return personnel.filter(p => 
      p.nombre_t?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.rut_t?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [personnel, searchTerm]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/login");
  };

  const handleDelete = () => {
    if (!deleteConfirm || !db) return;
    const docRef = doc(db, deleteConfirm.type, deleteConfirm.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Registro eliminado", description: "El elemento ha sido removido del sistema." });
    setDeleteConfirm(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter(undefined);
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
          onClick={() => { setActiveTab("dashboard"); clearFilters(); }}
        >
          <LayoutDashboard size={20} /> Inicio
        </Button>
        <Button 
          variant={activeTab === "stats" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "stats" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("stats"); clearFilters(); }}
        >
          <PieChartIcon size={20} /> Estadísticas
        </Button>
        <Button 
          variant={activeTab === "orders" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "orders" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("orders"); clearFilters(); }}
        >
          <FileText size={20} /> Órdenes Activas
        </Button>
        <Button 
          variant={activeTab === "history" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "history" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("history"); clearFilters(); }}
        >
          <History size={20} /> Historial
        </Button>
        <Button 
          variant={activeTab === "clients" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "clients" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("clients"); clearFilters(); }}
        >
          <Users size={20} /> Clientes
        </Button>
        <Button 
          variant={activeTab === "personnel" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "personnel" ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("personnel"); clearFilters(); }}
        >
          <UserRound size={20} /> Personal
        </Button>
      </nav>
      <div className="px-4 mt-auto">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 hover:bg-white/20 text-white/70 hover:text-white h-12">
          <LogOut size={20} /> Salir
        </Button>
      </div>
    </div>
  );

  if (isUserLoading || !mounted) return <div className="min-h-screen flex items-center justify-center text-primary font-black animate-pulse bg-background">CARGANDO...</div>;

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
              {activeTab === "dashboard" ? "Inicio" : 
               activeTab === "stats" ? "Estadísticas y Análisis" :
               activeTab === "orders" ? "Gestión de Órdenes" : 
               activeTab === "history" ? "Historial de Trabajo" : 
               activeTab === "clients" ? "Clientes" : "Personal"}
            </h1>
          </div>
          {activeTab === "dashboard" && (
            <Link href="/work-orders/new">
              <Button className="bg-accent text-primary font-black h-12 px-6 shadow-lg rounded-xl">
                <Plus size={20} className="mr-2" /> Nueva Orden
              </Button>
            </Link>
          )}
        </header>

        {/* Dashboard / Inicio View */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg border-none bg-white rounded-2xl overflow-hidden group">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <Activity className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Órdenes Activas</p>
                    <h3 className="text-4xl font-black text-primary leading-none mt-1">
                      {isOrdersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (orders?.filter(o => o.status === "Pending").length || 0)}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-xl border-none bg-white rounded-2xl">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-bold">Listado de Pendientes</CardTitle>
                <CardDescription>Acceso rápido a los trabajos en curso.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <OrderTable orders={orders?.filter(o => o.status === "Pending") || []} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats View */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-none shadow-md overflow-hidden">
                <CardHeader className="border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-primary" /> Distribución de Carga
                  </CardTitle>
                  <CardDescription>Proporción entre órdenes activas y completadas.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-md overflow-hidden">
                <CardHeader className="border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChartIcon className="h-4 w-4 text-primary" /> Volumen de Finalización (7 días)
                  </CardTitle>
                  <CardDescription>Órdenes completadas por día en la última semana.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fontWeight: 'bold' }} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fontWeight: 'bold' }} 
                          allowDecimals={false}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-none shadow-md overflow-hidden">
                <CardHeader className="border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" /> Top 5 Clientes
                  </CardTitle>
                  <CardDescription>Clientes con más órdenes completadas.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topClientsData} layout="vertical" margin={{ left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                        <RechartsTooltip 
                          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-md overflow-hidden">
                <CardHeader className="border-b bg-muted/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Productividad de Técnicos
                  </CardTitle>
                  <CardDescription>Top 5 técnicos por órdenes completadas.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={techProductivityData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                        <RechartsTooltip 
                          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Orders View */}
        {activeTab === "orders" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
             <CardHeader className="border-b space-y-4">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-lg font-bold">Todas las Órdenes Activas</CardTitle>
                 <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[10px] font-bold uppercase"><FilterX className="mr-2 h-3 w-3" /> Limpiar</Button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-muted/20 border-none" />
                 </div>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-10 justify-start text-left font-medium bg-muted/20 border-none", !dateFilter && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(dateFilter, "PPP", { locale: es }) : "Filtrar por fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
                    </PopoverContent>
                 </Popover>
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <OrderTable orders={filteredOrders} isLoading={isOrdersLoading} type="ordenes" setDeleteConfirm={setDeleteConfirm} />
             </CardContent>
          </Card>
        )}

        {/* History View */}
        {activeTab === "history" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
             <CardHeader className="border-b space-y-4">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-lg font-bold">Órdenes Completadas</CardTitle>
                 <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[10px] font-bold uppercase"><FilterX className="mr-2 h-3 w-3" /> Limpiar</Button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input placeholder="Buscar en historial..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 bg-muted/20 border-none" />
                 </div>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-10 justify-start text-left font-medium bg-muted/20 border-none", !dateFilter && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(dateFilter, "PPP", { locale: es }) : "Fecha específica"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
                    </PopoverContent>
                 </Popover>
               </div>
             </CardHeader>
             <CardContent className="p-0">
               <OrderTable orders={filteredHistory} isLoading={isHistoryLoading} type="historial" setDeleteConfirm={setDeleteConfirm} />
             </CardContent>
          </Card>
        )}

        {/* Clients View */}
        {activeTab === "clients" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Listado de Clientes</CardTitle>
              <Input placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64 h-10" />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-bold">RUT</TableHead>
                    <TableHead className="font-bold">Nombre</TableHead>
                    <TableHead className="font-bold">Estado</TableHead>
                    <TableHead className="text-right font-bold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.rutCliente}</TableCell>
                      <TableCell>{client.nombreCliente}</TableCell>
                      <TableCell>
                        <Badge className={client.estadoCliente === 'Activo' ? 'bg-accent/20 text-primary' : 'bg-destructive/10 text-destructive'}>{client.estadoCliente}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/clients/${client.id}/edit`}><Button variant="ghost" size="icon"><Pencil size={16} /></Button></Link>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ id: client.id, type: 'clients' })} className="text-destructive"><Trash2 size={16} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Personnel View */}
        {activeTab === "personnel" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Gestión de Personal</CardTitle>
              <Input placeholder="Buscar personal..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64 h-10" />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-bold">ID</TableHead>
                    <TableHead className="font-bold">Nombre</TableHead>
                    <TableHead className="font-bold">Rol</TableHead>
                    <TableHead className="text-right font-bold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonnel.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.id_t}</TableCell>
                      <TableCell>{p.nombre_t}</TableCell>
                      <TableCell><Badge variant="outline">{p.rol_t}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/technicians/${p.id}/edit`}><Button variant="ghost" size="icon"><Pencil size={16} /></Button></Link>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm({ id: p.id, type: 'personnel' })} className="text-destructive"><Trash2 size={16} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-black uppercase">Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>¿Está seguro de que desea eliminar este registro permanentemente?</AlertDialogDescription>
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

function OrderTable({ orders, isLoading, type, setDeleteConfirm }: { orders: any[], isLoading: boolean, type: string, setDeleteConfirm: any }) {
  if (isLoading) return <div className="p-10 text-center font-bold text-muted-foreground uppercase text-xs animate-pulse">Recuperando registros...</div>;
  if (orders.length === 0) return <div className="p-10 text-center font-bold text-muted-foreground uppercase text-xs">No hay datos para mostrar</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="font-bold py-4">Folio</TableHead>
          <TableHead className="font-bold py-4">Cliente</TableHead>
          <TableHead className="font-bold py-4">Fecha</TableHead>
          <TableHead className="font-bold py-4">Estado</TableHead>
          <TableHead className="text-right font-bold py-4">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} className="hover:bg-muted/10">
            <TableCell className="font-black text-primary">#{order.folio}</TableCell>
            <TableCell className="font-bold">{order.clientName}</TableCell>
            <TableCell className="text-xs">{order.startDate ? format(new Date(order.startDate), "dd/MM/yyyy") : "N/A"}</TableCell>
            <TableCell>
              <Badge className={cn("border-none text-[10px] px-2 py-0.5 uppercase font-bold", order.status === 'Completed' ? 'bg-accent/15 text-primary' : 'bg-primary/10 text-primary')}>
                {order.status === 'Completed' ? 'Completado' : 'Pendiente'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Link href={`/work-orders/${order.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                </Link>
                {order.status === "Pending" && (
                  <Link href={`/work-orders/${order.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><Pencil className="h-4 w-4" /></Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => generateWorkOrderPDF(order)} disabled={order.status === 'Pending'}><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm({ id: order.id, type })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
