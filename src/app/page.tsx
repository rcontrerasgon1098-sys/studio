"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === "hero-tech");
  const logoImage = PlaceHolderImages.find(img => img.id === "icsa-logo");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-28 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoImage && (
              <div className="relative w-40 h-40">
                <Image
                  src={logoImage.imageUrl}
                  alt="ICSA Logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="font-headline font-black text-4xl text-primary tracking-tighter">ICSA</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-70">ingeniería comunicaciones S.A.</span>
            </div>
          </div>
          <nav>
            <Link href="/login">
              <Button variant="default" className="bg-primary hover:bg-primary/90 font-black px-8 h-12 text-lg shadow-xl transition-all hover:scale-105 rounded-xl">
                Iniciar Sesión
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative h-[calc(100vh-112px)] min-h-[600px] flex items-center justify-center overflow-hidden">
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
            <div className="max-w-4xl mx-auto space-y-8">
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-primary mb-8 leading-[0.9]">
                Ordenes de Trabajo <br />
                <span className="text-accent">Digital</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Digitaliza tus formularios, captura firmas y gestiona tu equipo con la plataforma líder para ICSA.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-16 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-6 mb-10">
            {logoImage && (
              <div className="relative w-36 h-36 bg-white/10 rounded-3xl p-4 shadow-inner backdrop-blur-sm">
                <Image
                  src={logoImage.imageUrl}
                  alt="Logo"
                  fill
                  className="object-contain p-2"
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-black text-3xl tracking-tighter">ICSA</span>
              <span className="text-[10px] font-bold opacity-60 uppercase tracking-[0.3em] mt-1">ingeniería comunicaciones S.A.</span>
            </div>
          </div>
          <p className="text-sm opacity-40 font-bold">© 2024 ICSA ingeniería comunicaciones S.A. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
