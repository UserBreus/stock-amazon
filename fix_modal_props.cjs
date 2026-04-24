const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

const oldModal = `      {/* MODAL CATÁLOGO PARA PEDIR INSUMOS */}
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
      />`;

const newModal = `      {/* MODAL CATÁLOGO PARA PEDIR INSUMOS */}
      <CategoryDrillDownModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        title="Seleccionar Insumos para Solicitar"
        categorias={catalogCategorias}
        productos={catalogProductos}
        closeOnSelect={false}
        onSelect={(varId: string) => {
          const found = catalogProductos.find((p: any) => String(p.var_id) === String(varId));
          if (!found) return;
          if (!solicitudCart.find((c: any) => String(c.var_id) === String(varId))) {
            setSolicitudCart(prev => [...prev, { ...found, cantidad: 1 }]);
            toast.success(found.var_name + ' agregado');
          } else {
            toast.error('Esta variante ya está en la solicitud');
          }
        }}
      />`;

if (code.includes(oldModal)) {
  code = code.replace(oldModal, newModal);
  fs.writeFileSync('src/pages/InventarioOperativo.tsx', code);
  console.log('Fixed! Modal props corrected.');
} else {
  console.log('Old modal text not found exactly. Searching...');
  const idx = code.indexOf('MODAL CATÁLOGO PARA PEDIR');
  console.log('Found marker at:', idx);
  console.log(JSON.stringify(code.substring(idx, idx + 500)));
}
