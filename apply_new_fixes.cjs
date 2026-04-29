const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'pages', 'ConfiguracionMaestros.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Import FileText
content = content.replace(/Trash2, Banknote \}/, "Trash2, Banknote, FileText }");

// Fix 2: State variable varProdId -> varProdIds
content = content.replace(/const \[varProdId, setVarProdId\] = useState\(''\);/, "const [varProdIds, setVarProdIds] = useState<string[]>([]);");

// Fix 3: useEffect for varProdId -> varProdIds
content = content.replace(/useEffect\(\(\) => \{\s*if \(varProdId\) \{\s*const prod = productos\.find\(p => p\.id\.toString\(\) === varProdId\);\s*if \(prod && prod\.atributos_config\) \{\s*try \{ setAtributos\(JSON\.parse\(prod\.atributos_config\)\); \} catch\(e\) \{ setAtributos\(\[\]\); \}\s*\} else \{\s*setAtributos\(\[\]\);\s*\}\s*\} else \{\s*setAtributos\(\[\]\);\s*\}\s*setVariantesGeneradas\(\[\]\);\s*\}, \[varProdId, productos\]\);/, `useEffect(() => {
    if (varProdIds.length > 0) {
       const prod = productos.find(p => p.id.toString() === varProdIds[0]);
       if (prod && prod.atributos_config) {
          try { setAtributos(JSON.parse(prod.atributos_config)); } catch(e) { setAtributos([]); }
       } else {
          setAtributos([]);
       }
    } else {
       setAtributos([]);
    }
    setVariantesGeneradas([]);
  }, [varProdIds, productos]);`);

