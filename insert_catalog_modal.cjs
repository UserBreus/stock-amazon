const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

// Find the closing fragment and function
const CLOSE = "\n\r\n    </>\r\n  );\r\n}\r\n";
const idx = code.lastIndexOf('</>');
console.log('Last </> at:', idx);
console.log('Context:', JSON.stringify(code.substring(idx - 10, idx + 20)));

const MODAL = `
      {/* MODAL CATÁLOGO PARA PEDIR INSUMOS */}
      <CategoryDrillDownModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        categorias={catalogCategorias}
        productos={catalogProductos}
        onSelect={(item: any) => {
          if (!solicitudCart.find((c: any) => c.var_id === item.var_id)) {
            setSolicitudCart(prev => [...prev, { ...item, cantidad: 1 }]);
            toast.success('Agregado a la solicitud');
          } else {
            toast.error('Esta variante ya está en la solicitud');
          }
          setIsCatalogOpen(false);
        }}
      />

    `;

// Insert before the last </>
code = code.substring(0, idx) + MODAL + code.substring(idx);
fs.writeFileSync('src/pages/InventarioOperativo.tsx', code);
console.log('Modal inserted. File size:', code.length);
