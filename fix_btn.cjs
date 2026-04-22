const fs = require('fs');
let c = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

c = c.replace(/<button className="btn-secondary h-11 text-xs">\s*Ver Detalle Faltantes\s*<\/button>/g, '');

fs.writeFileSync('src/pages/InventarioOperativo.tsx', c);
console.log('Removed dead button');
