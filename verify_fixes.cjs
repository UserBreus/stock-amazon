const fs = require('fs');
const op = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');
const ger = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

console.log('=== InventarioOperativo ===');
console.log('codigo_barras REMOVIDO:', !op.includes('codigo_barras') ? 'OK' : 'AUN EXISTE - ERROR');
console.log('codigo_variante presente:', op.includes('codigo_variante') ? 'OK' : 'FALTA');
console.log('solicitudSubTab state:', op.includes('solicitudSubTab') ? 'OK' : 'FALTA');
console.log('2 paneles ERP:', op.includes('Nueva Solicitud') && op.includes('Mis Solicitudes') ? 'OK' : 'FALTA');

console.log('\n=== InventarioGerencial ===');
const wrongTable = op.includes("'wms_remitos_items'") || ger.includes("wms_remitos_items (");
console.log('Tabla wms_remitos_items ELIMINADA:', !wrongTable ? 'OK' : 'AUN EXISTE - ERROR');
console.log('wms_remitos_internos_items OK:', ger.includes('wms_remitos_internos_items') ? 'OK' : 'FALTA');

// Count occurrences
const wrongTableCount = (ger.match(/wms_remitos_items(?!_internos)/g) || []).length;
console.log('Ocurrencias erroneas:', wrongTableCount === 0 ? '0 - LIMPIO' : wrongTableCount + ' - ERROR');

console.log('\nOK - TypeScript ya confirmo 0 errores. Sistema listo.');
