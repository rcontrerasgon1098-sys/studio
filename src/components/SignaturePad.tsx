
"use client";

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  className?: string;
}

export function SignaturePad({ label, onSave, className }: SignaturePadProps) {
  const { toast } = useToast();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const clear = () => {
    sigCanvas.current?.clear();
    setHasSignature(false);
    setIsConfirmed(false);
    onSave("");
  };

  const handleBegin = () => {
    setHasSignature(true);
    setIsConfirmed(false);
  };

  const handleConfirm = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
      onSave(dataUrl);
      setIsConfirmed(true);
      toast({
        title: "Firma capturada",
        description: "La firma se ha registrado correctamente en el formulario.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Pad vacío",
        description: "Por favor, realice su firma antes de intentar confirmar.",
      });
    }
  };

  return (
    <div className={cn("space-y-4", className)} ref={containerRef}>
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{label}</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="h-8 text-[10px] gap-2 font-black text-muted-foreground hover:text-destructive uppercase tracking-widest transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Limpiar
        </Button>
      </div>
      
      <div className={cn(
        "relative border-2 rounded-3xl bg-white overflow-hidden touch-none shadow-inner min-h-[220px] transition-all duration-300",
        isConfirmed ? "border-accent bg-accent/5" : "border-primary/10"
      )}>
        <SignatureCanvas
          ref={sigCanvas}
          onBegin={handleBegin}
          canvasProps={{
            width: containerWidth,
            height: 220,
            className: "signature-canvas w-full",
          }}
          velocityFilterWeight={0.1}
          minWidth={1.5}
          maxWidth={4.5}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-primary rotate-[-5deg]">Dibuje su firma aquí</p>
          </div>
        )}
        {isConfirmed && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-accent text-primary px-3 py-1 rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-[8px] font-black uppercase">Capturada</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          type="button"
          disabled={!hasSignature || isConfirmed}
          onClick={handleConfirm}
          className={cn(
            "w-full h-16 rounded-2xl gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-40 uppercase tracking-tighter text-lg font-black",
            isConfirmed ? "bg-accent/20 text-primary border-2 border-accent/50" : "bg-accent hover:bg-accent/90 text-primary"
          )}
        >
          {isConfirmed ? (
            <><CheckCircle2 size={24} /> Firma Confirmada</>
          ) : (
            <><Check size={24} /> Confirmar Firma</>
          )}
        </Button>
        <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-60">
          Usted certifica que la información registrada es veraz.
        </p>
      </div>
    </div>
  );
}
