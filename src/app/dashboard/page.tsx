
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { 
  Plus, FileText, Search, Settings, LogOut, LayoutDashboard, 
  Eye, Download, Menu, TrendingUp, Users, UserRound, Shield
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // Consultas Firestore
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

  // Filtrados
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => 
      o.folio?.toString().includes(searchTerm) || 
      o.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

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
          className={`w-full justify-start gap-3 h-12 font-semibold ${activeTab === "dashboard" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10"}`}
          onClick={() => { setActiveTab("dashboard"); setSearchTerm(""); }}
        >
          <LayoutDashboard size={20} /> Dashboard
        </Button>
        <Button 
          variant={activeTab === "orders" ? "secondary" : "ghost"} 
          className={`w-full justify-start gap-3 h-12 font-semibold ${activeTab === "orders" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10"}`}
          onClick={() => { setActiveTab("orders"); setSearchTerm(""); }}
        >
          <FileText size={20} /> Órdenes
        </Button>
        <Button 
          variant={activeTab === "clients" ? "secondary" : "ghost"} 
          className={`w-full justify-start gap-3 h-12 font-semibold ${activeTab === "clients" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10"}`}
          onClick={() => { setActiveTab("clients"); setSearchTerm(""); }}
        >
          <Users size={20} /> Clientes
        </Button>
        <Button 
          variant={activeTab === "personnel" ? "secondary" : "ghost"} 
          className={`w-full justify-start gap-3 h-12 font-semibold ${activeTab === "personnel" ? "bg-white/10 text-white border-none" : "text-white/80 hover:bg-white/10"}`}
          onClick={() => { setActiveTab("personnel"); setSearchTerm(""); }}
        >
          <UserRound size={20} /> Personal
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

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center text-primary font-black animate-pulse bg-background">CARGANDO PORTAL ICSA...</div>;

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
              {activeTab === "clients" ? "Gestión de Clientes" : 
               activeTab === "personnel" ? "Gestión de Personal" : 
               activeTab === "orders" ? "Historial de Órdenes" : "Portal de Gestión"}
            </h1>
            <p className="text-muted-foreground font-medium">Panel Operativo de ICSA</p>
          </div>
          <div className="flex gap-2">
            {activeTab === "clients" ? (
              <Link href="/clients/new">
                <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl">
                  <Plus size={24} /> Nuevo Cliente
                </Button>
              </Link>
            ) : activeTab === "personnel" ? (
              <Link href="/technicians/new">
                <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl">
                  <Plus size={24} /> Nuevo Personal
                </Button>
              </Link>
            ) : (
              <Link href="/work-orders/new">
                <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl">
                  <Plus size={24} /> Nueva Orden
                </Button>
              </Link>
            )}
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
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
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Clientes</p>
                <Users className="h-4 w-4 text-primary opacity-30" />
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <p className="text-4xl font-black text-primary/40">{clients?.length || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-md border-none bg-white">
              <CardHeader className="pb-2 p-6 flex flex-row items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Personal</p>
                <UserRound className="h-4 w-4 text-primary opacity-30" />
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <p className="text-4xl font-black text-primary/40">{personnel?.length || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Listado de Órdenes */}
        {(activeTab === "dashboard" || activeTab === "orders") && (
          <Card className="shadow-xl border-none bg-white mb-8">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-4 gap-4 px-8">
              <CardTitle className="text-xl font-bold text-primary">Listado de Órdenes</CardTitle>
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
                          {order.startDate ? new Date(order.startDate).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${order.status === 'Completed' ? 'bg-accent/15 text-primary' : 'bg-primary/10 text-primary'} border-none text-[10px] px-2 py-0.5`}>
                            {order.status === 'Completed' ? 'Completado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/work-orders/${order.id}`}>
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
        )}

        {/* Listado de Clientes */}
        {activeTab === "clients" && (
          <Card className="shadow-xl border-none bg-white">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-4 gap-4 px-8">
              <CardTitle className="text-xl font-bold text-primary">Listado de Clientes</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Buscar nombre o RUT..." 
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
                      <TableHead className="font-bold py-4">RUT</TableHead>
                      <TableHead className="font-bold py-4">Nombre / Razón Social</TableHead>
                      <TableHead className="font-bold py-4">Email / Teléfono</TableHead>
                      <TableHead className="font-bold py-4">Estado</TableHead>
                      <TableHead className="text-right font-bold py-4">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold text-primary">{client.rutCliente}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{client.nombreCliente}</span>
                            <span className="text-[10px] text-muted-foreground">{client.razonSocial}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span>{client.emailClientes}</span>
                            <span className="text-muted-foreground">{client.telefonoCliente}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${client.estadoCliente === 'Activo' ? 'bg-accent/15 text-primary' : 'bg-destructive/10 text-destructive'} border-none text-[10px] px-2 py-0.5`}>
                            {client.estadoCliente}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Listado de Personal */}
        {activeTab === "personnel" && (
          <Card className="shadow-xl border-none bg-white">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 mb-4 gap-4 px-8">
              <CardTitle className="text-xl font-bold text-primary">Listado de Personal</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Buscar nombre o RUT..." 
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
                      <TableHead className="font-bold py-4">ID</TableHead>
                      <TableHead className="font-bold py-4">Nombre Completo</TableHead>
                      <TableHead className="font-bold py-4">Rol</TableHead>
                      <TableHead className="font-bold py-4">RUT</TableHead>
                      <TableHead className="font-bold py-4">Email / Celular</TableHead>
                      <TableHead className="text-right font-bold py-4">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersonnel.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-black text-primary text-xs">{p.id_t}</TableCell>
                        <TableCell className="font-bold">{p.nombre_t}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 border-primary/20 text-primary ${p.rol_t === 'Administrador' ? 'bg-primary/5' : ''}`}>
                            <Shield className="h-3 w-3" /> {p.rol_t}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{p.rut_t}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-medium">{p.email_t}</span>
                            <span className="text-muted-foreground">{p.cel_t}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Eye className="h-5 w-5" />
                          </Button>
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
    </div>
  );
}
