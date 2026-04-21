import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// Function to find and remove a modal by starting string
function removeModal(startStr) {
    let st = txt.indexOf(startStr);
    while (st !== -1) {
        let end = txt.indexOf('</Modal>', st) + 8;
        if (end > 7) {
            txt = txt.substring(0, st) + txt.substring(end);
        }
        st = txt.indexOf(startStr); // look for duplicates
    }
}

// Remove ALL modals matching "isLabelCompraModalOpen"
removeModal('<Modal isOpen={isLabelCompraModalOpen}');

const newBeautifulModal = `
      {/* BEAUTIFUL COMPRA MODAL */}
      <Modal isOpen={isLabelCompraModalOpen} onClose={() => setIsLabelCompraModalOpen(false)} title="Generar Etiquetas WMS">
        <form onSubmit={handleGenerateCompraLabels} className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Receipt className="w-6 h-6 text-emerald-500" />
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-lg">Órdenes a Recibir</h3>
                <p className="text-xs text-slate-500 font-medium">Selecciona una orden pendiente para pre-imprimir sus códigos de barra.</p>
              </div>
            </div>
            
            <div className="max-h-[40vh] overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2">
              {comprasPendientes.length > 0 ? (
                comprasPendientes.map(c => {
                  const dateObj = new Date(c.fecha || c.fecha_creacion || Date.now());
                  const dateStr = isNaN(dateObj.getTime()) ? 'Reciente' : dateObj.toLocaleDateString();
                  const shortProv = c.proveedor_id ? c.proveedor_id.toString().split('-')[0].toUpperCase() : 'N/A';
                  const isActive = selectedCompraId === c.id;
                  
                  return (
                  <button 
                    key={c.id} 
                    type="button" 
                    onClick={() => setSelectedCompraId(c.id)}
                    className={\`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 \${isActive ? 'bg-emerald-50 border-emerald-500 shadow-md ring-4 ring-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-emerald-500'}\`}
                  >
                    <div className={\`p-3 rounded-xl flex-shrink-0 \${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}\`}>
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className={\`font-black text-lg \${isActive ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}\`}>
                          OC-\${c.id.split('-')[0].toUpperCase()}
                        </p>
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-bold text-xs rounded-lg uppercase tracking-wider">
                          \${c.estado}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Proveedor</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate" title={c.proveedor_id}>\${shortProv}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Fecha Lote</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">\${dateStr}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                )})
              ) : (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-bold">No hay lotes pendientes.</p>
                </div>
              )}
            </div>
          </div>
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
             <button 
                type="submit" 
                disabled={!selectedCompraId} 
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 transition-all cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto"
             >
                 <Printer className="w-5 h-5"/> {selectedCompraId ? 'Generar y Pre-Imprimir Lote' : 'Selecciona una orden'}
             </button>
          </div>
        </form>
      </Modal>
`;

const targetLocation = '{/* ZONA DE IMPRESIÓN (OCULTA EN PANTALLA) */}';
txt = txt.replace(targetLocation, newBeautifulModal + '\n\n    ' + targetLocation);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("All old modals removed. Beautiful new modal inserted.");