// Fix 4: useEffect for generarCombinaciones
content = content.replace(/useEffect\(\(\) => \{\s*if\(atributos\.length === 0\) \{\s*setVariantesGeneradas\(\[\]\);\s*return;\s*\}\s*if\(!atributos\.some\(a => a\.valores\.length > 0\)\) \{\s*setVariantesGeneradas\(\[\]\);\s*return;\s*\}\s*const prod = productos\.find\(p => p\.id\.toString\(\) === varProdId\);\s*const prefixBase = prod\?\.sku \|\| \(prod\?\.nombre \? prod\.nombre\.substring\(0, 3\)\.toUpperCase\(\) : 'VAR'\);\s*const combinaciones = atributos\.reduce\(\(acc, curr\) => \{\s*if \(curr\.valores\.length === 0\) return acc;\s*if \(acc\.length === 0\) return curr\.valores\.map\(v => \[v\]\);\s*const newAcc: string\[\]\[\] = \[\];\s*acc\.forEach\(prev => \{\s*curr\.valores\.forEach\(v => \{\s*newAcc\.push\(\[\.\.\.prev, v\]\);\s*\}\);\s*\}\);\s*return newAcc;\s*\}, \[\] as string\[\]\[\]\);\s*const generadas = combinaciones\.map\(comb => \{\s*const suffix = comb\.map\(v => v\.substring\(0,3\)\.toUpperCase\(\)\.replace\(\/\[\^A-Z0-9\]\/g, ''\)\)\.join\('-'\);\s*return \{\s*nombre: comb\.join\(' - '\),\s*sku: \`\$\{prefixBase\}-\$\{suffix\}\`,\s*activa: true\s*\};\s*\}\);\s*setVariantesGeneradas\(generadas\);\s*\}, \[atributos, varProdId, productos\]\);/, `useEffect(() => {
     if(atributos.length === 0 || varProdIds.length === 0) {
        setVariantesGeneradas([]);
        return;
     }     
     if(!atributos.some(a => a.valores.length > 0)) {
         setVariantesGeneradas([]);
         return;
     }

     const combinaciones = atributos.reduce((acc, curr) => {
         if (curr.valores.length === 0) return acc;
         if (acc.length === 0) return curr.valores.map(v => [{nombre: curr.nombre, valor: v}]);
         const newAcc: any[] = [];
         acc.forEach(prev => {
             curr.valores.forEach(v => {
                 newAcc.push([...prev, {nombre: curr.nombre, valor: v}]);
             });
         });
         return newAcc;
     }, [] as any[]);

     let generadas: any[] = [];

     for (const id of varProdIds) {
         const prod = productos.find(p => p.id.toString() === id);
         if (!prod) continue;
         const prefixBase = prod.sku || (prod.nombre ? prod.nombre.substring(0, 3).toUpperCase() : 'VAR');
         const baseName = prod.nombre || 'ART';

         const generadasProd = combinaciones.map(comb => {
             const suffix = comb.map((c:any) => c.valor.substring(0,3).toUpperCase().replace(/[^A-Z0-9]/g, '')).join('-');
             const metadata = comb.reduce((acc:any, c:any) => ({...acc, [c.nombre]: c.valor}), {});
             return { 
                 nombre: \`\${baseName} - \${comb.map((c:any) => c.valor).join(' - ')}\`, 
                 sku: \`\${prefixBase}-\${suffix}\`, 
                 activa: true,
                 prodId: id,
                 metadata
             };
         });
         generadas = generadas.concat(generadasProd);
     }
     
     setVariantesGeneradas(generadas);
  }, [atributos, varProdIds, productos]);`);

// Fix 5: createVariantesMasivas
content = content.replace(/const createVariantesMasivas = async \(\) => \{\s*if\(!varProdId\) return toast\.error\("Selecciona un título\."\);\s*const validas = variantesGeneradas\.filter\(v => v\.activa\);\s*if\(validas\.length === 0\) return toast\.error\("No hay variantes activas para guardar\."\);\s*setIsSaving\(true\);\s*try \{\s*const attrJson = JSON\.stringify\(atributosPersonalizados\);\s*let q = \`UPDATE Stock_Productos_Maestros SET atributos_config = '\$\{attrJson\}' WHERE id = \$\{varProdId\};\\n\`;\s*validas\.forEach\(v => \{\s*q \+= \`INSERT INTO Stock_Variantes \(producto_maestro_id, codigo_variante, nombre_variante\) VALUES \(\$\{varProdId\}, '\$\{v\.sku \|\| ''\}', '\$\{v\.nombre\.replace\(\/'\/g, "''"\)\}'\);\\n\`;\s*\}\);\s*await executeAWSQuery\(q\);\s*toast\.success\("Variantes y matriz guardadas"\);\s*setNuevoAtributo\(''\);\s*setVariantesGeneradas\(\[\]\);\s*setVarProdId\(''\);\s*fetchData\(\);\s*\} catch\(e\) \{\s*toast\.error\("Error al guardar"\);\s*console\.error\(e\);\s*\} finally \{\s*setIsSaving\(false\);\s*\}\s*\};/, `const createVariantesMasivas = async () => {
    if(varProdIds.length === 0) return toast.error("Selecciona al menos un artículo base.");
    const validas = variantesGeneradas.filter(v => v.activa);
    if(validas.length === 0) return toast.error("No hay variantes activas para guardar.");
    setIsSaving(true);
    try {
       const attrJson = JSON.stringify(atributosPersonalizados);
       let q = "";
       for (const id of varProdIds) {
           q += \`UPDATE Stock_Productos_Maestros SET atributos_config = '\${attrJson}' WHERE id = \${id};\\n\`;
       }
       validas.forEach(v => {
          q += \`INSERT INTO Stock_Variantes (producto_maestro_id, codigo_variante, nombre_variante, metadata_json) VALUES (\${v.prodId}, '\${v.sku || ''}', '\${v.nombre.replace(/'/g, "''")}', '\${JSON.stringify(v.metadata)}');\\n\`;
       });
       await executeAWSQuery(q);
       toast.success("Variantes y matriz guardadas");
       setNuevoAtributo('');
       setVariantesGeneradas([]);
       setVarProdIds([]);
       fetchData();
    } catch(e) {
       toast.error("Error al guardar");
       console.error(e);
    } finally {
       setIsSaving(false);
    }
  };`);

// Fix 6: deleteVariante remove window.confirm
content = content.replace(/const deleteVariante = async \(id: number\) => \{\s*if\(!window\.confirm\('¿Eliminar definitivamente esta variante\? Solo es posible si no tiene movimientos ni stock\.'\)\) return;\s*try \{/, `const deleteVariante = async (id: number) => {
      try {`);

// Fix 7: deleteProductoMaestro remove window.confirm
content = content.replace(/const deleteProductoMaestro = async \(id: number\) => \{\s*if\(!window\.confirm\('¿Eliminar definitivamente este Artículo Maestro\? Todas sus variantes se eliminarán si no tienen stock\.'\)\) return;\s*try \{/, `const deleteProductoMaestro = async (id: number) => {
      try {`);

// Fix 8: Button UI
content = content.replace(/<button onClick=\{\(\) => setIsProdModalOpen\(true\)\} className="w-full text-left px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between items-center shadow-sm">\s*\{productos\.find\(p => p\.id\.toString\(\) === varProdId\)\?\.nombre \|\| 'Seleccione Título Base\.\.\.'\}\s*<ChevronRight className="w-4 h-4 text-slate-400" \/>\s*<\/button>/, `<button onClick={() => setIsProdModalOpen(true)} className="w-full text-left px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex justify-between items-center shadow-sm">
                                            {varProdIds.length === 0 ? 'Seleccionar Títulos Base...' : varProdIds.length === 1 ? productos.find(p => p.id.toString() === varProdIds[0])?.nombre : \`\${varProdIds.length} artículos seleccionados\`}
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </button>`);

// Fix 9: Bottom Table rendering (varProdId -> varProdIds.includes)
content = content.replace(/variantes\.filter\(v => v\.producto_maestro_id\?\.toString\(\) === varProdId\)/g, "variantes.filter(v => varProdIds.includes(v.producto_maestro_id?.toString()))");
content = content.replace(/No hay variantes guardadas para este artículo maestro\./, "No hay variantes guardadas para los artículos seleccionados.");

// Fix 10: CategoryDrillDownModal Props
content = content.replace(/<CategoryDrillDownModal\s*title="Selecciona un Artículo"\s*isOpen=\{isProdModalOpen\}\s*onClose=\{\(\) => setIsProdModalOpen\(false\)\}\s*categorias=\{categorias\}\s*productos=\{productos\}\s*selectedValue=\{varProdId\}\s*onSelect=\{setVarProdId\}\s*\/>/, `<CategoryDrillDownModal
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
      />`);

// Fix 11: Render variants in table with inline update (from restore_fixes.cjs)
content = content.replace(/<td className="py-3 pr-4">\s*\{v\.nombre_variante\}\s*<\/td>\s*<td className="py-3 pr-4">\s*<span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">\{v\.codigo_variante\}<\/span>\s*<\/td>/, `<td className="py-3 pr-4">
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
                                                </td>`);

// Fix 12: Add updateVarianteInline function inside ConfiguracionMaestros
content = content.replace(/const createVariantesMasivas = async \(\) => \{[\s\S]*?\};/, `$&

  const updateVarianteInline = async (id: number, nuevoNombre: string, nuevoSku: string) => {
      try {
          await executeAWSQuery(\`UPDATE Stock_Variantes SET nombre_variante='\${nuevoNombre.replace(/'/g, "''")}', codigo_variante='\${nuevoSku.replace(/'/g, "''")}' WHERE id = \${id}\`);
          toast.success('Variante actualizada.');
          fetchData();
      } catch (e: any) {
          toast.error('Error al actualizar variante.');
          console.error(e);
      }
  };`);

// Fix 13: Add `FileText` to grid button
content = content.replace(/<DynamicUIIcon id="btn_sys_tipos_facturas" fallback=\{Settings\}/, '<DynamicUIIcon id="btn_sys_tipos_facturas" fallback={FileText}');

fs.writeFileSync(file, content);
console.log('Successfully applied fixes.');
