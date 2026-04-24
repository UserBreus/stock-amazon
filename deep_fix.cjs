const fs = require('fs');

// Fix InventarioOperativo - codigo_barras still somewhere
let op = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');
const idx1 = op.indexOf('codigo_barras');
if (idx1 !== -1) {
  console.log('Found codigo_barras at:', idx1);
  console.log('Context:', JSON.stringify(op.substring(idx1 - 50, idx1 + 60)));
  op = op.replace(/codigo_barras/g, 'codigo_variante');
  fs.writeFileSync('src/pages/InventarioOperativo.tsx', op);
  console.log('Fixed InventarioOperativo');
}

// Fix InventarioGerencial - wms_remitos_items still
let ger = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');
// Find the wrong occurrence (not wms_remitos_internos_items)
const matches = [];
let pos = 0;
while (true) {
  const found = ger.indexOf('wms_remitos_items', pos);
  if (found === -1) break;
  const before = ger.substring(found - 10, found);
  if (!before.includes('internos_')) {
    matches.push({ pos: found, context: ger.substring(found - 30, found + 50) });
  }
  pos = found + 1;
}
console.log('\nwms_remitos_items occurrences (non-internos):', matches.length);
matches.forEach(m => console.log(' Context:', JSON.stringify(m.context)));

// Replace all wms_remitos_items that are NOT preceded by _internos
ger = ger.replace(/(?<!internos_)wms_remitos_items/g, 'wms_remitos_internos_items');
fs.writeFileSync('src/pages/InventarioGerencial.tsx', ger);
console.log('Fixed InventarioGerencial');
