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
        <div className="container mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoImage && (
              <div className="relative w-32 h-32">
                <Image
                  src={logoImage.imageUrl}
                  alt="ICSA Logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="font-headline font-bold text-3xl text-primary tracking-tight">ICSA</span>
              <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest">ingeniería comunicaciones S.A.</span>
            </div>
          </div>
          <nav>
            <Link href="/login">
              <Button variant="default" className="bg-primary hover:bg-primary/90 font-bold px-8 h-12 text-lg shadow-md transition-all hover:scale-105">
                Iniciar Sesión
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative h-[600px] flex items-center overflow-hidden">
          {heroImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover opacity-20"
                data-ai-hint={heroImage.imageHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
          )}
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-8xl font-headline font-extrabold tracking-tight text-primary mb-8 leading-[1.1]">
                Ordenes de Trabajo Digital
              </h1>
              <p className="text-xl md:text-3xl text-muted-foreground mb-10 font-medium max-w-2xl mx-auto">
                Digitaliza tus formularios, captura firmas y gestiona tu equipo con la plataforma líder para ICSA.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-primary">Nuestras Soluciones</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Eficiencia tecnológica para ingeniería en telecomunicaciones.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  icon: <ClipboardCheck className="h-12 w-12 text-primary" />,
                  title: "Formularios Digitales",
                  desc: "Replica tus formularios físicos en un entorno dinámico y fácil de usar, eliminando el papeleo."
                },
                {
                  icon: <Wifi className="h-12 w-12 text-primary" />,
                  title: "Sincronización Cloud",
                  desc: "Accede y sincroniza las órdenes de trabajo desde cualquier lugar con la potencia de Firebase."
                },
                {
                  icon: <ShieldCheck className="h-12 w-12 text-primary" />,
                  title: "Firma Digital",
                  desc: "Captura el consentimiento legal de técnicos y clientes de forma segura directamente en el dispositivo."
                }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-background group">
                  <CardContent className="p-10 text-center">
                    <div className="mb-8 inline-block p-5 bg-secondary rounded-3xl group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-2xl mb-4 text-primary">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-16 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-6 mb-10">
            {logoImage && (
              <div className="relative w-32 h-32 bg-white/10 rounded-3xl p-4 shadow-inner backdrop-blur-sm">
                <Image
                  src={logoImage.imageUrl}
                  alt="Logo"
                  fill
                  className="object-contain p-2"
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-2xl tracking-tighter">ICSA</span>
              <span className="text-[10px] opacity-70 uppercase tracking-widest">ingeniería comunicaciones S.A.</span>
            </div>
          </div>
          <p className="text-sm opacity-50 font-medium">© 2024 ICSA ingeniería comunicaciones S.A. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
