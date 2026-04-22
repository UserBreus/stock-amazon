const fs = require('fs');
const file = 'src/components/DespachoEgresos.tsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/VALUES \('\$\{remitoCode\}', \$\{origenFijoSQL\}, \$\{destClean\}, '\$\{\(user as any\)\?\.id \|\| ''\}', 'EN_TRANSITO'\);/,
              "VALUES ('${remitoCode}', ${origenId}, ${destClean}, '${(user as any)?.id || ''}', 'EN_TRANSITO');");
fs.writeFileSync(file, c);
console.log('Fixed origenId scope');
