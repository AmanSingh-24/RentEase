"use client";
import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Trash2, CheckCircle } from "lucide-react";

export default function SignaturePad({ onSave }: { onSave: (signature: string) => void }) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => sigCanvas.current?.clear();
  const save = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return alert("Please provide a signature");
    const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    if (dataURL) onSave(dataURL);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ width: 500, height: 200, className: "signature-canvas w-full h-48 cursor-crosshair" }}
        />
      </div>
      <div className="flex gap-4">
        <button onClick={clear} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
          <Trash2 size={16} /> Clear Canvas
        </button>
        <button onClick={save} className="flex-[2] py-4 bg-[#1F2937] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-all">
          <CheckCircle size={16} /> Confirm Signature
        </button>
      </div>
    </div>
  );
}