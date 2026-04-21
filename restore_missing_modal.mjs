import cp from 'child_process';
import fs from 'fs';

// Get clean file output natively without PowerShell encoding
const txt = cp.execSync('git show HEAD:src/pages/InventarioGerencial.tsx').toString('utf8');

const modalMarker = '<Modal isOpen={isLabelCompraModalOpen}';
if (txt.includes(modalMarker)) {
   const start = txt.lastIndexOf('<Modal', txt.indexOf(modalMarker) + 10);
   const end = txt.indexOf('</Modal>', start) + 8;
   const modalCode = txt.substring(start, end);
   
   const current = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');
   if(!current.includes(modalMarker)) {
       // Insert it right before Modal Egreso Manual
       const insertTarget = '{/* Modal Egreso Manual */}';
       const replacement = modalCode + '\n\n      ' + insertTarget;
       const patched = current.replace(insertTarget, replacement);
       fs.writeFileSync('src/pages/InventarioGerencial.tsx', patched);
       console.log("Restored modal!");
   } else {
       console.log("Modal already exists!");
   }
} else {
   console.log("Modal not found in HEAD either...");
}
