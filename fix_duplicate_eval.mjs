import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const target = "const printEtiquetas = printProduct ? etiquetas.filter(e => e.variante_id === printProduct.variante_id && e.estado === 'activo') : [];";
const replacement = `useEffect(() => {
    if(printProduct && !isLabelCompraModalOpen) {
       // Manual mode triggers: when printing a single product from stock
       // For Purchase Orders, setPrintEtiquetas is managed directly.
       const filtradas = etiquetas.filter(e => e.variante_id === printProduct.variante_id && e.estado === 'activo');
       setPrintEtiquetas(filtradas);
    }
  }, [printProduct, etiquetas, isLabelCompraModalOpen]);`;

txt = txt.replace(target, replacement);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial.tsx printEtiquetas duplicate variable removed!");
