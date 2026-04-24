const fs = require('fs');
let s = fs.readFileSync('src/components/ui/CategoryDrillDownModal.tsx', 'utf8');

s = s.replace(/p\.nombre_variante \|\| 'Normal'/g, "p.nombre_variante || 'Única'");
s = s.replace(/p\.nombre_variante \? \`\$\{p\.nombre_variante\}/g, "p.nombre_variante && p.nombre_variante !== 'Única' ? `${p.nombre_variante}");

fs.writeFileSync('src/components/ui/CategoryDrillDownModal.tsx', s);
console.log('Replaced all Normals');
