const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

// Find the exact line with requiere_lote and codigo_sku
const oldLine = "                     p.id as prod_id, p.nombre as prod_name, p.codigo_sku as prod_sku, p.requiere_lote,";
const newLine = "                     p.id as prod_id, p.nombre as prod_name,";

if (code.includes(oldLine)) {
  code = code.replace(oldLine, newLine);
  // Also add ORDER BY to the query
  const oldFrom = "              LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id\r\n          \`";
  const newFrom = "              LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id\r\n              ORDER BY c.nombre ASC, p.nombre ASC, v.nombre_variante ASC\r\n          \`";
  code = code.replace(oldFrom, newFrom);
  fs.writeFileSync('src/pages/InventarioOperativo.tsx', code);
  console.log('Fixed! requiere_lote and codigo_sku removed from openCatalog query.');
} else {
  // Try to find what's there now
  const idx = code.indexOf('requiere_lote');
  console.log('requiere_lote found at:', idx);
  if (idx !== -1) console.log('Context:', JSON.stringify(code.substring(idx - 100, idx + 50)));
}
