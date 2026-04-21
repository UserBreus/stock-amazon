import fs from 'fs';

let txt = fs.readFileSync('src/components/ui/CategoryDrillDownModal.tsx', 'utf8');

// 1. Add selectedVariantGroup state
const stateSearch = `const [selectedMaestroId, setSelectedMaestroId] = useState<string | null>(null);`;
txt = txt.replace(stateSearch, stateSearch + `\n  const [selectedVariantGroup, setSelectedVariantGroup] = useState<string | null>(null);`);

// 2. Modify displayItems logic
const beforeLogic = `    if (!selectedMaestroId) {
      // Vista Nivel 1: Productos Maestros dentro de la Categoría Seleccionada`;

const logicToReplace = `    // Vista Nivel 2: Variantes dentro del Maestro (Producto Final Elegible)
    return productos.filter(p => p.producto_maestro_id?.toString() === selectedMaestroId)
      .map(p => ({
        type: 'product' as const,
        id: p.id.toString(),
        label: p.nombre_variante || 'Normal',
        sublabel: \`Variante de \${p.producto_nombre}\`,
        icon: Network
      }));

  }, [categorias, productos, query, selectedCategoryId, selectedMaestroId, isGlobalSearch]);`;

const replacementLogic = `    // Lógica para agrupamiento de variantes (Nivel 2.5)
    const variantsOfMaestro = productos.filter(p => p.producto_maestro_id?.toString() === selectedMaestroId);
    
    const groupsMap = new Map();
    variantsOfMaestro.forEach(p => {
       const varName = p.nombre_variante || 'Normal';
       const groupName = varName.split(' - ')[0].trim();
       if (!groupsMap.has(groupName)) {
           groupsMap.set(groupName, {
              type: 'variantGroup' as const,
              id: groupName,
              label: groupName,
              sublabel: '0 variantes',
              icon: Folder, // folder icon for group
              count: 0
           });
       }
       groupsMap.get(groupName).count++;
    });

    const groups = Array.from(groupsMap.values());
    const shouldGroup = groups.length > 0 && groups.length < variantsOfMaestro.length;

    if (shouldGroup && !selectedVariantGroup) {
       // Nivel 2 Intermedio: Grupos de atributos (ej. "Rojo", "Azul")
       return groups.map(g => ({...g, sublabel: \`\${g.count} variantes\`}));
    }

    // Vista Nivel Final: Variantes seleccionables
    return variantsOfMaestro
      .filter(p => {
          if (!shouldGroup) return true; // Show all if no grouping needed
          const varName = p.nombre_variante || 'Normal';
          return varName.split(' - ')[0].trim() === selectedVariantGroup;
      })
      .map(p => ({
        type: 'product' as const,
        id: p.id.toString(),
        label: p.nombre_variante || 'Normal',
        sublabel: \`Variante de \${p.producto_nombre}\`,
        icon: Network
      }));

  }, [categorias, productos, query, selectedCategoryId, selectedMaestroId, selectedVariantGroup, isGlobalSearch]);`;

const startIdx = txt.indexOf('    // Vista Nivel 2: Variantes dentro del Maestro');
const endIdx = txt.indexOf('  }, [categorias, productos, query');

if (startIdx !== -1 && endIdx !== -1) {
    const origBlock = txt.substring(startIdx, endIdx + txt.substring(endIdx).indexOf(';') + 1);
    txt = txt.replace(origBlock, replacementLogic);
} else {
    console.error("Could not find replacement block");
}

// 3. Update goBack button logic
// The header has a back button logic
const backSearch1 = `onClick={() => { if(selectedMaestroId) setSelectedMaestroId(null); else setSelectedCategoryId(null); }}`;
const backRepl1 = `onClick={() => { if (selectedVariantGroup) setSelectedVariantGroup(null); else if(selectedMaestroId) setSelectedMaestroId(null); else setSelectedCategoryId(null); }}`;
txt = txt.replace(backSearch1, backRepl1);

// 4. Update click handler logic inside the list mapping
const clickHandlers = `if (item.type === 'category') {
                          setSelectedCategoryId(item.id);
                          setQuery('');
                        } else if (item.type === 'maestro') {
                          setSelectedMaestroId(item.id);
                          setQuery('');`;

const newClickHandlers = `if (item.type === 'category') {
                          setSelectedCategoryId(item.id);
                          setQuery('');
                        } else if (item.type === 'maestro') {
                          setSelectedMaestroId(item.id);
                          setQuery('');
                        } else if (item.type === 'variantGroup') {
                          setSelectedVariantGroup(item.id);
                          setQuery('');`;

txt = txt.replace(clickHandlers, newClickHandlers);

// Also need to clear selectedVariantGroup when multi-select saves or closes
txt = txt.replace(
    'setSelectedMaestroId(null);\n                        setQuery(\'\');',
    'setSelectedMaestroId(null);\n                        setSelectedVariantGroup(null);\n                        setQuery(\'\');'
);

// 5. Update the group-hover background for variantGroup
const groupHoverSearch = `item.type === 'category' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:bg-amber-200" :
                          item.type === 'maestro' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:bg-indigo-200" :`;
const groupHoverRepl = `item.type === 'category' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:bg-amber-200" :
                          item.type === 'maestro' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:bg-indigo-200" :
                          item.type === 'variantGroup' ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 group-hover:bg-rose-200" :`;
txt = txt.replace(groupHoverSearch, groupHoverRepl);

const rightChevronSearch = `{(item.type === 'category' || item.type === 'maestro') && (`
const rightChevronRepl = `{(item.type === 'category' || item.type === 'maestro' || item.type === 'variantGroup') && (`
txt = txt.replace(rightChevronSearch, rightChevronRepl);

// Write changes
fs.writeFileSync('src/components/ui/CategoryDrillDownModal.tsx', txt);
console.log("Updated to support variant groups");
