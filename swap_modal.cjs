const fs = require('fs');
let s = fs.readFileSync('src/pages/Ingresos.tsx', 'utf8');

const startIdx = s.indexOf('<Modal title="" isOpen={isCatalogModalOpen} onClose={() => setIsCatalogModalOpen(false)}>');
const endIdx = s.indexOf('</Modal>', startIdx) + '</Modal>'.length;

if (startIdx > -1 && endIdx > -1) {
    const newModal = `      <CategoryDrillDownModal
        title="Explorador de Catálogo Master"
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        categorias={categorias}
        productos={variantes.map(v => ({
           id: v.id.toString(),
           nombre: v.nombre_variante,
           sku: v.sku,
           categoria_id: v.categoria_id,
           producto_maestro_id: v.producto_maestro_id,
           producto_nombre: v.producto_padre,
           unidad_base: v.unidad_base
        }))}
        multiSelect={true}
        onSelectMultiple={(ids) => {
           const nuevasVariantes = ids.map(id => {
               const v = variantes.find(va => va.id.toString() === id.toString());
               return { variante: {...v, producto_padre: v.producto_padre}, cantidad: 0, precio_unitario: 0 };
           });
           
           setCarrito(prev => {
               const filtradas = nuevasVariantes.filter(nv => !prev.some(p => p.variante.id === nv.variante.id));
               if (filtradas.length > 0) {
                   toast.success(\`\${filtradas.length} artículos añadidos a la factura.\`);
               } else if (ids.length > 0) {
                   toast.error('Estos artículos ya están en la factura.');
               }
               return [...prev, ...filtradas];
           });
        }}
        activeItemIds={carrito.map(c => c.variante.id.toString())}
      />`;
      
    s = s.substring(0, startIdx) + newModal + s.substring(endIdx);
    
    // We need to import CategoryDrillDownModal at the top!
    if (!s.includes('CategoryDrillDownModal')) {
        s = s.replace(/import \{ ModalSelector \} from '\.\.\/components\/ui\/ModalSelector';/, "import { ModalSelector } from '../components/ui/ModalSelector';\nimport { CategoryDrillDownModal } from '../components/ui/CategoryDrillDownModal';");
    }
    
    fs.writeFileSync('src/pages/Ingresos.tsx', s);
    console.log('Substituted manually maintained Modal with CategoryDrillDownModal');
} else {
    console.log('Failed to find modal limits');
}
