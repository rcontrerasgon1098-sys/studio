"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Plus, FileText, Search, Settings, LogOut, LayoutDashboard, 
  Eye, Download, Menu, Users, BarChart3, TrendingUp, UserPlus, EyeOff
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

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Redirigir si no hay usuario
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // Verificar rol de admin usando useDoc
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

  // Query para órdenes
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

  // Gráficas
  const chartData = useMemo(() => {
    if (!orders) return [];
    const counts: Record<string, number> = {};
    orders.forEach(o => {
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
        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10 h-12 text-white/80 font-medium">
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
        {!isAdmin && (
          <Link href="/work-orders/new">
            <Button size="icon" className="bg-accent text-primary rounded-full shadow-lg">
              <Plus size={20} />
            </Button>
          </Link>
        )}
      </header>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        {activeTab === "dashboard" ? (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight">
                  {isAdmin ? "Panel Administrativo" : "Panel Técnico"}
                </h1>
                <p className="text-muted-foreground text-lg font-medium">
                  {isAdmin ? "Gestión Global Operativa" : `Bienvenido, Técnico`}
                </p>
              </div>
              {!isAdmin && (
                <Link href="/work-orders/new">
                  <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl transition-all hover:scale-105">
                    <Plus size={24} /> Nueva Orden
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl">
                      <UserPlus size={24} /> Registrar Técnico
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Nuevo Personal</DialogTitle>
                      <DialogDescription>
                        Crea las credenciales para un nuevo técnico de ICSA.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Correo Electrónico</Label>
                        <Input placeholder="tecnico@icsa.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contraseña Temporal</Label>
                        <div className="relative">
                          <Input 
                            type={showRegPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                          >
                            {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </Button>
                        </div>
                      </div>
                      <Button className="w-full bg-primary font-bold">Crear Usuario Técnico</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-8">
              <Card className="shadow-md border-none bg-white">
                <CardHeader className="pb-1 p-4 flex flex-row items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Órdenes</p>
                  <FileText className="h-4 w-4 text-primary opacity-30" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl md:text-5xl font-black text-primary">{orders?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="shadow-md border-none bg-white">
                <CardHeader className="pb-1 p-4 flex flex-row items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Completadas</p>
                  <TrendingUp className="h-4 w-4 text-accent opacity-30" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl md:text-5xl font-black text-accent">
                    {orders?.filter(o => o.status === "Completed").length || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-md border-none bg-white">
                <CardHeader className="pb-1 p-4 flex flex-row items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pendientes</p>
                  <BarChart3 className="h-4 w-4 text-primary opacity-30" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-3xl md:text-5xl font-black text-primary/40">
                    {(orders?.length || 0) - (orders?.filter(o => o.status === "Completed").length || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <Card className="shadow-xl border-none bg-white">
                  <CardHeader><CardTitle className="text-lg">Volumen Semanal</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-xl border-none bg-white">
                  <CardHeader><CardTitle className="text-lg">Estado de Servicios</CardTitle></CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 ml-4">
                      {statusData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-xs font-bold text-muted-foreground">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card className="shadow-xl border-none bg-white">
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-4 gap-4 px-4 md:px-8">
                <CardTitle className="text-xl font-bold text-primary">Órdenes Recientes</CardTitle>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input 
                    placeholder="Buscar cliente o folio..." 
                    className="pl-10 pr-4 py-3 bg-background border rounded-xl w-full text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </CardHeader>
              <CardContent className="px-2 md:px-8 pb-8">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold py-4">Folio</TableHead>
                        <TableHead className="font-bold py-4">Cliente</TableHead>
                        <TableHead className="font-bold py-4 hidden sm:table-cell">Fecha</TableHead>
                        <TableHead className="font-bold py-4">Estado</TableHead>
                        <TableHead className="text-right font-bold py-4">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders?.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-black text-primary">#{order.folio}</TableCell>
                          <TableCell className="font-bold text-xs md:text-sm max-w-[150px] truncate">{order.clientName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                            {new Date(order.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${order.status === 'Completed' ? 'bg-accent/15 text-primary' : 'bg-primary/10 text-primary'} border-none text-[10px] md:text-xs px-2 py-0.5`}>
                              {order.status === 'Completed' ? 'Completado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 md:gap-2">
                              <Link href={`/work-orders/${order.id}${isAdmin ? `?techId=${order.technicianId}` : ''}`}>
                                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-11 md:w-11 rounded-lg">
                                  <Eye className="h-5 w-5" />
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 md:h-11 md:w-11 rounded-lg text-primary"
                                onClick={() => generateWorkOrderPDF(order)}
                              >
                                <Download className="h-5 w-5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!orders || orders.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic font-medium">
                            No se encontraron órdenes registradas.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="space-y-8">
            <header>
              <h1 className="text-3xl font-black text-primary">Gestión de Técnicos</h1>
              <p className="text-muted-foreground font-medium">Administra el personal operativo de ICSA</p>
            </header>
            
            <Card className="shadow-xl border-none bg-white p-8">
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Users size={64} className="text-primary opacity-20" />
                <h3 className="text-xl font-bold">Lista de Personal</h3>
                <p className="text-muted-foreground max-w-sm">Aquí podrás visualizar y gestionar a todos los técnicos registrados en la plataforma.</p>
                <Button className="bg-primary font-black px-8">Cargar Lista Completa</Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}