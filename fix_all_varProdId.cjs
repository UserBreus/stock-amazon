const fs = require('fs');

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. Fixing useEffect for generating variants (line 293)
const effectTarget = `  useEffect(() => {
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

const effectReplacement = `  useEffect(() => {
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

c = c.replace(effectTarget, effectReplacement);
if (c.indexOf(effectReplacement) === -1) {
    // try fuzzy regex
    c = c.replace(/  useEffect\(\(\) => \{\s*if\(atributos\.length === 0 \|\| !varProdId\) \{.*?setVariantesGeneradas\(generadas\);\s*\}, \[atributos, varProdId, productos\]\);/ms, effectReplacement);
}

// 2. Fix createVariantesMasivas (line ~295)
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

c = c.replace(/  const createVariantesMasivas = async \(\) => \{.*?setIsSaving\(false\);\s*\}\s*\};/ms, createVarReplacement);


// 3. Fix render conditions
c = c.replace(/varProdId \?/g, "varProdIds.length > 0 ?");
c = c.replace(/!varProdId/g, "varProdIds.length === 0");
c = c.replace(/varProdId \&\&/g, "varProdIds.length > 0 &&");
c = c.replace(/varProdId/g, "varProdIds");

// Fix the selector text in UI
c = c.replace(`varProdIds.length > 0 ? productos.find(p => p.id.toString() === varProdIds)?.nombre : "Buscar..."`, 
              `varProdIds.length > 0 ? (varProdIds.length === 1 ? productos.find(p => p.id.toString() === varProdIds[0])?.nombre : \`\${varProdIds.length} seleccionados\`) : "Buscar..."`);


// Fix single inserts
c = c.replace(`INSERT INTO Stock_Variantes (producto_maestro_id, codigo_variante, nombre_variante) VALUES ('\${varProdIds}', '\${varSku.replace(/'/g, "''")}', '\${varNombre.replace(/'/g, "''")}')`,
              `INSERT INTO Stock_Variantes (producto_maestro_id, codigo_variante, nombre_variante) VALUES ('\${varProdIds[0]}', '\${varSku.replace(/'/g, "''")}', '\${varNombre.replace(/'/g, "''")}')`);

// Fix modal property
c = c.replace(`selectedValue={varProdIds}`, `selectedValue="" multiSelect={true} onSelectMultiple={setVarProdIds} activeItemIds={varProdIds}`);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log("Fixed all varProdId references.");
