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
      <aside className="w-64 bg-primary text-white p-6 hidden md:flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 mb-10 group">
          {logoImage && (
            <div className="relative w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
              <Image
                src={logoImage.imageUrl}
                alt="Logo"
                fill
                className="object-contain p-2"
              />
            </div>
          )}
          <div className="flex flex-col leading-none">
            <span className="font-bold text-xl tracking-tight">ICSA</span>
            <span className="text-[9px] font-normal opacity-70 uppercase tracking-tighter">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <Button variant="secondary" className="w-full justify-start gap-3 bg-white/10 text-white border-none hover:bg-white/20 h-11">
            <LayoutDashboard size={20} /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10 h-11 text-white/80">
            <FileText size={20} /> Mis Órdenes
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/10 h-11 text-white/80">
            <Settings size={20} /> Ajustes
          </Button>
        </nav>
        <Link href="/login">
          <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/20 mt-auto text-white/70 hover:text-white">
            <LogOut size={20} /> Salir
          </Button>
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Panel Técnico</h1>
            <p className="text-muted-foreground">Bienvenido de nuevo, Técnico #08</p>
          </div>
          <Link href="/work-orders/new">
            <Button className="bg-accent text-primary font-bold hover:bg-accent/90 gap-2 h-11 px-6 shadow-lg transition-all hover:scale-105">
              <Plus size={20} /> Nueva Orden de Trabajo
            </Button>
          </Link>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Órdenes Hoy", value: "12", color: "text-primary" },
            { label: "Completadas", value: "84", color: "text-accent" },
            { label: "Pendientes", value: "3", color: "text-primary" }
          ].map((stat, i) => (
            <Card key={i} className="shadow-sm border-none bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </CardHeader>
              <CardContent>
                <p className={`text-4xl font-extrabold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-col md:flex-row items-center justify-between border-b pb-6 mb-4 gap-4">
            <CardTitle className="text-xl">Órdenes Recientes</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input 
                placeholder="Buscar por cliente o folio..." 
                className="pl-10 pr-4 py-2.5 bg-background border rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Folio</TableHead>
                  <TableHead className="font-bold">Cliente</TableHead>
                  <TableHead className="font-bold">Fecha</TableHead>
                  <TableHead className="font-bold">Estado</TableHead>
                  <TableHead className="text-right font-bold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold text-primary">#{order.folio}</TableCell>
                    <TableCell className="font-medium">{order.client}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>
                      <Badge className="bg-accent/20 text-primary border-none hover:bg-accent/30 font-semibold px-3 py-1">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/work-orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary" title="Visualizar">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0 hover:bg-accent/10 hover:text-primary" 
                          title="Descargar PDF"
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
