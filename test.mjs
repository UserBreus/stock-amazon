import fs from 'fs';
const txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');
const i = txt.indexOf('title="Imprimir Etiquetas"');
if(i >= 0) {
   console.log(txt.substring(i, i + 1500));
} else {
   console.log("NOT FOUND");
}
