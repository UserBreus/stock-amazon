const fs = require('fs');

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

c = c.replace(/varProdIdss/g, 'varProdIds');
c = c.replace(/setVarProdId/g, 'setVarProdIds');

// fix p.id.toString() === varProdIds -> p.id.toString() === varProdIds[0]
c = c.replace(/productos\.find\(p => p\.id\.toString\(\) === varProdIds\)/g, 'productos.find(p => p.id.toString() === varProdIds[0])');

// fix the leftover modal prop
c = c.replace(/onSelect={setVarProdIds}/, `onSelect={() => {}}`); // because we use onSelectMultiple now

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Fixed typos');
