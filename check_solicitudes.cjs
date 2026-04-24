const fs = require('fs');
const txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');
txt.split('\n').forEach((l, i) => {
   if (l.includes("panelView === 'solicitudes'")) console.log(i, l);
});
