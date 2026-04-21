import fs from 'fs';
let txt = fs.readFileSync('src/pages/Ingresos.tsx', 'utf8');

// The file has a missing closing bracket for the conditional {tipoIngreso !== 'importaciones' && (  )} 
// Let's add it before {/* Modals */}
txt = txt.replace(
  "{/* Modals */}",
  ")}\n      {/* Modals */}"
);

fs.writeFileSync('src/pages/Ingresos.tsx', txt);
console.log("Fixed!");
