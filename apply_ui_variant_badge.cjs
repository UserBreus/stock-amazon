const fs = require('fs');

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const targetStr = `{variantesGeneradas.map((vg, i) => (
                                    <div key={i} className={cn("grid grid-cols-[auto_1fr_auto] gap-4 items-center p-2.5 rounded-lg border transition-all", vg.activa ? "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-40")}>
                                        <div className="flex items-center justify-center w-5">
                                            <input type="checkbox" checked={vg.activa} onChange={(e)=>{
                                                const ng = [...variantesGeneradas]; ng[i].activa = e.target.checked; setVariantesGeneradas(ng);
                                            }} className="w-4 h-4 cursor-pointer accent-blue-600 rounded" />
                                        </div>
                                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate pr-2">{vg.nombre}</span>
                                        <span className="text-[10px] font-black px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded cursor-copy" title="Doble clic para copiar" onDoubleClick={() => navigator.clipboard.writeText(vg.sku)}>{vg.sku}</span>
                                    </div>
                                ))}`;

const replacementStr = `{variantesGeneradas.map((vg, i) => (
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
                                ))}`;

if (c.indexOf(targetStr) !== -1) {
    c = c.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
    console.log("Successfully replaced exact string.");
} else {
    // try removing carriage returns for exact matching
    if (c.replace(/\\r/g, '').indexOf(targetStr.replace(/\\r/g, '')) !== -1) {
         c = c.replace(/\\r/g, '').replace(targetStr.replace(/\\r/g, ''), replacementStr.replace(/\\r/g, ''));
         fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
         console.log("Successfully replaced string ignoring CR.");
    } else {
         console.log("Failed to find exact string target. Re-run manual replacement.");
    }
}
