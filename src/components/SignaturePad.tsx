
"use client";

import React, { useRef } from "react";
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="h-8 text-xs gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          Limpiar
        </Button>
      </div>
      <div className="border rounded-md bg-white overflow-hidden touch-none">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: "signature-canvas w-full h-40",
          }}
          onEnd={handleEnd}
        />
      </div>
    </div>
  );
}
