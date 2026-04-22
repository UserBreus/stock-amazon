const fs = require('fs');
let c = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

c = c.replace(
    /<button onClick=\{\(\) => handleRecibirRemitoEntero\(rem\.id\)\} className="btn-primary flex items-center gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600\/20">/,
    `<button onClick={() => handleVerDetalles(rem.id, 'EN_TRANSITO')} className="btn-primary flex items-center gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20">`
);
c = c.replace(/<PackageCheck className="w-4 h-4" \/> Recibir Conforme/, `<PackageCheck className="w-4 h-4" /> Controlar y Recibir`);
c = c.replace(/<button onClick=\{\(\) => handleVerDetalles\(rem\.id\)\} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">Ver Detalles<\/button>/g,
              `<button onClick={() => handleVerDetalles(rem.id, 'EN_TRANSITO')} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">Ver / Controlar</button>`);
// Above handles the injection made in phase 1 for the 'Pendientes' list. Wait, for 'Historial' it should pass 'RECIBIDO'.

c = c.replace(/<button onClick=\{\(\) => handleVerDetalles\(rem\.id\)\} className="w-full md:w-auto px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">Ver Bultos \/ Contenido<\/button>/g,
              `<button onClick={() => handleVerDetalles(rem.id, 'RECIBIDO')} className="w-full md:w-auto px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">Ver Bultos / Contenido</button>`);

const modalJSXRegex = /\{remitoDetalleItems && \([\s\S]*?<\/Modal>\s*\)\}/;

const newModalJSX = `{remitoDetalleItems && (
          <Modal isOpen={true} onClose={() => { setRemitoDetalleItems(null); setSelectedActiveRemitoId(null); setSelectedRemitoEstado(null); }} title={selectedRemitoEstado === 'EN_TRANSITO' ? "Controlar Recepción" : "Detalle de Remito"}>
              <div className="space-y-4">
                 {selectedRemitoEstado === 'EN_TRANSITO' && (
                     <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-4 border border-amber-200 dark:border-amber-800 text-sm font-bold rounded-2xl">
                        Por favor verifique que las cantidades físicas coincidan con lo enviado. Si llegaron menos, modifique el "Recibido".
                     </div>
                 )}
              
                 {remitoDetalleItems.length === 0 ? (
                     <div className="p-8 text-center text-slate-500 font-bold">No hay ítems registrados en este remito.</div>
                 ) : (
                     remitoDetalleItems.map((item, idx) => (
                         <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                             <div className="flex-1">
                                 <h5 className="font-black text-slate-800 dark:text-white leading-tight mb-1">{item.producto_nombre}</h5>
                                 <span className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{item.nombre_variante}</span>
                             </div>
                             <div className="flex items-center gap-6 shrink-0">
                                 <div className="text-right">
                                     <p className="font-bold text-slate-500">{item.cantidad_enviada}</p>
                                     <p className="text-[10px] uppercase font-bold text-slate-400">Enviados</p>
                                 </div>
                                 
                                 <div className="flex flex-col items-center">
                                     {selectedRemitoEstado === 'EN_TRANSITO' ? (
                                         <input 
                                            type="number" 
                                            min="0" max={item.cantidad_enviada} step="0.01" 
                                            value={item.edit_cantidad_recibida} 
                                            onChange={e => setRemitoDetalleItems(remitoDetalleItems.map(i => i.id === item.id ? {...i, edit_cantidad_recibida: Number(e.target.value)} : i))}
                                            className="w-20 text-center font-black text-lg bg-white dark:bg-slate-950 border border-emerald-500 rounded p-1"
                                         />
                                     ) : (
                                         <p className="font-black text-lg text-emerald-600 dark:text-emerald-400">{item.cantidad_recibida}</p>
                                     )}
                                     <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mt-1">Recibidos</p>
                                 </div>
                             </div>
                         </div>
                     ))
                 )}
                 
                 <div className="flex gap-3 pt-4 mt-6 border-t border-slate-200 dark:border-slate-800">
                     <button onClick={() => { setRemitoDetalleItems(null); setSelectedActiveRemitoId(null); setSelectedRemitoEstado(null); }} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black py-4 rounded-xl">Cancelar</button>
                     {selectedRemitoEstado === 'EN_TRANSITO' && remitoDetalleItems.length > 0 && (
                         <button onClick={handleProcesarRecepcion} disabled={isReceiving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl disabled:opacity-50">
                             {isReceiving ? 'PROCESANDO...' : 'SÍ, INGRESAR STOCK'}
                         </button>
                     )}
                 </div>
              </div>
          </Modal>
      )}`;

c = c.replace(modalJSXRegex, newModalJSX);
fs.writeFileSync('src/pages/InventarioOperativo.tsx', c);
console.log('Script patched base structure safely.');
