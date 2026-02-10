"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Search, Settings, LogOut, LayoutDashboard, Eye, Download } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-72 bg-primary text-white p-8 hidden md:flex flex-col shadow-2xl">
        <div className="flex flex-col items-center mb-12 group">
          {logoImage && (
            <div className="relative w-28 h-28 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-all duration-300 mb-4 p-2">
              <Image
                src={logoImage.imageUrl}
                alt="Logo"
                fill
                className="object-contain p-2"
              />
            </div>
          )}
          <div className="flex flex-col items-center text-center leading-none">
            <span className="font-black text-3xl tracking-tighter">ICSA</span>
            <span className="text-[9px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
        <nav className="flex-1 space-y-3">
          <Button variant="secondary" className="w-full justify-start gap-3 bg-white/10 text-white border-none hover:bg-white/20 h-12 text-lg font-semibold">
            <LayoutDashboard size={22} /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10 h-12 text-white/80 text-lg font-medium">
            <FileText size={22} /> Mis Órdenes
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10 h-12 text-white/80 text-lg font-medium">
            <Settings size={22} /> Ajustes
          </Button>
        </nav>
        <Link href="/login" className="mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/20 text-white/70 hover:text-white h-12">
            <LogOut size={22} /> Salir
          </Button>
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
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

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            { label: "Hoy", value: "12", color: "text-primary" },
            { label: "Total Mes", value: "84", color: "text-accent" },
            { label: "Pendientes", value: "3", color: "text-primary" }
          ].map((stat, i) => (
            <Card key={i} className="shadow-lg border-none bg-white hover:shadow-2xl transition-all">
              <CardHeader className="pb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              </CardHeader>
              <CardContent>
                <p className={`text-5xl font-black ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-xl border-none bg-white">
          <CardHeader className="flex flex-col md:flex-row items-center justify-between border-b pb-8 mb-4 gap-6 px-8">
            <CardTitle className="text-2xl font-bold text-primary">Órdenes Recientes</CardTitle>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input 
                placeholder="Buscar cliente o folio..." 
                className="pl-12 pr-6 py-4 bg-background border rounded-2xl w-full text-base outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
              />
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold py-5">Folio</TableHead>
                  <TableHead className="font-bold py-5">Cliente</TableHead>
                  <TableHead className="font-bold py-5">Fecha</TableHead>
                  <TableHead className="font-bold py-5">Estado</TableHead>
                  <TableHead className="text-right font-bold py-5">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/20 transition-colors border-b last:border-0">
                    <TableCell className="font-black text-primary text-lg">#{order.folio}</TableCell>
                    <TableCell className="font-bold text-base">{order.client}</TableCell>
                    <TableCell className="font-medium text-muted-foreground">{order.date}</TableCell>
                    <TableCell>
                      <Badge className="bg-accent/15 text-primary border-none hover:bg-accent/25 font-black px-4 py-1.5 text-xs uppercase tracking-tighter">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-3">
                        <Link href={`/work-orders/${order.id}`}>
                          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" title="Ver Detalle">
                            <Eye className="h-6 w-6" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-11 w-11 rounded-xl hover:bg-accent/10 hover:text-primary transition-all" 
                          title="Descargar PDF"
                          onClick={() => handleDownload(order)}
                        >
                          <Download className="h-6 w-6" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
