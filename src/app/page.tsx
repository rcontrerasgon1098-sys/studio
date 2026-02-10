"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wifi, ClipboardCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === "hero-tech");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
              I
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-headline font-bold text-xl text-primary">ICSA</span>
              <span className="text-xs font-normal text-muted-foreground">ingeniería comunicaciones S.A.</span>
            </div>
          </div>
          <nav>
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
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
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>
          )}
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-headline font-extrabold tracking-tight text-primary mb-6">
                Transformando la Gestión de Órdenes de Trabajo
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Digitaliza tus formularios, captura firmas en tiempo real y gestiona tu equipo de red con eficiencia total.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-headline font-bold text-center mb-16">Características Clave</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <ClipboardCheck className="h-8 w-8 text-primary" />,
                  title: "Formularios Digitales",
                  desc: "Replica tus formularios físicos en un entorno dinámico y fácil de usar."
                },
                {
                  icon: <Wifi className="h-8 w-8 text-primary" />,
                  title: "Sincronización Cloud",
                  desc: "Accede a las órdenes de trabajo desde cualquier lugar con Firebase."
                },
                {
                  icon: <ShieldCheck className="h-8 w-8 text-primary" />,
                  title: "Firma Digital",
                  desc: "Captura el consentimiento de técnicos y clientes de forma segura."
                }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-lg hover:shadow-xl transition-shadow bg-background">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 inline-block p-3 bg-secondary rounded-2xl">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2024 ICSA ingeniería comunicaciones S.A. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
