const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. Add deleteProductoMaestro function
const deleteFn = `
  const deleteProductoMaestro = async (id: number) => {
      if(!window.confirm('¿Eliminar definitivamente este Artículo Maestro? Todas sus variantes se eliminarán si no tienen stock.')) return;
      try {
          await executeAWSQuery(\`DELETE FROM Stock_Productos_Maestros WHERE id = \${id}\`);
          toast.success('Artículo eliminado.');
          fetchData();
      } catch(e:any) {
          toast.error('No se puede eliminar: ya tiene movimientos o stock vinculado.');
      }
  };
`;
if (!c.includes('deleteProductoMaestro')) {
    c = c.replace('const executeCatTransferAndDelete = async', deleteFn + '\n  const executeCatTransferAndDelete = async');
}

// 2. Add Delete button in the grid
if (!c.includes('deleteProductoMaestro(p.id)')) {
    const searchStr = `<Settings className="w-4 h-4" />\n                                                </button>`;
    const replacement = `<Settings className="w-4 h-4" />\n                                                </button>\n                                                <button onClick={(e) => { e.stopPropagation(); deleteProductoMaestro(p.id); }} className="absolute top-4 right-12 bg-white dark:bg-slate-900 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 z-10" title="Eliminar Maestro">\n                                                    <Trash2 className="w-4 h-4" />\n                                                </button>`;
    c = c.replace(searchStr, replacement);
}

// 3. Add Delete function for Variantes
const deleteVarFn = `
  const deleteVariante = async (id: number) => {
      if(!window.confirm('¿Eliminar definitivamente esta variante? No podrá recuperarse.')) return;
      try {
          await executeAWSQuery(\`DELETE FROM Stock_Variantes WHERE id = \${id}\`);
          toast.success('Variante eliminada.');
          fetchData();
      } catch(e:any) {
          toast.error('No se puede eliminar: tiene movimientos o stock vinculado.');
      }
  };

  const updateVarianteInline = async (id: number, nuevoNombre: string, nuevoSku: string) => {
      try {
          await executeAWSQuery(\`UPDATE Stock_Variantes SET nombre_variante='\${nuevoNombre.replace(/'/g, "''")}', sku='\${nuevoSku.replace(/'/g, "''")}' WHERE id = \${id}\`);
          toast.success('Variante actualizada.');
          fetchData();
      } catch(e:any) {
          toast.error('Error al actualizar variante.');
      }
  };
`;
if (!c.includes('deleteVariante')) {
    c = c.replace('const createVariantesMasivas', deleteVarFn + '\n  const createVariantesMasivas');
}

// 4. Add the Variantes Existentes UI under the Tablero de Resultados
const searchPanelStr = `<div className="xl:col-span-7 card-nexus p-6 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 shadow-inner flex flex-col">`;
const newPanelStr = `
                <div className="xl:col-span-7 flex flex-col gap-6">
                    <div className="card-nexus p-6 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 shadow-inner flex flex-col">
`;

if (!c.includes('Catálogo de Variantes Activas en BD')) {
    c = c.replace(searchPanelStr, newPanelStr);
    
    // The exact text we need to replace is at the end of the Generador Maestro block.
    // It ends like this:
    //                             </div>
    //                         </div>
    //                     )}
    //                 </div>
    //             </div>
    //             ) : (
    
    const insertionText = `                            </div>
                        </div>
                    )}
                    
                    {/* Panel Inferior: Catálogo Real */}
                    <div className="card-nexus p-6 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">
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
                </div>`;
    
    // Use regex to replace the exact block while ignoring whitespace variations
    const endBlockRegex = /<\/div>\s*<\/div>\s*\)}\s*<\/div>\s*<\/div>\s*\)\s*:\s*\(\s*<div className="flex-1 w-full" \/>\s*\)}/s;
    
    // Actually, replacing just `)}` before the closing divs is safer:
    c = c.replace(/}\)\)}\s*<\/div>\s*<\/div>\s*\)}/s, (match) => {
        return `}))}\n                            </div>\n                        </div>\n                    )}\n                    \n                    {/* Panel Inferior: Catálogo Real */}\n                    <div className="card-nexus p-6 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col">\n                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">\n                            <Layers className="w-4 h-4 text-emerald-500" /> Catálogo de Variantes Activas en BD\n                        </h4>\n                        \n                        <div className="overflow-y-auto max-h-[400px] custom-scrollbar pr-2">\n                            {variantes.filter(v => v.producto_maestro_id?.toString() === varProdId).length === 0 ? (\n                                <div className="text-center py-8 text-slate-400 font-bold text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">\n                                    No hay variantes guardadas para este artículo maestro.\n                                </div>\n                            ) : (\n                                <table className="w-full text-left">\n                                    <thead>\n                                        <tr className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">\n                                            <th className="pb-3">Variante (Descripción)</th>\n                                            <th className="pb-3 w-32">SKU</th>\n                                            <th className="pb-3 text-right w-24">Acciones</th>\n                                        </tr>\n                                    </thead>\n                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">\n                                        {variantes.filter(v => v.producto_maestro_id?.toString() === varProdId).map(v => (\n                                            <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">\n                                                <td className="py-3 pr-4">\n                                                    <input \n                                                        type="text" \n                                                        defaultValue={v.nombre_variante || ''}\n                                                        onBlur={(e) => {\n                                                            if (e.target.value !== v.nombre_variante) updateVarianteInline(v.id, e.target.value, v.sku);\n                                                        }}\n                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 px-2 py-1 rounded text-xs font-bold text-slate-800 dark:text-slate-200 outline-none transition-all"\n                                                    />\n                                                </td>\n                                                <td className="py-3 pr-4">\n                                                    <input \n                                                        type="text" \n                                                        defaultValue={v.sku || ''}\n                                                        onBlur={(e) => {\n                                                            if (e.target.value !== v.sku) updateVarianteInline(v.id, v.nombre_variante, e.target.value);\n                                                        }}\n                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 px-2 py-1 rounded text-xs font-bold font-mono text-slate-500 dark:text-slate-400 outline-none transition-all"\n                                                    />\n                                                </td>\n                                                <td className="py-3 text-right">\n                                                    <button onClick={() => deleteVariante(v.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors opacity-0 group-hover:opacity-100" title="Eliminar Variante">\n                                                        <Trash2 className="w-4 h-4" />\n                                                    </button>\n                                                </td>\n                                            </tr>\n                                        ))}\n                                    </tbody>\n                                </table>\n                            )}\n                        </div>\n                    </div>\n                </div>`;
    });
}

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Script ejecutado exitosamente');
