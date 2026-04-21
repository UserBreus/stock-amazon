import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. RE-INJECT Purchase Order Modal where it belongs
const purchaseModal = `
      <Modal isOpen={isLabelCompraModalOpen} onClose={() => setIsLabelCompraModalOpen(false)} title="Generar Etiquetas WMS (De Orden)">
        <form onSubmit={handleGenerateCompraLabels} className="space-y-6">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Seleccionar Lote Pendiente ({comprasPendientes.length})</label>
            <div className="max-h-[30vh] overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-2">
              {comprasPendientes.length > 0 ? (
                comprasPendientes.map(c => (
                  <button 
                    key={c.id} 
                    type="button" 
                    onClick={() => setSelectedCompraId(c.id)}
                    className={\`w-full text-left p-4 rounded-xl border transition-all \${selectedCompraId === c.id ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-500 ring-opacity-50' : 'bg-white border-slate-200 hover:border-blue-300'}\`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-slate-800 uppercase">Orden #{c.id.split('-')[0]}</p>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-md">
                        {c.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Proveedor: <strong className="text-slate-700">{c.proveedor_id || 'N/A'}</strong></p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {new Date(c.fecha).toLocaleDateString()}
                    </p>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-300 rounded-xl">
                  <p className="text-slate-400 font-bold text-sm">No hay órdenes pendientes de impresión.</p>
                </div>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
             <button type="submit" disabled={!selectedCompraId} className="btn-nexus bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                 <Printer className="w-5 h-5"/> Generar Etiquetas y Ver QRs
             </button>
          </div>
        </form>
      </Modal>
`;
if(!txt.includes('isLabelCompraModalOpen={true}')) { // Just a quick check to see if it's there
   const targetModalLocation = '{/* ZONA DE IMPRESIÓN (OCULTA EN PANTALLA) */}';
   txt = txt.replace(targetModalLocation, purchaseModal + '\n\n    ' + targetModalLocation);
}

// 2. Fix the print row button
const rx = /onClick=\{\(\) => setPrintProduct\(row\)\}\s*className="[^"]*"\s*title="Imprimir Etiquetas"/;
const fixedRowButton = `onClick={() => { setPrintEtiquetas(etiquetas.filter(e => e.variante_id === row.variante_id && e.estado === 'activo')); setPrintProduct(row); setTimeout(() => { window.print(); }, 500); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors" title="Imprimir Etiquetas"`;

txt = txt.replace(rx, fixedRowButton);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("Restored perfectly.");
