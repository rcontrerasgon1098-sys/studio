"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Plus, FileText, Search, Settings, LogOut, LayoutDashboard, 
  Eye, Download, Menu, Users, BarChart3, TrendingUp, UserPlus, EyeOff,
  Calendar as CalendarIcon, Filter, X, FilterX
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, collectionGroup, query, orderBy, doc } from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";
import { getAuth, signOut } from "firebase/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const adminDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "roles_admin", user.uid);
  }, [db, user]);

  const { data: adminRoleDoc, isLoading: isRoleLoading } = useDoc(adminDocRef);

  useEffect(() => {
    if (!isRoleLoading && adminRoleDoc !== undefined) {
      setIsAdmin(!!adminRoleDoc);
    }
  }, [adminRoleDoc, isRoleLoading]);

  const techOrdersQuery = useMemoFirebase(() => {
    if (!db || !user || isAdmin || isRoleLoading) return null;
    return query(
      collection(db, "users", user.uid, "work_orders"),
      orderBy("folio", "desc")
    );
  }, [db, user, isAdmin, isRoleLoading]);

  const adminOrdersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin || isRoleLoading) return null;
    return query(collectionGroup(db, "work_orders"), orderBy("folio", "desc"));
  }, [db, isAdmin, isRoleLoading]);

  const { data: techOrders } = useCollection(techOrdersQuery);
  const { data: allOrders } = useCollection(adminOrdersQuery);

  const orders = isAdmin ? allOrders : techOrders;
  const isLoading = isUserLoading || isRoleLoading;

  const uniqueClients = useMemo(() => {
    if (!orders) return [];
    const clients = new Set(orders.map(o => o.clientName).filter(Boolean));
    return Array.from(clients).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const matchesSearch = o.folio.toString().includes(searchTerm) || 
                          o.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      
      const matchesClient = clientFilter === "all" || o.clientName === clientFilter;

      const orderDate = new Date(o.startDate);
      const matchesDate = (!dateRange.from || orderDate >= dateRange.from) && 
                          (!dateRange.to || orderDate <= dateRange.to);

      return matchesSearch && matchesStatus && matchesClient && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, clientFilter, dateRange]);

  const resetFilters = () => {
    setSearchTerm("");
    setDateRange({ from: undefined, to: undefined });
    setStatusFilter("all");
    setClientFilter("all");
  };

  const chartData = useMemo(() => {
    if (!orders) return [];
    const counts: Record<string, number> = {};
    orders.slice(0, 7).forEach(o => {
      const day = new Date(o.startDate || Date.now()).toLocaleDateString('es-ES', { weekday: 'short' });
      counts[day] = (counts[day] || 0) + 1;
    });
    return Object.entries(counts).map(([name, total]) => ({ name, total }));
  }, [orders]);

  const statusData = useMemo(() => {
    if (!orders) return [];
    const completed = orders.filter(o => o.status === "Completed").length;
    const pending = orders.length - completed;
    return [
      { name: "Completado", value: completed, color: "#43D88B" },
      { name: "Pendiente", value: pending, color: "#38A3A5" }
    ];
  }, [orders]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-8">
      <div className="flex flex-col items-center mb-12 px-6">
        {logoImage && (
          <div className="relative w-28 h-28 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl mb-4 p-2">
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
          className={`w-full justify-start gap-3 h-12 font-semibold ${activeTab === "dashboard" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10"}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <LayoutDashboard size={20} /> Dashboard
        </Button>
        {isAdmin && (
          <Button 
            variant={activeTab === "technicians" ? "secondary" : "ghost"} 
            className={`w-full justify-start gap-3 h-12 font-semibold ${activeTab === "technicians" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10"}`}
            onClick={() => setActiveTab("technicians")}
          >
            <Users size={20} /> Técnicos
          </Button>
        )}
        <Button 
          variant={activeTab === "orders" ? "secondary" : "ghost"} 
          className={`w-full justify-start gap-3 h-12 font-semibold ${activeTab === "orders" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10"}`}
          onClick={() => setActiveTab("orders")}
        >
          <FileText size={20} /> {isAdmin ? "Todas las Órdenes" : "Mis Órdenes"}
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10 h-12 text-white/80 font-medium">
          <Settings size={20} /> Ajustes
        </Button>
      </nav>
      <div className="px-4 mt-auto">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 hover:bg-white/20 text-white/70 hover:text-white h-12">
          <LogOut size={20} /> Salir
        </Button>
      </div>
    </div>
  );

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-primary font-black animate-pulse bg-background">CARGANDO ICSA...</div>;

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

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">
              {isAdmin ? "Panel Administrativo" : "Panel Técnico"}
            </h1>
            <p className="text-muted-foreground font-medium">
              {isAdmin ? "Gestión Global Operativa" : `Bienvenido, ${user?.email}`}
            </p>
          </div>
          {!isAdmin && (
            <Link href="/work-orders/new">
              <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl">
                <Plus size={24} /> Nueva Orden
              </Button>
            </Link>
          )}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="pb-2 p-6 flex flex-row items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Órdenes</p>
              <FileText className="h-4 w-4 text-primary opacity-30" />
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-4xl font-black text-primary">{orders?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="pb-2 p-6 flex flex-row items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Completadas</p>
              <TrendingUp className="h-4 w-4 text-accent opacity-30" />
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-4xl font-black text-accent">
                {orders?.filter(o => o.status === "Completed").length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md border-none bg-white">
            <CardHeader className="pb-2 p-6 flex flex-row items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pendientes</p>
              <BarChart3 className="h-4 w-4 text-primary opacity-30" />
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-4xl font-black text-primary/40">
                {(orders?.length || 0) - (orders?.filter(o => o.status === "Completed").length || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl border-none bg-white">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-4 gap-4 px-8">
            <CardTitle className="text-xl font-bold text-primary">Órdenes Recientes</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar folio o cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-background border-none rounded-xl w-full text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="overflow-x-auto">
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
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-black text-primary">#{order.folio}</TableCell>
                      <TableCell className="font-bold">{order.clientName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${order.status === 'Completed' ? 'bg-accent/15 text-primary' : 'bg-primary/10 text-primary'} border-none text-[10px] px-2 py-0.5`}>
                          {order.status === 'Completed' ? 'Completado' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/work-orders/${order.id}${isAdmin ? `?techId=${order.technicianId}` : ''}`}>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <Eye className="h-5 w-5" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => generateWorkOrderPDF(order)}>
                            <Download className="h-5 w-5" />
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
      </main>
    </div>
  );
}