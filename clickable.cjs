const fs = require('fs');
let c = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

c = c.replace(
    /<div key=\{rem.id\} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50\/50 dark:hover:bg-slate-950\/50 transition-colors">/g,
    '<div key={rem.id} onClick={() => handleVerDetalles(rem.id, \'EN_TRANSITO\')} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors cursor-pointer">'
);

c = c.replace(
    /<div key=\{rem.id\} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50\/50 dark:hover:bg-slate-950\/50 transition-colors">/g,
    '<div key={rem.id} onClick={() => handleVerDetalles(rem.id, \'RECIBIDO\')} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors cursor-pointer">'
);

fs.writeFileSync('src/pages/InventarioOperativo.tsx', c);
console.log('Made cards clickable');
