"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, ClipboardCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === "hero-tech");
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoImage && (
              <div className="relative w-14 h-14">
                <Image
                  src={logoImage.imageUrl}
                  alt="ICSA Logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="font-headline font-bold text-2xl text-primary tracking-tight">ICSA</span>
              <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">ingeniería comunicaciones S.A.</span>
            </div>
          </div>
          <nav>
            <Link href="/login">
              <Button variant="default" className="bg-primary hover:bg-primary/90 font-semibold px-6">Iniciar Sesión</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative h-[650px] flex items-center overflow-hidden">
          {heroImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover opacity-25"
                data-ai-hint={heroImage.imageHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>
          )}
          <div className="container mx-auto px-4 relative z-10 text-center md:text-left">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight text-primary mb-6 leading-[1.1]">
                Transformando la Gestión de Órdenes de Trabajo
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 font-medium">
                Digitaliza tus formularios, captura firmas en tiempo real y gestiona tu equipo de red con eficiencia total.
              </p>
              <Link href="/login">
                <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-xl hover:scale-105 transition-transform">
                  Acceso Técnico
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">Características Clave</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Soluciones integrales diseñadas para el trabajo de campo de ingeniería en telecomunicaciones.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <ClipboardCheck className="h-10 w-10 text-primary" />,
                  title: "Formularios Digitales",
                  desc: "Replica tus formularios físicos en un entorno dinámico y fácil de usar, eliminando el papeleo."
                },
                {
                  icon: <Wifi className="h-10 w-10 text-primary" />,
                  title: "Sincronización Cloud",
                  desc: "Accede y sincroniza las órdenes de trabajo desde cualquier lugar gracias a la potencia de Firebase."
                },
                {
                  icon: <ShieldCheck className="h-10 w-10 text-primary" />,
                  title: "Firma Digital",
                  desc: "Captura el consentimiento legal de técnicos y clientes de forma segura y directa en el dispositivo."
                }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 bg-background group">
                  <CardContent className="p-8 text-center">
                    <div className="mb-6 inline-block p-4 bg-secondary rounded-2xl group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-12 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-4 mb-8">
            {logoImage && (
              <div className="relative w-16 h-16 bg-white/10 rounded-full p-2">
                <Image
                  src={logoImage.imageUrl}
                  alt="Logo"
                  fill
                  className="object-contain p-2"
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-xl">ICSA</span>
              <span className="text-[10px] opacity-70 uppercase">ingeniería comunicaciones S.A.</span>
            </div>
          </div>
          <p className="text-sm opacity-60">© 2024 ICSA ingeniería comunicaciones S.A. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
