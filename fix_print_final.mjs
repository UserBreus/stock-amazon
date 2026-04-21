import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Remove the bad useEffect
const badEffectStart = txt.indexOf('useEffect(() => {\n    if(printProduct && !isLabelCompraModalOpen)');
const badEffectEnd = txt.indexOf('}, [printProduct, etiquetas, isLabelCompraModalOpen]);') + 54;
if (badEffectStart !== -1) {
    txt = txt.substring(0, badEffectStart) + txt.substring(badEffectEnd);
}

// 2. Fix the Printer icon click in the inventory table
const tableClickTarget = `onClick={() => setPrintProduct(row)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors" title="Imprimir Etiquetas Activadas"`;
const tableClickReplacement = `onClick={() => { setPrintEtiquetas(etiquetas.filter(e => e.variante_id === row.variante_id && e.estado === 'activo')); setPrintProduct(row); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors" title="Imprimir Etiquetas Activadas"`;

txt = txt.replace(tableClickTarget, tableClickReplacement);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial.tsx print logic completely fixed!");
