const fs = require('fs');

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const missingBlock = `
                    {variantesGeneradas.length === 0 ? (
                        <div className="flex-1 min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            <p className="text-slate-400 font-bold text-xs">Las combinaciones aparecerán aquí a medida que ingreses valores en la matriz.</p>
                        </div>
                    ) : (
                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 grid grid-cols-[auto_1fr_auto] gap-4 items-center border-b border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] uppercase font-black text-slate-500 w-5 text-center">Inc</span>
                                <span className="text-[10px] uppercase font-black text-slate-500">Formulación del Modelo</span>
                                <span className="text-[10px] uppercase font-black text-slate-500">Cód. Sistema</span>
                            </div>
                            <div className="overflow-y-auto max-h-[550px] custom-scrollbar p-2 space-y-1">
                                {variantesGeneradas.map((vg, i) => (
                                    <div key={i} className={cn("grid grid-cols-[auto_1fr_auto] gap-4 items-center p-2.5 rounded-lg border transition-all", vg.activa ? "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-40")}>
                                        <div className="flex items-center justify-center w-5">
                                            <input type="checkbox" disabled={vg.yaExiste} checked={vg.activa} onChange={(e)=>{
                                                const ng = [...variantesGeneradas]; ng[i].activa = e.target.checked; setVariantesGeneradas(ng);
                                            }} className="w-4 h-4 cursor-pointer accent-blue-600 rounded disabled:cursor-not-allowed" />
                                        </div>
                                        <div className="flex items-center gap-2 pr-2 overflow-hidden">
                                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{vg.nombre}</span>
                                            {vg.yaExiste && <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex-shrink-0">Ya Existe</span>}
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded cursor-copy" title="Doble clic para copiar" onDoubleClick={() => navigator.clipboard.writeText(vg.sku)}>{vg.sku}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            ) : (
                <div className="flex-1 w-full" /> 
            )}
        </motion.div>
      )}`;

const searchRegex = /                    <\/div>\s*<ModalSelector/ms;

if (searchRegex.test(c)) {
    c = c.replace(/                    <\/div>\s*<ModalSelector/ms, '                    </div>\n' + missingBlock + '\n\n      <ModalSelector');
    fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
    console.log("Restored successfully with regex!");
} else {
    console.log("Failed to find anchor point with regex.");
}
