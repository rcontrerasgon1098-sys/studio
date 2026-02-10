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
        <div className="container mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoImage && (
              <div className="relative w-24 h-24">
                <Image
                  src={logoImage.imageUrl}
                  alt="ICSA Logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="font-black text-2xl text-primary tracking-tighter">ICSA</span>
              <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-70">ingeniería comunicaciones S.A.</span>
            </div>
          </div>
          <nav>
            <Link href="/login">
              <Button variant="default" className="bg-primary hover:bg-primary/90 font-black px-6 h-11 text-base shadow-lg transition-all hover:scale-105 rounded-xl">
                Iniciar Sesión
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative h-[calc(100vh-96px)] min-h-[500px] flex items-center justify-center overflow-hidden">
          {heroImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover opacity-10"
                data-ai-hint={heroImage.imageHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
          )}
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-primary leading-tight">
                Ordenes de Trabajo <br />
                <span className="text-accent">Digital</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Digitaliza tus formularios, captura firmas y gestiona tu equipo con la plataforma líder para ICSA.
              </p>
              <div className="pt-8">
                <Link href="/login">
                  <Button size="lg" className="bg-primary h-14 px-10 text-xl font-black rounded-2xl shadow-2xl">
                    Comenzar Ahora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-12 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-4 mb-8">
            {logoImage && (
              <div className="relative w-24 h-24 bg-white/10 rounded-2xl p-2 shadow-inner backdrop-blur-sm">
                <Image
                  src={logoImage.imageUrl}
                  alt="Logo"
                  fill
                  className="object-contain p-2"
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter">ICSA</span>
              <span className="text-[8px] font-bold opacity-60 uppercase tracking-[0.3em] mt-1">ingeniería comunicaciones S.A.</span>
            </div>
          </div>
          <p className="text-xs opacity-40 font-bold">© 2024 ICSA ingeniería comunicaciones S.A. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}