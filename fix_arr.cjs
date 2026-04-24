const fs = require('fs');
let s = fs.readFileSync('src/pages/Ingresos.tsx', 'utf8');

const regex = /executeAWSQuery\("SELECT \* FROM Stock_Productos_Maestros ORDER BY nombre"\)\s+\]\);/ms;
s = s.replace(regex, 'executeAWSQuery("SELECT * FROM Stock_Productos_Maestros ORDER BY nombre"),\n        executeAWSQuery("SELECT * FROM Stock_Monedas ORDER BY id")\n      ]);');

fs.writeFileSync('src/pages/Ingresos.tsx', s);
console.log('Fixed');
