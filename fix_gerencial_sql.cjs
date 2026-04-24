const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// Fix 1: wrong table name wms_remitos_items → wms_remitos_internos_items
// Fix 2: remove producto_nombre, nombre_variante from INSERT (not in table schema)
// Fix 3: use correct columns per DespachoEgresos: remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado

const oldInsert = `            await executeAWSQuery(\`
            INSERT INTO wms_remitos_items (remito_id, etiqueta_id, variante_id, cantidad_enviada, producto_nombre, nombre_variante)
            VALUES (\${remitoId}, \${etq.id}, \${item.variante_id}, \${toTake}, '\${(item.producto_nombre||'').replace(/'/g,"''")}', '\${(item.nombre_variante||'').replace(/'/g,"''")}');
          \`);`;

const newInsert = `            await executeAWSQuery(\`
            INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
            VALUES (\${remitoId}, \${item.variante_id}, \${toTake}, \${etq.id}, 'PENDIENTE');
          \`);`;

if (!code.includes('wms_remitos_items')) {
  console.log('String not found with exact match, trying loose...');
  // Try to find and fix just the table name
  code = code.replace(/wms_remitos_items/g, 'wms_remitos_internos_items');
  console.log('Fixed table name.');
} else {
  code = code.replace(oldInsert, newInsert);
  console.log('Fixed INSERT fully.');
}

// Also fix the removestock update to not set deposito_id=destino (origin etiqueta stays at origin, just estado changes)
// The handling in handleRecibirRemitoEntero creates new etiquetas at destination
// So we just need to mark origin etiqueta as 'trasladando' without changing deposito_id
code = code.replace(
  `            SET estado = 'trasladando', deposito_id = \${destino}`,
  `            SET estado = 'trasladando'`
);
console.log('Fixed etiqueta update (no deposito_id change).');

fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
console.log('Done! File size:', code.length);
