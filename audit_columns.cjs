const fs = require('fs');
const code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

// Columns that DON'T exist in Stock_Productos_Maestros (only: id, nombre, categoria_id, unidad_base)
const suspectColumns = ['requiere_lote', 'codigo_sku', 'descripcion', 'precio'];
suspectColumns.forEach(col => {
  const idx = code.indexOf(col);
  if (idx !== -1) {
    // Check if it's in a SQL query context
    console.log(`FOUND '${col}' at ${idx}:`, JSON.stringify(code.substring(idx - 80, idx + 40)));
  } else {
    console.log(`'${col}': OK - not found`);
  }
});

// Verify the openCatalog query is clean
const i = code.indexOf('openCatalog');
console.log('\nCurrent openCatalog query:');
console.log(code.substring(i + 20, i + 500));
