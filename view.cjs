const fs = require('fs');
let c = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const p = c.indexOf("activeTab === 'panel' && panelView === 'traslado'");
console.log(c.slice(p, p + 200));
