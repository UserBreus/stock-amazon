const fs = require('fs');
const code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');
// Check enviarSolicitud uses item.var_id
const i = code.indexOf('var_id}, ${item.cantidad}');
const j = code.indexOf('item.var_id');
console.log('item.var_id at:', j, code.substring(j-30, j+60));
// Check the full onSelect handler in the CategoryDrillDownModal JSX
const k = code.indexOf('onSelect={(varId');
console.log('\nonSelect handler:');
console.log(code.substring(k, k+400));
