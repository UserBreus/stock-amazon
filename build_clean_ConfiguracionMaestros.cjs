const { execSync } = require('child_process');
const fs = require('fs');

console.log("Checking out fresh copy...");
execSync('git checkout src/pages/ConfiguracionMaestros.tsx');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. varProdIds state
c = c.replace("const [varProdId, setVarProdId] = useState('');", "const [varProdIds, setVarProdIds] = useState<string[]>([]);");

// 2. update useEffect for generadas
const useEffectTarget = `  useEffect(() => {
     if(atributos.length === 0 || !varProdId) {
         setVariantesGeneradas([]);
         return;
     }

     const combinaciones = generarCombinaciones(atributos);
     const prod = productos.find(p => p.id.toString() === varProdId);
     const prefixBase = prod?.sku || (prod?.nombre ? prod.nombre.substring(0, 3).toUpperCase() : 'VAR');
     const baseName = prod?.nombre || 'ART';

     const generadas = combinaciones.map(comb => {
         const suffix = comb.map((c:any) => c.valor.substring(0,3).toUpperCase().replace(/[^A-Z0-9]/g, '')).join('-');
         const metadata = comb.reduce((acc:any, c:any) => ({...acc, [c.nombre]: c.valor}), {});
         return { 
             nombre: \`\${baseName} - \${comb.map((c:any) => c.valor).join(' - ')}\`, 
             sku: \`\${prefixBase}-\${suffix}\`, 
             activa: true,
             metadata
         };
     });
     setVariantesGeneradas(generadas);
  }, [atributos, varProdId, productos]);`;

const useEffectReplacement = `  useEffect(() => {
     if(atributos.length === 0 || varProdIds.length === 0) {
         setVariantesGeneradas([]);
         return;
     }

     const combinaciones = generarCombinaciones(atributos);
     let generadas: any[] = [];

     for (const id of varProdIds) {
         const prod = productos.find(p => p.id.toString() === id);
         if (!prod) continue;
         const prefixBase = prod.sku || (prod.nombre ? prod.nombre.substring(0, 3).toUpperCase() : 'VAR');
         const baseName = prod.nombre || 'ART';

         const generadasProd = combinaciones.map(comb => {
             const suffix = comb.map((c:any) => c.valor.substring(0,3).toUpperCase().replace(/[^A-Z0-9]/g, '')).join('-');
             const metadata = comb.reduce((acc:any, c:any) => ({...acc, [c.nombre]: c.valor}), {});
             const newSku = \`\${prefixBase}-\${suffix}\`;
             const newNombre = \`\${baseName} - \${comb.map((c:any) => c.valor).join(' - ')}\`;
             const existe = variantes.some(v => v.producto_maestro_id?.toString() === id && (v.codigo_variante === newSku || v.nombre_variante === newNombre));
             
             return { 
                 nombre: newNombre, 
                 sku: newSku, 
                 activa: !existe,
                 prodId: id,
                 metadata,
                 yaExiste: existe
             };
         });
         generadas = generadas.concat(generadasProd);
     }
     
     setVariantesGeneradas(generadas);
  }, [atributos, varProdIds, productos, variantes]);`;

c = c.replace(useEffectTarget, useEffectReplacement);

// 3. createVariantesMasivas
const createVarTarget = `  const createVariantesMasivas = async () => {
    if(!varProdId) return toast.error("Selecciona un título.");
    const validas = variantesGeneradas.filter(v => v.activa);
    if(validas.length === 0) return toast.error("No hay modelos activos.");
    setIsSaving(true);
    try {
       const attrJson = JSON.stringify(atributos).replace(/'/g, "''");
       let q = \`UPDATE Stock_Productos_Maestros SET atributos_config = '\${attrJson}' WHERE id = \${varProdId};\\n\`;
       validas.forEach(v => {
          q += \`INSERT INTO Stock_Variantes (producto_maestro_id, codigo_variante, nombre_variante, metadata_json) VALUES (\${varProdId}, '\${v.sku || ''}', '\${v.nombre.replace(/'/g, "''")}', '\${JSON.stringify(v.metadata).replace(/'/g, "''")}');\\n\`;
       });
       await executeAWSQuery(q);
       toast.success(\`\${validas.length} Modelos Creados Exitosamente.\`);
       fetchData();
       setVarProdId('');
       setNuevoAtributo('');
       setAtributos([]);
       setVariantesGeneradas([]);
       setIsProdModalOpen(false);
    } catch (err: any) {
       toast.error("Error al registrar modelos: " + err.message);
    } finally {
       setIsSaving(false);
    }
  };`;

