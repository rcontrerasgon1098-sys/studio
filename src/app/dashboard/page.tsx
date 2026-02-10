"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Plus, FileText, Search, Settings, LogOut, LayoutDashboard, Eye, Download, Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const MOCK_ORDERS = [
  { id: "10245", folio: 10245, client: "Juan Pérez", date: "2024-05-15", status: "Completed" },
  { id: "10246", folio: 10246, client: "María García", date: "2024-05-16", status: "Completed" },
  { id: "10247", folio: 10247, client: "Empresa ABC", date: "2024-05-16", status: "Completed" },
];

export default function Dashboard() {
  const [orders] = useState(MOCK_ORDERS);
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");

  const handleDownload = (order: any) => {
    generateWorkOrderPDF(order);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-8">
      <div className="flex flex-col items-center mb-12 group px-6">
        {logoImage && (
          <div className="relative w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl mb-4 p-2">
            <Image
              src={logoImage.imageUrl}
              alt="Logo"
              fill
              className="object-contain p-2"
            />
          </div>
        )}
        <div className="flex flex-col items-center text-center leading-none">
          <span className="font-black text-2xl tracking-tighter text-white">ICSA</span>
          <span className="text-[8px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1 text-white">ingeniería comunicaciones S.A.</span>
        </div>
      </div>
      <nav className="flex-1 space-y-2 px-4">
        <Button variant="secondary" className="w-full justify-start gap-3 bg-white/10 text-white border-none hover:bg-white/20 h-12 font-semibold">
          <LayoutDashboard size={20} /> Dashboard
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10 h-12 text-white/80 font-medium">
          <FileText size={20} /> Mis Órdenes
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10 h-12 text-white/80 font-medium">
          <Settings size={20} /> Ajustes
        </Button>
      </nav>
      <div className="px-4 mt-auto">
        <Link href="/login" className="w-full">
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/20 text-white/70 hover:text-white h-12">
            <LogOut size={20} /> Salir
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-primary text-white hidden md:flex flex-col shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
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
        <Link href="/work-orders/new">
          <Button size="icon" className="bg-accent text-primary rounded-full shadow-lg">
            <Plus size={20} />
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-headline font-black text-primary tracking-tight">Panel Técnico</h1>
            <p className="text-muted-foreground text-lg font-medium">Bienvenido, Técnico #08</p>
          </div>
          <Link href="/work-orders/new">
            <Button className="bg-accent text-primary font-black hover:bg-accent/90 gap-3 h-14 px-8 text-lg shadow-xl transition-all hover:scale-105">
              <Plus size={24} /> Nueva Orden
            </Button>
          </Link>
        </header>

        {/* Welcome for Mobile */}
        <div className="md:hidden mb-6">
          <h1 className="text-2xl font-black text-primary leading-tight">Panel Técnico</h1>
          <p className="text-muted-foreground text-sm">Técnico #08</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-8 md:12">
          {[
            { label: "Hoy", value: "12", color: "text-primary" },
            { label: "Mes", value: "84", color: "text-accent" },
            { label: "Pend.", value: "3", color: "text-primary" }
          ].map((stat, i) => (
            <Card key={i} className="shadow-md border-none bg-white">
              <CardHeader className="pb-1 p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className={`text-3xl md:text-5xl font-black ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-xl border-none bg-white">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 md:pb-8 mb-4 gap-4 px-4 md:px-8">
            <CardTitle className="text-xl md:text-2xl font-bold text-primary">Órdenes Recientes</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input 
                placeholder="Buscar cliente..." 
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
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-black text-primary">#{order.folio}</TableCell>
                      <TableCell className="font-bold text-xs md:text-sm max-w-[100px] truncate">{order.client}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{order.date}</TableCell>
                      <TableCell>
                        <Badge className="bg-accent/15 text-primary border-none text-[10px] md:text-xs px-2 py-0.5">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <Link href={`/work-orders/${order.id}`}>
                            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-11 md:w-11 rounded-lg">
                              <Eye className="h-5 w-5" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 md:h-11 md:w-11 rounded-lg text-primary"
                            onClick={() => handleDownload(order)}
                          >
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
