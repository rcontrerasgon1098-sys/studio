
"use client";

import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check } from "lucide-react";

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
}

export function SignaturePad({ label, onSave }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [hasSignature, setHasSignature] = useState(false);

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
      <div className="border-2 rounded-xl bg-background overflow-hidden touch-none border-dashed border-primary/20 shadow-inner">
        <SignatureCanvas
          ref={sigCanvas}
          onBegin={handleBegin}
          canvasProps={{
            className: "w-full h-48",
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Button 
          type="button"
          disabled={!hasSignature}
          onClick={handleConfirm}
          className="w-full bg-accent text-primary font-black h-12 gap-2 shadow-md active:scale-95 transition-all"
        >
          <Check className="h-5 w-5" />
          Confirmar Firma
        </Button>
        <p className="text-[10px] text-center text-muted-foreground italic">
          Dibuje su firma completa y luego presione "Confirmar Firma"
        </p>
      </div>
    </div>
  );
}
