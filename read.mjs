import fs from 'fs';
const txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');
const searchStr = 'title="Generar Etiquetas de Orden de Compra"';
const i = txt.indexOf(searchStr);
console.log(txt.substring(i - 200, i + 1500));
