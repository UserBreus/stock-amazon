const fs = require('fs');
const file = 'src/pages/InventarioOperativo.tsx';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('activeTab === \'historial\'')) {
   c = c.replace(/<\/div>\s*<\/motion\.div>\s*\)\}\s*<\/div>\s*<\/div>/,
`                    </div>
                </div>
            </div>
        </motion.div>
      )}

      {activeTab === 'historial' as any && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-500" />
                        Historial de Remitos Recibidos
                    </h3>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {remitosHistoricos.length === 0 && (
                        <div className="py-20 text-center">
                            <ClipboardList className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                            <p className="font-bold text-slate-500 text-lg">Aún no has recibido ningún remito físico en este sector.</p>
                        </div>
                    )}
                    {remitosHistoricos.map(rem => (
                        <div key={rem.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors opacity-80">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                        Remito {rem.numeracion}
                                    </h4>
                                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                                        <span>Desde: <strong className="text-slate-700 dark:text-slate-300">{rem.origen_nombre}</strong></span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>Ítems: {rem.total_items} bultos</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 font-mono">{new Date(rem.fecha_creacion).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                               <button onClick={() => handleVerDetalles(rem.id)} className="w-full md:w-auto px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">Ver Bultos / Contenido</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
      )}

      {remitoDetalleItems && (
          <ModalSelector isOpen={true} onClose={() => setRemitoDetalleItems(null)} title="Detalle del Remito">
              <div className="space-y-4">
                 {remitoDetalleItems.length === 0 ? (
                     <div className="p-8 text-center text-slate-500 font-bold">No hay ítems registrados en este remito.</div>
                 ) : (
                     remitoDetalleItems.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                             <div>
                                 <h5 className="font-black text-slate-800 dark:text-white">{item.producto_nombre}</h5>
                                 <span className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">{item.nombre_variante}</span>
                             </div>
                             <div className="text-right">
                                 <p className="font-black text-xl text-blue-600 dark:text-blue-400">{item.cantidad_enviada}</p>
                                 <p className="text-[10px] uppercase font-bold text-slate-400">Enviados</p>
                             </div>
                         </div>
                     ))
                 )}
                 <button onClick={() => setRemitoDetalleItems(null)} className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black py-4 rounded-xl mt-4">Cerrar Detalle</button>
              </div>
          </ModalSelector>
      )}

    </div>
  );`);

    c = c.replace(/import \{ ModalSelector \} from '\.\.\/components\/ui\/ModalSelector';/,
                  "import { ModalSelector } from '../components/ui/ModalSelector';\nimport { Modal } from '../components/ui/Modal';");
                  
    // Also use the standard generic Modal if ModalSelector is tricky to use standard JSX children for
    c = c.replace(/<ModalSelector isOpen={true} onClose=\{\(\) => setRemitoDetalleItems\(null\)\} title="Detalle del Remito">/g,
                  `<Modal isOpen={true} onClose={() => setRemitoDetalleItems(null)} title="Detalle del Remito">`);
    c = c.replace(/<\/ModalSelector>/g, `</Modal>`);
}

fs.writeFileSync(file, c);
console.log('Phase 2 UI done');
