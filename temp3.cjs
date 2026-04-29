const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const target = \`                    )}
                </div>
            </div>\`;

const replacement = \`                    )}
                    </div>
                    {/* Panel Inferior: Catálogo Real */}
                    <div className="card-nexus p-6 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col mt-6">
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Layers className="w-4 h-4 text-emerald-500" /> Catálogo de Variantes Activas en BD
                        </h4>
                        
                        <div className="overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                            {variantes.filter(v => v.producto_maestro_id?.toString() === varProdId).length === 0 ? (
                                <div className="text-center py-8 text-slate-400 font-bold text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                    No hay variantes guardadas para este artículo maestro.
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                            <th className="pb-3">Variante (Descripción)</th>
                                            <th className="pb-3 w-32">SKU</th>
                                            <th className="pb-3 text-right w-24">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {variantes.filter(v => v.producto_maestro_id?.toString() === varProdId).map(v => (
                                            <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                                                <td className="py-3 pr-4">
                                                    <input 
                                                        type="text" 
                                                        defaultValue={v.nombre_variante || ''}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== v.nombre_variante) updateVarianteInline(v.id, e.target.value, v.sku);
                                                        }}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 px-2 py-1 rounded text-xs font-bold text-slate-800 dark:text-slate-200 outline-none transition-all"
                                                    />
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <input 
                                                        type="text" 
                                                        defaultValue={v.sku || ''}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== v.sku) updateVarianteInline(v.id, v.nombre_variante, e.target.value);
                                                        }}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 px-2 py-1 rounded text-xs font-bold font-mono text-slate-500 dark:text-slate-400 outline-none transition-all"
                                                    />
                                                </td>
                                                <td className="py-3 text-right">
                                                    <button onClick={() => deleteVariante(v.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors opacity-0 group-hover:opacity-100" title="Eliminar Variante">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>\`;

c = c.replace(target, replacement);
fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Fixed');
