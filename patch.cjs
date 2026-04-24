const fs = require('fs');

function patch(filePath) {
   if (!fs.existsSync(filePath)) return;
   let code = fs.readFileSync(filePath, 'utf8');
   
   // 1. Break flexbox on print
   code = code.replace(/flex flex-col print:shadow-none/g, 'flex flex-col print:block print:shadow-none');
   
   // 2. Adjust Table cells
   code = code.replace(/th className=\"py-4 px-6/g, 'th className=\"py-4 px-6 print:py-1 print:px-2 print:text-[9px]');
   code = code.replace(/td className=\"text-center py-4 px-6/g, 'td className=\"text-center py-4 px-6 print:py-1 print:text-[11px]');
   code = code.replace(/td className=\"py-4 px-6/g, 'td className=\"py-4 px-6 print:py-1 print:px-2 print:text-[11px]');
   
   // 3. Adjust spacing of body wrappers
   code = code.replace(/text-lg text-slate-700/g, 'text-lg print:text-sm text-slate-700');
   code = code.replace(/text-lg text-emerald-600/g, 'text-lg print:text-sm text-emerald-600');
   
   // 4. Adjust signatures wrapper
   code = code.replace(/mt-auto pt-20 px-10/g, 'mt-auto print:mt-10 pt-20 print:pt-6 px-10');
   
   fs.writeFileSync(filePath, code);
}

patch('src/pages/InventarioOperativo.tsx');
patch('src/components/DespachoEgresos.tsx');
