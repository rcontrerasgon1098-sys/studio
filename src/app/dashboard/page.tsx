
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, isSameDay, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Plus, FileText, Search, LogOut, LayoutDashboard, 
  Eye, Download, Menu, TrendingUp, Users, UserRound, Shield,
  Pencil, Trash2, PieChart as PieChartIcon, BarChart as BarChartIcon,
  Briefcase, Clock, Calendar as CalendarIcon, FilterX
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
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
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'clients' | 'personnel' | 'ordenes' } | null>(null);
  const [mountedDate, setMountedDate] = useState<Date | null>(null);

  useEffect(() => {
    setMountedDate(new Date());
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "ordenes"), orderBy("folio", "desc"));
  }, [db]);
  const { data: orders } = useCollection(ordersQuery);

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

  const orderStatsData = useMemo(() => {
    if (!orders) return [];
    const completed = orders.filter(o => o.status === "Completed").length;
    const pending = orders.filter(o => o.status !== "Completed").length;
    return [
      { name: "Completadas", value: completed, color: "hsl(var(--accent))" },
      { name: "Pendientes", value: pending, color: "hsl(var(--primary))" },
    ];
  }, [orders]);

  const weeklyOrdersData = useMemo(() => {
    if (!orders || !mountedDate) return [];
    
    // Configurar el inicio de la semana el lunes (weekStartsOn: 1)
    const monday = startOfWeek(mountedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

    return weekDays.map(date => {
      const count = orders.filter(o => {
        if (!o.startDate) return false;
        return isSameDay(new Date(o.startDate), date);
      }).length;
      
      const dayName = format(date, 'eeee', { locale: es });
      return { 
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1), 
        ordenes: count 
      };
    });
  }, [orders, mountedDate]);

  const clientOrdersData = useMemo(() => {
    if (!orders) return [];
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      const name = o.clientName || "Sin Nombre";
      counts[name] = (counts[name] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, ordenes: count }))
      .sort((a, b) => b.ordenes - a.ordenes)
      .slice(0, 5);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const matchesSearch = o.folio?.toString().includes(searchTerm) || 
                            o.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter && o.startDate) {
        matchesDate = isSameDay(new Date(o.startDate), dateFilter);
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateFilter]);

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
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const handleDelete = () => {
    if (!deleteConfirm || !db) return;
    const docRef = doc(db, deleteConfirm.type, deleteConfirm.id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Registro eliminado",
      description: "El elemento ha sido removido del sistema con éxito."
    });
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
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "dashboard" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("dashboard"); clearFilters(); }}
        >
          <LayoutDashboard size={20} /> Inicio
        </Button>
        <Button 
          variant={activeTab === "orders" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "orders" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("orders"); clearFilters(); }}
        >
          <FileText size={20} /> Órdenes
        </Button>
        <Button 
          variant={activeTab === "analytics" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "analytics" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("analytics"); clearFilters(); }}
        >
          <PieChartIcon size={20} /> Reportes
        </Button>
        <Button 
          variant={activeTab === "clients" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "clients" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10")}
          onClick={() => { setActiveTab("clients"); clearFilters(); }}
        >
          <Users size={20} /> Clientes
        </Button>
        <Button 
          variant={activeTab === "personnel" ? "secondary" : "ghost"} 
          className={cn("w-full justify-start gap-3 h-12 font-semibold", activeTab === "personnel" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10")}
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

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center text-primary font-black animate-pulse bg-background uppercase tracking-tighter">Cargando Portal ICSA...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-72 bg-primary text-white hidden md:flex flex-col shadow-2xl">
        <SidebarContent />
      </aside>

      <header className="md:hidden bg-primary p-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-primary p-0 border-none w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex flex-col">
            <span className="font-black text-xl text-white leading-none">ICSA</span>
            <span className="text-[7px] text-white/70 uppercase tracking-widest">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto pb-24 md:pb-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">
              {activeTab === "clients" ? `Gestión de Clientes (${clients?.length || 0})` : 
               activeTab === "personnel" ? `Gestión de Personal (${personnel?.length || 0})` : 
               activeTab === "orders" ? "Historial de Órdenes" : 
               activeTab === "analytics" ? "Estadísticas y Reportes" : "Portal de Gestión"}
            </h1>
            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Panel Operativo de ICSA</p>
          </div>
          <div className="flex gap-2">
            {activeTab === "clients" && (
              <Link href="/clients/new">
                <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl rounded-xl">
                  <Plus size={24} /> Nuevo Cliente
                </Button>
              </Link>
            )}
            {activeTab === "personnel" && (
              <Link href="/technicians/new">
                <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl rounded-xl">
                  <Plus size={24} /> Nuevo Personal
                </Button>
              </Link>
            )}
            {(activeTab === "dashboard" || activeTab === "orders") && (
              <Link href="/work-orders/new">
                <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl rounded-xl">
                  <Plus size={24} /> Nueva Orden
                </Button>
              </Link>
            )}
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-md border-none bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 p-6 flex flex-row items-center justify-between bg-primary/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Órdenes</p>
                <FileText className="h-4 w-4 text-primary opacity-30" />
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <p className="text-4xl font-black text-primary">{orders?.length || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-md border-none bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 p-6 flex flex-row items-center justify-between bg-destructive/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pendientes</p>
                <Clock className="h-4 w-4 text-destructive opacity-30" />
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <p className="text-4xl font-black text-destructive">
                  {orders?.filter(o => o.status === "Pending" || o.status !== "Completed").length || 0}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-md border-none bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 p-6 flex flex-row items-center justify-between bg-accent/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Completadas</p>
                <TrendingUp className="h-4 w-4 text-accent opacity-30" />
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <p className="text-4xl font-black text-accent">
                  {orders?.filter(o => o.status === "Completed").length || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-xl border-none bg-white rounded-2xl">
                <CardHeader className="border-b pb-4 mb-4 flex flex-row items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-bold text-primary">Estado de Órdenes</CardTitle>
                    <CardDescription>Distribución de cumplimiento</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {orderStatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-none bg-white rounded-2xl">
                <CardHeader className="border-b pb-4 mb-4 flex flex-row items-center gap-2">
                  <BarChartIcon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg font-bold text-primary">Servicios por Cliente</CardTitle>
                    <CardDescription>Top clientes con más solicitudes</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientOrdersData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <RechartsTooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="ordenes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-xl border-none bg-white rounded-2xl">
              <CardHeader className="border-b pb-4 mb-4 flex flex-row items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <div>
                  <CardTitle className="text-lg font-bold text-primary">Actividad Semanal</CardTitle>
                  <CardDescription>Carga de trabajo por día (Lunes a Domingo)</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyOrdersData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="ordenes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {(activeTab === "dashboard" || activeTab === "orders") && (
          <Card className="shadow-xl border-none bg-white mb-8 rounded-2xl">
            <CardHeader className="flex flex-col items-stretch border-b pb-6 mb-4 gap-4 px-4 md:px-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-primary">Listado de Órdenes</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-primary gap-2 h-8 uppercase font-bold text-[10px]">
                  <FilterX className="h-4 w-4" /> Limpiar Filtros
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="relative col-span-1 md:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Folio o cliente..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-background border-none rounded-xl w-full text-sm font-medium"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 bg-background border-none rounded-xl font-medium">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Pending">Pendientes</SelectItem>
                    <SelectItem value="Completed">Completadas</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-12 justify-start text-left font-medium bg-background border-none rounded-xl",
                        !dateFilter && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, "PPP", { locale: es }) : "Filtrar por fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="px-4 md:px-8 pb-8">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-none">
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Folio</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Cliente</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Fecha</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Estado</TableHead>
                      <TableHead className="text-right font-bold py-4 uppercase text-[10px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/20 transition-colors border-b">
                          <TableCell className="font-black text-primary">#{order.folio}</TableCell>
                          <TableCell className="font-bold">{order.clientName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-medium">
                            {order.startDate ? format(new Date(order.startDate), "dd/MM/yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border-none text-[10px] px-2 py-0.5 uppercase font-bold", order.status === 'Completed' ? 'bg-accent/15 text-primary' : 'bg-primary/10 text-primary')}>
                              {order.status === 'Completed' ? 'Completado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/work-orders/${order.id}`}>
                                <Button variant="ghost" size="icon" className="h-10 w-10" title="Ver detalle">
                                  <Eye className="h-5 w-5" />
                                </Button>
                              </Link>
                              {order.status === "Pending" && (
                                <Link href={`/work-orders/${order.id}/edit`}>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 text-primary" title="Editar / Firmar">
                                    <Pencil className="h-5 w-5" />
                                  </Button>
                                </Link>
                              )}
                              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => generateWorkOrderPDF(order)} title="Descargar PDF">
                                <Download className="h-5 w-5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-destructive" 
                                title="Eliminar orden"
                                onClick={() => setDeleteConfirm({ id: order.id, type: 'ordenes' })}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center font-bold text-muted-foreground uppercase tracking-widest text-xs">
                          No se encontraron registros
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "clients" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-4 gap-4 px-8">
              <CardTitle className="text-xl font-bold text-primary">Listado de Clientes</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Buscar nombre o RUT..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-background border-none rounded-xl w-full text-sm font-medium"
                />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-none">
                      <TableHead className="font-bold py-4 uppercase text-[10px]">RUT</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Nombre / Razón Social</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Email / Teléfono</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Estado</TableHead>
                      <TableHead className="text-right font-bold py-4 uppercase text-[10px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/20 transition-colors border-b">
                        <TableCell className="font-bold text-primary">{client.rutCliente}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{client.nombreCliente}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-black">{client.razonSocial}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs font-medium">
                            <span>{client.emailClientes}</span>
                            <span className="text-muted-foreground">{client.telefonoCliente}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("border-none text-[10px] px-2 py-0.5 uppercase font-bold", client.estadoCliente === 'Activo' ? 'bg-accent/15 text-primary' : 'bg-destructive/10 text-destructive')}>
                            {client.estadoCliente}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/clients/${client.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-primary" title="Editar cliente">
                                <Pencil className="h-5 w-5" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-destructive"
                              title="Eliminar cliente"
                              onClick={() => setDeleteConfirm({ id: client.id, type: 'clients' })}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "personnel" && (
          <Card className="shadow-xl border-none bg-white rounded-2xl">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-4 gap-4 px-8">
              <CardTitle className="text-xl font-bold text-primary">Listado de Personal</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Buscar nombre o RUT..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-background border-none rounded-xl w-full text-sm font-medium"
                />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-none">
                      <TableHead className="font-bold py-4 uppercase text-[10px]">ID</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Nombre Completo</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Rol</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">RUT</TableHead>
                      <TableHead className="font-bold py-4 uppercase text-[10px]">Email / Celular</TableHead>
                      <TableHead className="text-right font-bold py-4 uppercase text-[10px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersonnel.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/20 transition-colors border-b">
                        <TableCell className="font-black text-primary text-xs">{p.id_t}</TableCell>
                        <TableCell className="font-bold">{p.nombre_t}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1 border-primary/20 text-primary uppercase text-[9px] font-black", p.rol_t === 'Administrador' && 'bg-primary/5')}>
                            <Shield className="h-3 w-3" /> {p.rol_t}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold">{p.rut_t}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs font-medium">
                            <span className="font-bold">{p.email_t}</span>
                            <span className="text-muted-foreground">{p.cel_t}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/technicians/${p.id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-primary" title="Editar personal">
                                <Pencil className="h-5 w-5" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-destructive"
                              title="Eliminar personal"
                              onClick={() => setDeleteConfirm({ id: p.id, type: 'personnel' })}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="max-w-[400px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-black text-xl uppercase tracking-tighter">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              Esta acción es permanente e irreversible. El registro será borrado definitivamente de los servidores de ICSA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 pt-4">
            <AlertDialogCancel className="font-bold border-primary/20 text-primary h-12 rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 font-black h-12 rounded-xl shadow-lg">
              Eliminar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
