import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. imports
if (!txt.includes('CategoryDrillDownModal')) {
    txt = txt.replace(
        "import { ModalSelector } from '../components/ui/ModalSelector';",
        "import { ModalSelector } from '../components/ui/ModalSelector';\nimport { CategoryDrillDownModal } from '../components/ui/CategoryDrillDownModal';"
    );
}

// 2. new state
if (!txt.includes('isLabelDrillDownOpen')) {
    txt = txt.replace(
        "const [labelCatalog, setLabelCatalog] = useState<any[]>([]);",
        "const [labelCatalog, setLabelCatalog] = useState<any[]>([]);\n  const [isLabelDrillDownOpen, setIsLabelDrillDownOpen] = useState(false);"
    );
}

// 3. modifying SQL for labelCatalog
const oldSQL = `            SELECT v.id as variante_id, pm.nombre + ' ' + ISNULL(v.nombre_variante,'') as nombre_completo, pm.nombre as producto_nombre, v.codigo_variante as sku, pm.categoria_id
            FROM Stock_Variantes v INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id`;
const newSQL = `            SELECT v.id as variante_id, pm.nombre + ' ' + ISNULL(v.nombre_variante,'') as nombre_completo, pm.nombre as producto_nombre, v.codigo_variante as sku, pm.categoria_id, pm.id as producto_maestro_id, v.nombre_variante
            FROM Stock_Variantes v INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id`;
txt = txt.replace(oldSQL, newSQL);

// 4. Transform labelCatalog mapped for CategoryDrillDownModal
// Below the declaration of labelCatalog, let's just make sure when passing to Modal it has correct keys
// The component is at the end of InventarioGerencial Return

// 5. Replace 'catalogo' tab view
const catStart = txt.indexOf("{/* PANEL CATÁLOGO */}");
const catEnd = txt.indexOf("{/* PANEL INGRESOS RECIENTES */}");

if (catStart !== -1 && catEnd !== -1) {
    const replacement = `{/* PANEL CATÁLOGO */}
          {labelTab === 'catalogo' && (
            <div className="space-y-4 py-4 flex flex-col items-center">
               <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 text-center space-y-4 w-full">
                  <Network className="w-10 h-10 text-indigo-400 mx-auto opacity-50"/>
                  <div>
                      <h4 className="font-black text-indigo-900 dark:text-indigo-300 text-sm">Catálogo de Artículos y Variantes</h4>
                      <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 max-w-[250px] mx-auto mt-1 font-medium">Usa el sistema de selección estructurado para elegir productos matriz y agregar todas sus variantes a impresión en lote.</p>
                  </div>
                  <button 
                     type="button"
                     onClick={() => setIsLabelDrillDownOpen(true)} 
                     className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl w-full font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/30"
                  >
                     <Network className="w-4 h-4"/> NAVEGAR CATÁLOGO (DRILL-DOWN)
                  </button>
               </div>
            </div>
          )}

          `;
    txt = txt.substring(0, catStart) + replacement + txt.substring(catEnd);
}

// 6. Append the CategoryDrillDownModal for Labels
const endOfModalStr = `      <Modal isOpen={isPrintConfigModalOpen} onClose={() => setIsPrintConfigModalOpen(false)} title="Calibrar Escala de Impresión">`;
const modalAppendment = `      <CategoryDrillDownModal 
         isOpen={isLabelDrillDownOpen}
         onClose={() => setIsLabelDrillDownOpen(false)}
         title="Buscar Artículo a Imprimir"
         categorias={tiposProducto}
         productos={labelCatalog.map(p => ({
             id: p.variante_id,
             nombre: p.nombre_completo,
             producto_maestro_id: p.producto_maestro_id,
             producto_nombre: p.producto_nombre,
             nombre_variante: p.nombre_variante,
             categoria_id: p.categoria_id,
             sku: p.sku
         }))}
         onSelect={(id) => {
             const prod = labelCatalog.find(p => p.variante_id.toString() === id.toString());
             if (prod) addToPrintCart(prod);
         }}
         multiSelect={true}
         onSelectMultiple={(ids) => {
             ids.forEach(id => {
                 const prod = labelCatalog.find(p => p.variante_id.toString() === id.toString());
                 if (prod) addToPrintCart(prod);
             });
             // toast already shows from the parent modal but we can leave it silent or add one
         }}
      />
      
`;
txt = txt.replace(endOfModalStr, modalAppendment + endOfModalStr);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial label catalog mapped to CategoryDrillDownModal");
