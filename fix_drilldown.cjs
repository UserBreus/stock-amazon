const fs = require('fs');
let s = fs.readFileSync('src/components/ui/CategoryDrillDownModal.tsx', 'utf8');

// The search block for grouping Maestros:
const maestroSearch = `      const maestrosMap = new Map();
      prodsInCat.forEach(p => {
         if (!maestrosMap.has(p.producto_maestro_id)) {
            maestrosMap.set(p.producto_maestro_id, {
               type: 'maestro' as const,
               id: p.producto_maestro_id.toString(),
               label: p.producto_nombre,
               sublabel: '0 variantes',
               icon: Box,
               count: 0
            });
         }
         maestrosMap.get(p.producto_maestro_id).count++;
      });
      return Array.from(maestrosMap.values()).map(m => ({...m, sublabel: \`\${m.count} variantes\`}));`;

const maestroReplace = `      const maestrosMap = new Map();
      prodsInCat.forEach(p => {
         if (!maestrosMap.has(p.producto_maestro_id)) {
            maestrosMap.set(p.producto_maestro_id, {
               type: 'maestro' as const,
               id: p.producto_maestro_id.toString(),
               label: p.producto_nombre,
               sublabel: '0 variantes',
               icon: Box,
               count: 0,
               exactVariantId: p.id,
               exactVariantName: p.nombre_variante
            });
         } else {
            const m = maestrosMap.get(p.producto_maestro_id);
            m.exactVariantId = p.id;
            m.exactVariantName = p.nombre_variante;
         }
         maestrosMap.get(p.producto_maestro_id).count++;
      });
      return Array.from(maestrosMap.values()).map(m => {
          if (m.count === 1) {
              return {
                 type: 'product' as const,
                 id: m.exactVariantId.toString(),
                 label: m.label,
                 sublabel: m.exactVariantName || 'Precione para añadir',
                 icon: Box
              };
          }
          return {
             ...m, 
             sublabel: \`\${m.count} variantes\`
          };
      });`;

s = s.replace(maestroSearch, maestroReplace);

// Remove "Única" text for labels inside drilldown:
s = s.replace(/const varName = p\.nombre_variante \|\| 'Única';/g, "const varName = p.nombre_variante || p.producto_nombre || '';");
s = s.replace(/label: p\.nombre_variante \|\| 'Única',/g, "label: p.nombre_variante ? p.nombre_variante : (p.producto_nombre || ''),");


fs.writeFileSync('src/components/ui/CategoryDrillDownModal.tsx', s);
console.log('CategoryDrillDownModal patched successfully');
