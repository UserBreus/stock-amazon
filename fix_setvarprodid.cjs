const fs = require('fs');

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

c = c.replace(/setVarProdIdss/g, 'setVarProdIds');
c = c.replace(/setVarProdIds\(\'\)/g, 'setVarProdIds\(\[\]\)');

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Fixed setter typos');
