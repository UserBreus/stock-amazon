import fs from 'fs';
let content = fs.readFileSync('src/pages/DespachoEgresos.tsx', 'utf8');

content = content.replace(
    "import { ArrowUpRight, ArrowRightLeft, Scan, Box, Search, Trash2, Printer, CheckCircle, Zap }",
    "import { ArrowUpRight, ArrowRightLeft, Scan, Box, Search, Trash2, Printer, CheckCircle, Zap, AlertCircle }"
);

// We'll replace user?.email with user?.id because email might not be available
content = content.replace(/user\?\.email/g, "(user as any)?.email || user?.id");

// BarcodeScanner fix:
content = content.replace(
   "<BarcodeScanner isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onScan={(code) => { setIsCameraOpen(false); processBarcode(code); }} />",
   "{isCameraOpen && (\n        <div className=\"fixed inset-0 z-[100] bg-black/90 p-4 flex flex-col\">\n          <div className=\"flex justify-end p-4\">\n            <button onClick={() => setIsCameraOpen(false)} className=\"text-white font-bold p-2 bg-red-500 rounded-lg\">Cerrar Cámara</button>\n          </div>\n          <div className=\"flex-1 flex items-center justify-center\">\n            <BarcodeScanner onScan={(code) => { setIsCameraOpen(false); processBarcode(code); }} />\n          </div>\n        </div>\n      )}"
);

fs.writeFileSync('src/pages/DespachoEgresos.tsx', content);
console.log("Fixes applied to Despacho");
