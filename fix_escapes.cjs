const fs = require('fs'); 
const file = 'src/pages/InventarioGerencial.tsx'; 
let content = fs.readFileSync(file, 'utf8'); 
content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$'); 
fs.writeFileSync(file, content);
console.log('Fixed escape characters in InventarioGerencial.tsx');
