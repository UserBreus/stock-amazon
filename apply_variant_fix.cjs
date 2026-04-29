const fs = require('fs');

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const targetContent = `         const generadasProd = combinaciones.map(comb => {
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
  }, [atributos, varProdIds, productos]);`;

const replacementContent = `         const generadasProd = combinaciones.map(comb => {
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

c = c.replace(targetContent, replacementContent);
fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Applied variant fix.');
