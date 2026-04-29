const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. Add CRUD functions
const crudFunctions = `
  const updateVarianteInline = async (id: number, nuevoNombre: string, nuevoSku: string) => {
      try {
          await executeAWSQuery(\`UPDATE Stock_Variantes SET nombre_variante='\${nuevoNombre.replace(/'/g, "''")}', codigo_variante='\${nuevoSku.replace(/'/g, "''")}' WHERE id = \${id}\`);
          toast.success('Variante actualizada.');
          fetchData();
      } catch(e:any) {
          toast.error('Error al actualizar variante.');
      }
  };
  
  const deleteVariante = async (id: number) => {
      if(!window.confirm('¿Eliminar definitivamente esta variante? Solo es posible si no tiene movimientos ni stock.')) return;
      try {
          await executeAWSQuery(\`DELETE FROM Stock_Variantes WHERE id = \${id}\`);
          toast.success('Variante eliminada.');
          fetchData();
      } catch(e:any) {
          toast.error('No se puede eliminar: tiene movimientos o stock vinculado.');
      }
  };
  
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

c = c.replace('const createVariantesMasivas = async () => {', crudFunctions + '\n  const createVariantesMasivas = async () => {');

// 2. Add delete button to maestro
const maestroCardEnd = `                                </button>
                             </div>

                             <span className="font-black text-sm text-slate-900 dark:text-slate-200 mb-2 pr-8">{p.nombre}</span>`;

const maestroCardNew = `                                </button>
                                <button onClick={() => deleteProductoMaestro(p.id)} className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors" title="Eliminar Artículo">
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>

                             <span className="font-black text-sm text-slate-900 dark:text-slate-200 mb-2 pr-8">{p.nombre}</span>`;

c = c.replace(maestroCardEnd, maestroCardNew);

// 3. Fix line 1230 extra </div>
c = c.replace(`                    )}
                    </div>
                </div>
            </div>
        </motion.div>`, `                    )}
                    </div>
                </div>
        </motion.div>`);

c = c.replace(`                    )}
                    </div>
                </div>
            </div>
        </motion.div>`, `                    )}
                    </div>
                </div>
        </motion.div>`); // In case it uses CRLF

// 4. Fix line 1550 missing </div> and insert table
const tabIndex = c.indexOf('Tablero de Resultados');
if (tabIndex !== -1) {
    // find the previous flex-col
    const flexColIndex = c.lastIndexOf('flex-col">', tabIndex);
    if (flexColIndex !== -1) {
        c = c.substring(0, flexColIndex + 10) + '\n' + c.substring(flexColIndex + 10);
        // wait, earlier I replaced `div className="xl:col-span-7 card-nexus...`
        c = c.replace('<div className="xl:col-span-7 card-nexus p-6 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 shadow-inner flex flex-col">', '<div className="xl:col-span-7 flex flex-col gap-6">\n                    <div className="card-nexus p-6 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 shadow-inner flex flex-col">');
    }
}

const anchor1 = `                                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate pr-2">{vg.nombre}</span>
                                        <span className="text-[10px] font-black px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded cursor-copy" title="Doble clic para copiar" onDoubleClick={() => navigator.clipboard.writeText(vg.sku)}>{vg.sku}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>`;

const tableHtml = `                                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate pr-2">{vg.nombre}</span>
                                        <span className="text-[10px] font-black px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded cursor-copy" title="Doble clic para copiar" onDoubleClick={() => navigator.clipboard.writeText(vg.sku)}>{vg.sku}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                                                            if (e.target.value !== v.nombre_variante) updateVarianteInline(v.id, e.target.value, v.codigo_variante || '');
                                                        }}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 px-2 py-1 rounded text-xs font-bold text-slate-800 dark:text-slate-200 outline-none transition-all"
                                                    />
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <input 
                                                        type="text" 
                                                        defaultValue={v.codigo_variante || ''}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== (v.codigo_variante || '')) updateVarianteInline(v.id, v.nombre_variante, e.target.value);
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
            </div>`;

// Apply replace for the table
if (c.indexOf(anchor1) !== -1) c = c.replace(anchor1, tableHtml);
else c = c.replace(anchor1.replace(/\n/g, '\r\n'), tableHtml.replace(/\n/g, '\r\n'));

// 5. Buttons redesign
const oldClass = 'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto py-8"';
const newClass = 'className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-4 max-w-[1400px] mx-auto py-4 px-4"';
c = c.replace(oldClass, newClass);

const startToken = '<motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} ' + newClass + '>';
const startIndex = c.indexOf(startToken);

if (startIndex !== -1) {
    const nextMotionDivEnd = c.indexOf('</motion.div>', startIndex);
    if (nextMotionDivEnd !== -1) {
        const buttons = [
            { id: 'btn_sys_maestros', icon: 'Network', label: 'Artículos Maestros', sub: 'Matrices principales.', order: 1, tab: 'titulos_base' },
            { id: 'btn_sys_variantes', icon: 'Box', label: 'Variantes (SKU)', sub: 'Generador de matrices.', order: 2, tab: 'modelos' },
            { id: 'btn_sys_rasgos', icon: 'Tag', label: 'Rasgos y Atributos', sub: 'Diccionario Variantes.', order: 3, tab: 'diccionario' },
            { id: 'btn_sys_familias', icon: 'Layers', label: 'Familias', sub: 'Categorías globales.', order: 4, tab: 'categorias' },
            { id: 'btn_sys_proveedores', icon: 'Truck', label: 'Proveedores', sub: 'Directorio importadores.', order: 5, tab: 'proveedores' },
            { id: 'btn_sys_almacenes', icon: 'ArchiveRestore', label: 'Almacenes', sub: 'Depositos de stock.', order: 6, tab: 'almacenes' },
            { id: 'btn_sys_monedas', icon: 'Banknote', label: 'Monedas', sub: 'Divisas en compras.', order: 7, tab: 'monedas' },
            { id: 'btn_sys_tipos_facturas', icon: 'FileText', label: 'Tipos Comprobantes', sub: 'Tipos de facturas.', order: 8, tab: 'tipos_facturas' }
        ];
        
        let newHtml = startToken + '\n';
        for (const b of buttons) {
            newHtml += `      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, '${b.id}')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, '${b.id}')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('${b.id}'); }
               else { setActiveTab('${b.tab}'); }
           }} 
           style={{ order: uiConfigs['${b.id}']?.order_index || ${b.order} }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5\`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="${b.id}" fallback={${b.icon}} className={\`w-6 h-6 \${uiConfigs['${b.id}']?.icon_color || ''}\`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['${b.id}']?.label || '${b.label}'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['${b.id}']?.sub_label || '${b.sub}'}</p>
            </div>
      </button>\n`;
        }
        newHtml += '  </motion.div>';
        c = c.substring(0, startIndex) + newHtml + c.substring(nextMotionDivEnd + 13);
    }
}

// 6. Imports and activeTab logic
if (!c.includes('FileText')) {
    c = c.replace("import { Settings, Box, Network,", "import { Settings, Box, Network, FileText,");
}

if (!c.includes("activeTab === 'tipos_facturas'")) {
    const tabContent = `\n\n      {activeTab === 'tipos_facturas' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500"/> Tipos de Comprobantes</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">Gestión de tipos de facturas y comprobantes para el sistema.</p>
          <div className="flex-1 min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
             <p className="text-slate-400 font-bold text-xs">Módulo en construcción.</p>
          </div>
        </motion.div>
      )}\n`;
    c = c.replace('</AnimatePresence>', tabContent + '</AnimatePresence>');
}

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Restored all fixes.');
