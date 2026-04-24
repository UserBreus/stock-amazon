const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');
const i = code.indexOf("setActiveTab('recepcion'");
console.log('Found at:', i);
console.log(JSON.stringify(code.substring(i-150, i+80)));

// Do the fix
code = code.replace(
  `          setSolicitudCart([]);\r\n          setActiveTab('recepcion' as any);`,
  `          setSolicitudCart([]);\r\n          setSolicitudSubTab('historial');\r\n          fetchDataRelacional();`
);
fs.writeFileSync('src/pages/InventarioOperativo.tsx', code);
console.log('Fixed!');
