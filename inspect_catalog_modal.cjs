const fs = require('fs');
const code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

// Find CategoryDrillDownModal JSX usage (not import)
let pos = 0;
while (true) {
  const idx = code.indexOf('CategoryDrillDownModal', pos);
  if (idx === -1) break;
  if (!code.substring(idx - 5, idx).includes('import') && !code.substring(idx - 5, idx).includes('from')) {
    console.log('JSX usage at:', idx);
    console.log(code.substring(idx - 30, idx + 300));
    console.log('---');
  }
  pos = idx + 1;
}

// Also find the full bottom of the file (modals area)
const modalStart = code.indexOf('{/* MODAL DE CONSUMO */}');
console.log('\n--- MODALS SECTION ---');
console.log(code.substring(modalStart, modalStart + 400));
