import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Create instance
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    // Start scanning
    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      (decodedText) => {
        // Success callback
        html5QrCode.stop().then(() => {
          onScan(decodedText);
        }).catch(err => console.error("Error stopping scanner", err));
      },
      (errorMessage) => {
        // Parse errors (ignored as they occur constantly while looking for codes)
      }
    ).catch((err) => {
      console.error(err);
      setError("No se pudo iniciar la cámara. Verifica los permisos o intenta desde un dispositivo seguro (HTTPS).");
    });

    return () => {
      // Cleanup on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div>
            <h3 className="text-white font-black">Escáner Óptico</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enfoca el código de barras</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative bg-black w-full aspect-square flex items-center justify-center">
          {error ? (
            <div className="p-8 text-center text-red-400 text-sm font-bold">
              {error}
            </div>
          ) : (
             <div id="reader" className="w-full h-full object-cover"></div>
          )}
          {/* Guías Tácticas */}
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] border-2 border-emerald-500 rounded-2xl pointer-events-none drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center justify-center">
            <div className="w-full h-0.5 bg-red-500/80 drop-shadow-[0_0_5px_rgba(239,68,68,1)] absolute" />
          </div>
        </div>
      </div>
    </div>
  );
}
