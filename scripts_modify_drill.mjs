import fs from 'fs';

let txt = fs.readFileSync('src/components/ui/CategoryDrillDownModal.tsx', 'utf8');

const s1 = `  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);`;
const r1 = `  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);\n  const [selectedMaestroId, setSelectedMaestroId] = useState<string | null>(null);`;

txt = txt.replace(s1, r1);

const bodyStart = txt.indexOf('  const displayItems = useMemo(() => {');
const bodyEnd = txt.indexOf('  }, [categorias, productos, query, selectedCategoryId, isGlobalSearch');
if (bodyStart === -1 || bodyEnd === -1) {
    console.log("Could not find displayItems useMemo block");
    process.exit(1);
}

const newBody = `  const displayItems = useMemo(() => {
    if (isGlobalSearch) {
      // Global Search: Solo productos. Filtrar por nombre y cat_nombre.
      return productos.filter(p => 
        p.nombre.toLowerCase().includes(query.toLowerCase()) || 
        (p.cat_nombre && p.cat_nombre.toLowerCase().includes(query.toLowerCase()))
      ).map(p => ({
        type: 'product' as const,
        id: p.id.toString(),
        label: p.nombre,
        sublabel: p.cat_nombre,
        icon: Network
      }));
    }

    if (!selectedCategoryId) {
      // Vista Raíz: Categorías. Mostramos cuántos productos tiene.
      return categorias.map(c => {
        const prodCount = new Set(productos.filter(p => p.categoria_id?.toString() === c.id.toString()).map(p => p.producto_maestro_id)).size;
        return {
          type: 'category' as const,
          id: c.id.toString(),
          label: c.nombre,
          sublabel: \`\${prodCount} artículos maestros\`,
          icon: Folder
        };
      }).sort((a,b) => a.label.localeCompare(b.label)); // Order by Name
    }

    if (!selectedMaestroId) {
      // Vista Nivel 1: Productos Maestros dentro de la Categoría Seleccionada
      const prodsInCat = productos.filter(p => p.categoria_id?.toString() === selectedCategoryId);
      const maestrosMap = new Map();
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
      return Array.from(maestrosMap.values()).map(m => ({...m, sublabel: \`\${m.count} variantes\`}));
    }

    // Vista Nivel 2: Variantes dentro del Maestro (Producto Final Elegible)
    return productos.filter(p => p.producto_maestro_id?.toString() === selectedMaestroId)
      .map(p => ({
        type: 'product' as const,
        id: p.id.toString(),
        label: p.nombre_variante || 'Normal',
        sublabel: \`Variante de \${p.producto_nombre}\`,
        icon: Network
      }));

  }, [categorias, productos, query, selectedCategoryId, selectedMaestroId, isGlobalSearch]);`;

txt = txt.substring(0, bodyStart) + newBody + txt.substring(bodyEnd + Math.min(68, txt.indexOf(']', bodyEnd) - bodyEnd + 1));

// Add Box import
if (!txt.includes('Box')) {
    txt = txt.replace('Folder, Network, LayoutGrid, List } from \'lucide-react\'', 'Folder, Network, LayoutGrid, List, Box } from \'lucide-react\'');
}

// Modify Back Button logic
txt = txt.replace(
    'onClick={() => setSelectedCategoryId(null)}',
    'onClick={() => { if(selectedMaestroId) setSelectedMaestroId(null); else setSelectedCategoryId(null); }}'
);

// Modify Drilldown Click Handler
txt = txt.replace(
    /if \(item\.type === 'category'\) \{\s*setSelectedCategoryId\(item\.id\);\s*setQuery\(''\);\s*\}/,
    `if (item.type === 'category') {
                          setSelectedCategoryId(item.id);
                          setQuery('');
                        } else if (item.type === 'maestro') {
                          setSelectedMaestroId(item.id);
                          setQuery('');
                        }`
);

// Modify Group Hover Styling for Maestro
txt = txt.replace(
    `item.type === 'category' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:bg-amber-200" :`,
    `item.type === 'category' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:bg-amber-200" :
                          item.type === 'maestro' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:bg-indigo-200" :`
);

txt = txt.replace(
    `{item.type === 'category' && (`,
    `{(item.type === 'category' || item.type === 'maestro') && (`
);

txt = txt.replace(
    `group-hover:text-amber-600`,
    `group-hover:text-amber-600 dark:group-hover:text-amber-400`
);

fs.writeFileSync('src/components/ui/CategoryDrillDownModal.tsx', txt);
console.log("Drill down modal updated for 3 levels");
