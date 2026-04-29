const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const startIdx = c.indexOf('className="grid grid-cols-2');
const endIdx = c.indexOf('</motion.div>', startIdx);
let gridBlock = c.substring(startIdx, endIdx);

// Convert all indigo hover borders to neutral slate
gridBlock = gridBlock.replace(/hover:border-indigo-300/g, 'hover:border-slate-300');
gridBlock = gridBlock.replace(/dark:hover:border-indigo-900/g, 'dark:hover:border-slate-700');

// Array of buttons and their icon colors
const buttons = [
    { id: 'btn_sys_maestros', col: 'blue' },
    { id: 'btn_sys_alertas', col: 'red' },
    { id: 'btn_sys_variantes', col: 'purple' },
    { id: 'btn_sys_rasgos', col: 'indigo' },
    { id: 'btn_sys_familias', col: 'emerald' },
    { id: 'btn_sys_proveedores', col: 'orange' },
    { id: 'btn_sys_rendimientos', col: 'cyan' },
    { id: 'btn_sys_iconos', col: 'pink' },
    { id: 'btn_sys_almacenes', col: 'rose' },
    { id: 'btn_sys_monedas', col: 'green' },
    { id: 'btn_sys_facturas', col: 'amber' }
];

// For each button block, we find the icon container which currently has:
// "p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform"
// We want to replace it with:
// "p-2.5 bg-transparent text-[color]-500 dark:text-[color]-400 rounded-xl group-hover:scale-110 transition-transform"

let chunks = gridBlock.split('<button ');
for (let i = 1; i < chunks.length; i++) {
    let chunk = chunks[i];
    
    // identify which button this is
    let targetCol = 'slate';
    for (const b of buttons) {
        if (chunk.includes(b.id)) {
            targetCol = b.col;
            break;
        }
    }
    
    // Replace the icon div
    chunk = chunk.replace(/bg-indigo-50 dark:bg-indigo-900\/30 text-indigo-600 dark:text-indigo-400/g, 
                          `bg-transparent text-${targetCol}-500 dark:text-${targetCol}-400`);
                          
    chunks[i] = chunk;
}

gridBlock = chunks.join('<button ');

c = c.substring(0, startIdx) + gridBlock + c.substring(endIdx);
fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Fixed button colors');
