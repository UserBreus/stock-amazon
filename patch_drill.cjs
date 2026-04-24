const fs = require('fs');
let s = fs.readFileSync('src/components/ui/CategoryDrillDownModal.tsx', 'utf8');

const search = `      const maestrosMap = new Map();
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

const replace = `      const maestrosMap = new Map();
      prodsInCat.forEach(p => {
         if (!maestrosMap.has(p.producto_maestro_id)) {
            maestrosMap.set(p.producto_maestro_id, {
               type: 'maestro' as const,
               id: p.producto_maestro_id.toString(),
               label: p.producto_nombre,
               sublabel: '0 variantes',
               icon: Box,
               count: 0,
               exactVariantId: p.id
            });
         } else {
             const m = maestrosMap.get(p.producto_maestro_id);
             m.exactVariantId = p.id;
         }
         maestrosMap.get(p.producto_maestro_id).count++;
      });
      return Array.from(maestrosMap.values()).map(m => {
          if (m.count === 1) {
              return {
                 type: 'product' as const,
                 id: m.exactVariantId.toString(),
                 label: m.label,
                 sublabel: 'Variante Única',
                 icon: Box
              };
          }
          return {
             ...m, 
             sublabel: \`\${m.count} variantes\`
          };
      });`;

s = s.replace(search, replace);
fs.writeFileSync('src/components/ui/CategoryDrillDownModal.tsx', s);
console.log('Patched');
