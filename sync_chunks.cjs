const fs = require('fs');

// A4 ratio: 210/297 = 0.707. At 794px wide → height = 794/0.707 = 1123px ✓ (already correct)
// Items visible per page in the modal: change from 26 → 30 to match the print engine
// Also remove any stray print:* classes from the preview page div since printing uses new window

for (const filePath of [
  'src/pages/InventarioOperativo.tsx',
  'src/components/DespachoEgresos.tsx',
]) {
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Sync chunk size: 26 → 30
  code = code.replaceAll('i % 26 === 0', 'i % 30 === 0');

  // 2. Remove stale print: classes from the preview page div (they are now irrelevant)
  code = code.replace(
    'print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:min-h-0 print:h-auto print:rounded-none',
    ''
  );

  fs.writeFileSync(filePath, code);
  console.log('Updated', filePath);
}
