"use client";

import React, { useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
}

export function SignaturePad({ label, onSave }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      onSave(sigCanvas.current.getTrimmedCanvas().toDataURL("image/png"));
    }
  };

  // Adjust canvas size on mount/resize
  useEffect(() => {
    const handleResize = () => {
      // Re-render handled by the component's internal sizing
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-primary uppercase tracking-tighter">{label}</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="h-8 text-xs gap-1 font-bold text-muted-foreground hover:text-destructive"
        >
          <RotateCcw className="h-3 w-3" />
          Limpiar
        </Button>
      </div>
      <div className="border-2 rounded-xl bg-background overflow-hidden touch-none border-dashed border-primary/20">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: "w-full h-48",
          }}
          onEnd={handleEnd}
        />
      </div>
      <p className="text-[10px] text-center text-muted-foreground italic">Firme dentro del cuadro punteado</p>
    </div>
  );
}
