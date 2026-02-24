
"use client";

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  className?: string;
}

export function SignaturePad({ label, onSave, className }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [hasSignature, setHasSignature] = useState(false);
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
  };

  const handleBegin = () => {
    setHasSignature(true);
  };

  const handleConfirm = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      onSave(sigCanvas.current.getTrimmedCanvas().toDataURL("image/png"));
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
      
      <div className="relative border-2 border-primary/10 rounded-3xl bg-white overflow-hidden touch-none shadow-inner min-h-[220px]">
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
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          type="button"
          disabled={!hasSignature}
          onClick={handleConfirm}
          className="w-full bg-accent hover:bg-accent/90 text-primary font-black h-16 rounded-2xl gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-40 uppercase tracking-tighter text-lg"
        >
          <Check size={24} />
          Confirmar Firma
        </Button>
        <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-60">
          Usted certifica que la información registrada es veraz.
        </p>
      </div>
    </div>
  );
}
