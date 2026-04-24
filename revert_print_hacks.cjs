const fs = require('fs');

// ============================================================
// 1. index.css — eliminar el @media print roto y poner uno limpio
// ============================================================
let css = fs.readFileSync('src/index.css', 'utf8');
const printStart = css.indexOf('@media print {');
const printEnd = css.indexOf('}', css.indexOf('}', printStart) + 1) + 1; // cierre del bloque externo
css = css.slice(0, printStart) + css.slice(printEnd);
// Añadir solo un estilo de impresión limpio: nada oculto, nada visible, puro reset
css = css.trimEnd() + '\n\n/* Las hojas de impresión se generan en ventana nueva — ver printRemito.ts */\n';
fs.writeFileSync('src/index.css', css);
console.log('1. index.css cleaned ✓');

// ============================================================
// 2. Layout.tsx — revertir todas las clases print: que rompieron el layout
// ============================================================
let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');
// Remove all print: classes added by previous fixes
layout = layout.replace(' print:block print:h-auto print:overflow-visible print:min-h-0 print:bg-white', '');
layout = layout.replace(' print:block print:h-auto print:overflow-visible print:static', '');
layout = layout.replace(' print:h-auto print:overflow-visible print:block print:static print:w-full', '');
layout = layout.replace(' print:h-auto print:overflow-visible print:block print:static', '');
layout = layout.replace(' print:block print:h-auto print:overflow-visible print:static print:w-full', '');
fs.writeFileSync('src/components/layout/Layout.tsx', layout);
console.log('2. Layout.tsx reverted ✓');

// ============================================================
// 3. Sidebar.tsx — revertir print:hidden
// ============================================================
let sb = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
sb = sb.replace('className="print:hidden bg-slate-900 border-r', 'className="bg-slate-900 border-r');
sb = sb.replace('className="print:hidden fixed inset-y-0 left-0 z-50', 'className="fixed inset-y-0 left-0 z-50');
fs.writeFileSync('src/components/layout/Sidebar.tsx', sb);
console.log('3. Sidebar.tsx reverted ✓');

// ============================================================
// 4. TopBar.tsx — revertir print:hidden
// ============================================================
let tb = fs.readFileSync('src/components/layout/TopBar.tsx', 'utf8');
tb = tb.replace('className="print:hidden bg-white dark:bg-slate-950 border-b', 'className="bg-white dark:bg-slate-950 border-b');
fs.writeFileSync('src/components/layout/TopBar.tsx', tb);
console.log('4. TopBar.tsx reverted ✓');

console.log('\nAll layout reverts complete. Print now uses new window approach.');