const createVarReplacement = `  const createVariantesMasivas = async () => {
    if(varProdIds.length === 0) return toast.error("Selecciona al menos un artículo base.");
    const validas = variantesGeneradas.filter(v => v.activa && !v.yaExiste);
    if(validas.length === 0) return toast.error("No hay modelos activos o todos ya existen.");
    setIsSaving(true);
    try {
       const attrJson = JSON.stringify(atributos).replace(/'/g, "''");
       let q = '';
       varProdIds.forEach(pid => {
           q += \`UPDATE Stock_Productos_Maestros SET atributos_config = '\${attrJson}' WHERE id = \${pid};\\n\`;
       });
       validas.forEach(v => {
          q += \`INSERT INTO Stock_Variantes (producto_maestro_id, codigo_variante, nombre_variante, metadata_json) VALUES (\${v.prodId}, '\${v.sku || ''}', '\${v.nombre.replace(/'/g, "''")}', '\${JSON.stringify(v.metadata).replace(/'/g, "''")}');\\n\`;
       });
       await executeAWSQuery(q);
       toast.success(\`\${validas.length} Modelos Creados Exitosamente.\`);
       fetchData();
       setVarProdIds([]);
       setNuevoAtributo('');
       setAtributos([]);
       setVariantesGeneradas([]);
       setIsProdModalOpen(false);
    } catch (err: any) {
       toast.error("Error al registrar modelos: " + err.message);
    } finally {
       setIsSaving(false);
    }
  };

  const updateVarianteInline = async (id: number, nuevoNombre: string, nuevoSku: string) => {
      try {
          await executeAWSQuery(\`UPDATE Stock_Variantes SET nombre_variante='\${nuevoNombre.replace(/'/g, "''")}', codigo_variante='\${nuevoSku.replace(/'/g, "''")}' WHERE id = \${id}\`);
          toast.success('Variante actualizada.');
          fetchData();
      } catch (e: any) {
          toast.error('Error al actualizar variante.');
          console.error(e);
      }
  };`;

c = c.replace(createVarTarget, createVarReplacement);

// 4. Update the Button Grid
const btnGridTarget = `              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">`;
const btnGridReplacement = `              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">`;
c = c.replace(btnGridTarget, btnGridReplacement);

const newBtn = `
                <button
                  onClick={() => setActiveTab('tipos_facturas')}
                  className={\`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group \${activeTab === 'tipos_facturas' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 bg-white dark:bg-slate-950'}\`}
                >
                  <div className={\`absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 \${activeTab === 'tipos_facturas' ? 'opacity-100' : 'group-hover:opacity-100'}\`} />
                  <DynamicUIIcon id="btn_sys_tipos_facturas" fallback={FileText} className={\`w-8 h-8 mb-3 transition-colors \${activeTab === 'tipos_facturas' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}\`} />
                  <span className={\`text-sm font-black text-center transition-colors \${activeTab === 'tipos_facturas' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}\`}>Tipos Comprobantes</span>
                </button>
              </div>`;

c = c.replace(`              </div>\n            </motion.div>`, newBtn + `\n            </motion.div>`);

// 5. Delete window.confirms
c = c.replace("if(!window.confirm('¿Eliminar definitivamente este Artículo Maestro? Todas sus variantes se eliminarán si no tienen stock.')) return;", "");
c = c.replace("if(!window.confirm('¿Eliminar definitivamente esta variante? Solo es posible si no tiene movimientos ni stock.')) return;", "");

// 6. VarProd Modal Button
const varProdBtnTarget = `<button onClick={() => setIsProdModalOpen(true)} className="w-full text-left px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between items-center shadow-sm">
                                            {productos.find(p => p.id.toString() === varProdId)?.nombre || 'Seleccione Título Base...'}
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </button>`;
const varProdBtnReplacement = `<button onClick={() => setIsProdModalOpen(true)} className="w-full text-left px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between items-center shadow-sm">
                                            {varProdIds.length === 0 ? 'Seleccionar Títulos Base...' : varProdIds.length === 1 ? productos.find(p => p.id.toString() === varProdIds[0])?.nombre : \`\${varProdIds.length} artículos seleccionados\`}
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </button>`;
c = c.replace(varProdBtnTarget, varProdBtnReplacement);

// 7. Modals replacement
const modalTarget = `      <CategoryDrillDownModal
        title="Selecciona un Artículo"
        isOpen={isProdModalOpen}
        onClose={() => setIsProdModalOpen(false)}
        categorias={categorias}
        productos={productos}
        selectedValue={varProdId}
        onSelect={setVarProdId}
      />`;

const modalReplacement = `      <CategoryDrillDownModal
        title="Selecciona uno o más Artículos Maestros"
        isOpen={isProdModalOpen}
        onClose={() => setIsProdModalOpen(false)}
        categorias={categorias}
        productos={productos}
        selectedValue=""
        onSelect={() => {}}
        multiSelect={true}
        onSelectMultiple={setVarProdIds}
        activeItemIds={varProdIds}
      />`;
c = c.replace(modalTarget, modalReplacement);

// 8. Bottom variants table filtering
c = c.replace(/variantes\.filter\(v => v\.producto_maestro_id\?\.toString\(\) === varProdId\)/g, "variantes.filter(v => varProdIds.includes(v.producto_maestro_id?.toString()))");

// 9. Ya Existe Badge for generated variants
const rowTarget = `{variantesGeneradas.map((vg, i) => (
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

const rowReplacement = `{variantesGeneradas.map((vg, i) => (
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
c = c.replace(rowTarget, rowReplacement);

// 10. Update variant inline rendering in bottom table
const bottomRowTarget = `<td className="py-3 pr-4">
                                                    {v.nombre_variante}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{v.codigo_variante}</span>
                                                </td>`;

const bottomRowReplacement = `<td className="py-3 pr-4">
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
                                                </td>`;
c = c.replace(bottomRowTarget, bottomRowReplacement);

// 11. Add Tipos de Factura activeTab check
c = c.replace(`</div>\n    </div>`, `
      {activeTab === 'tipos_facturas' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500"/> Tipos de Comprobantes</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">Gestión de tipos de facturas y comprobantes para el sistema.</p>
          <div className="flex-1 min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
             <p className="text-slate-400 font-bold text-xs">Módulo en construcción.</p>
          </div>
        </motion.div>
      )}
</div>
    </div>`);


fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log("Successfully rebuilt the entire file.");
