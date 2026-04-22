const fs = require('fs');
let content = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

if (!content.includes('CategoryDrillDownModal')) {
    content = content.replace(
        "import { Modal } from './ui/Modal';",
        "import { Modal } from './ui/Modal';\nimport { CategoryDrillDownModal } from './ui/CategoryDrillDownModal';"
    );
    
    content = content.replace(
        "const [scanInput, setScanInput] = useState('');",
        "const [scanInput, setScanInput] = useState('');\n  const [isCatalogOpen, setIsCatalogOpen] = useState(false);\n  const [catalogCategorias, setCatalogCategorias] = useState<any[]>([]);\n  const [catalogProductos, setCatalogProductos] = useState<any[]>([]);\n  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);"
    );
    
    const catalogLogic = `
  const openCatalog = async () => {
      if(!origenId) return toast.error("Seleccione un Origen Logístico primero.");
      setIsLoadingCatalog(true);
      try {
          const catRes = await executeAWSQuery("SELECT id, nombre FROM Stock_Categorias ORDER BY nombre");
          const prodRes = await executeAWSQuery(\`
              SELECT v.id, v.nombre_variante, v.nombre_variante as nombre, pm.id as producto_maestro_id, pm.nombre as producto_nombre, pm.categoria_id 
              FROM Stock_Variantes v
              INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
              WHERE EXISTS (
                 SELECT 1 FROM Stock_Etiquetas e WHERE e.variante_id = v.id AND e.deposito_id = \${origenId} AND e.cantidad_actual > 0
              )
          \`);
          setCatalogCategorias(catRes || []);
          setCatalogProductos(prodRes || []);
          setIsCatalogOpen(true);
      } catch (e: any) {
          toast.error("Error cargando catálogo: " + e.message);
      } finally {
          setIsLoadingCatalog(false);
      }
  };

  const handleCatalogSelection = async (varianteId: string) => {
      setLoadingCode(true);
      try {
          const res = await executeAWSQuery(\`
              SELECT TOP 1 e.*, v.nombre_variante, pm.nombre as producto_nombre, d.nombre as deposito_nombre
              FROM Stock_Etiquetas e
              INNER JOIN Stock_Variantes v ON e.variante_id = v.id
              INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
              LEFT JOIN Stock_Depositos d ON e.deposito_id = d.id
              WHERE e.variante_id = \${varianteId} AND e.deposito_id = \${origenId} AND e.cantidad_actual > 0
              ORDER BY e.id ASC
          \`);
          if(res && res.length > 0) {
              const etq = res[0];
              if (cart.find(c => c.id === etq.id)) {
                 toast.error("La etiqueta física detectada de este producto ya está en la bandeja.");
              } else {
                 setCart([{...etq, cantidad_a_extraer: etq.cantidad_actual}, ...cart]);
                 toast.success("Producto agregado desde inventario físico");
              }
          } else {
              toast.error("No hay etiquetas físicas disponibles de este producto.");
          }
      } catch(e: any) {
          toast.error("Fallo al obtener etiqueta física: " + e.message);
      } finally {
          setLoadingCode(false);
      }
  };
`;
    content = content.replace('const handleManualCodeSubmit', catalogLogic + '\n  const handleManualCodeSubmit');
    
    content = content.replace(
        '<button onClick={() => setIsCameraOpen(true)} disabled={!origenId} className="h-14 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl disabled:opacity-50">Cámara</button>',
        '<button type="button" onClick={openCatalog} disabled={isLoadingCatalog || !origenId} className="h-14 px-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-black rounded-xl disabled:opacity-50 flex items-center gap-2"><Search className="w-5 h-5"/> Catálogo</button>\n                          <button onClick={() => setIsCameraOpen(true)} disabled={!origenId} className="h-14 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl disabled:opacity-50">Cámara</button>'
    );
    
    const modalJSX = `
      <AnimatePresence>
        <CategoryDrillDownModal 
           isOpen={isCatalogOpen} 
           onClose={() => setIsCatalogOpen(false)} 
           title="Selección Manual: Físico de Operaciones" 
           categorias={catalogCategorias} 
           productos={catalogProductos} 
           onSelect={handleCatalogSelection} 
           closeOnSelect={false}
           activeItemIds={cart.map(c => c.variante_id?.toString())} 
        />
      </AnimatePresence>
    `;
    
    content = content.replace(
        '</Modal>\n\n    </div>',
        '</Modal>\n' + modalJSX + '\n    </div>'
    );
    
    fs.writeFileSync('src/components/DespachoEgresos.tsx', content);
    console.log('Restored catalog logic');
} else {
    console.log('Already restored');
}
