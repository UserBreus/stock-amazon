import fs from 'fs';

// 1. Fix ModalSelector z-index
let ms = fs.readFileSync('src/components/ui/ModalSelector.tsx', 'utf8');
ms = ms.replace('z-40', 'z-[110]');
fs.writeFileSync('src/components/ui/ModalSelector.tsx', ms);

// 2. Refactor InventarioGerencial.tsx modal for compras
let inv = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const oldModalContent = `<Modal isOpen={isLabelCompraModalOpen} onClose={() => setIsLabelCompraModalOpen(false)} title="Generar Etiquetas de Orden de Compra">
         <form className="space-y-6" onSubmit={handleGenerateCompraLabels}>
             <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Órdenes Pendientes</label>
                 <select 
                    className="input-nexus" 
                    required
                    value={selectedCompraId} 
                    onChange={e => setSelectedCompraId(e.target.value)}
                 >
                    <option value="">Selecciona Orden de Compra...</option>
                    {comprasPendientes.map(c => (
                       <option key={c.id} value={c.id}>OC-{c.id.split('-')[0].toUpperCase()} ({c.proveedor_nombre}) - {c.cantidad_articulos} arts</option>
                    ))}
                 </select>
                 <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-3 text-center">Las etiquetas se generarán unitariamente y quedarán listas para el escáner del WMS.</p>
             </div>
             <button type="submit" className="w-full btn-primary py-4 mt-6">Pre-Generar e Imprimir Orden</button>
         </form>
      </Modal>`;

const newModalContent = `<Modal isOpen={isLabelCompraModalOpen} onClose={() => setIsLabelCompraModalOpen(false)} title="Órdenes de Compra a Etiquetar">
         {!selectedCompraId ? (
             <div className="space-y-4">
                 <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase text-center mb-6">Selecciona una orden para pre-imprimir sus etiquetas WMS</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                     {comprasPendientes.length === 0 && (
                         <div className="col-span-2 text-center py-8 text-slate-400">No hay órdenes pendientes para imprimir.</div>
                     )}
                     {comprasPendientes.map(c => (
                         <button 
                            key={c.id} 
                            onClick={() => setSelectedCompraId(c.id)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left group"
                         >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest text-xs group-hover:text-blue-600 transition-colors">OC-{c.id.split('-')[0]}</span>
                                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-md">PENDIENTE</span>
                            </div>
                            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{c.proveedor_nombre || 'Proveedor Genérico'}</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">{c.cantidad_articulos} artículos esperados</p>
                         </button>
                     ))}
                 </div>
             </div>
         ) : (
             <form className="space-y-6" onSubmit={handleGenerateCompraLabels}>
                 <button type="button" onClick={() => setSelectedCompraId('')} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
                     &larr; Volver a órdenes
                 </button>
                 
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                     <Receipt className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
                     <h4 className="text-xl font-black text-slate-900 dark:text-white">Generar Lote de Impresión</h4>
                     <p className="text-sm text-slate-500 font-medium mt-2">Para: OC-{selectedCompraId.split('-')[0].toUpperCase()}</p>
                 </div>
                 
                 <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-3 text-center">Las etiquetas de código QR se generarán unitariamente y quedarán listas para que utilices la pistola en la Recepción WMS.</p>
                 
                 <button type="submit" className="w-full btn-primary py-4 mt-6">Emitir Calcomanías WMS</button>
             </form>
         )}
      </Modal>`;

inv = inv.replace(oldModalContent, newModalContent);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', inv);
console.log("UI updated!");
