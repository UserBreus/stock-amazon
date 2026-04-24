const fs = require('fs');

let code = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

// 1. Remove ONLY the { id: 'historial', icon: Clock, label: 'Historial y Analítica' } line from the array
code = code.replace(
  /\{\s*id:\s*'historial',\s*icon:\s*Clock,\s*label:\s*'Historial y Analítica'\s*\},?/g,
  ''
);

// 2. Remove the empty mode === 'historial' component block
const histStart = code.indexOf("{/* HISTORIAL Y ANALÍTICA */}");
if (histStart > -1) {
    // Find the end of the historial block. It ends right before `</div>  {isCameraOpen` or similar.
    // In DespachoEgresos.tsx, it's:
    // {mode === 'historial' && (
    //     <div className="p-4 text-center text-slate-500">Próximamente...</div>
    // )}
    const histEnd = code.indexOf(")}", histStart) + 2; 
    
    code = code.substring(0, histStart) + "\n" + code.substring(histEnd);
    console.log("Successfully removed Historial layout block.");
}

fs.writeFileSync('src/components/DespachoEgresos.tsx', code);
console.log("Historial tab cleanly removed.");
