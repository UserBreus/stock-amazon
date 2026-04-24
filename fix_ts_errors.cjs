const fs = require('fs');
let c = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

c = c.replace(/CheckCircle, PackageCheck, ScanBarcode, ArrowLeft, CheckCircle, PackageCheck/g, 'CheckCircle, PackageCheck, ScanBarcode, ArrowLeft, User');

c = c.replace(/export function InventarioGerencial/g, "import toast from 'react-hot-toast';\n\nexport function InventarioGerencial");

c = c.replace(/etiquetas'>\('hub'\)/g, "etiquetas' | 'solicitudes'>('hub')");

fs.writeFileSync('src/pages/InventarioGerencial.tsx', c);
console.log('Fixed TS Errors');
