const fs = require('fs');
const code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');
console.log('Total lines:', code.split('\n').length);
// Check tabs
const tabIdx = code.indexOf("activeTab ===");
console.log('\nTab rendering area:');
console.log(code.substring(tabIdx, tabIdx + 500));
