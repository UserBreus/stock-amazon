const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

c = c.replace(
  'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto py-8"',
  'className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-7xl mx-auto py-8"'
);

const startIdx = c.indexOf('className="grid grid-cols-2');
const endIdx = c.indexOf('</motion.div>', startIdx);
let gridBlock = c.substring(startIdx, endIdx);

gridBlock = gridBlock.replace(/p-8 rounded-3xl/g, 'p-4 rounded-2xl');
gridBlock = gridBlock.replace(/gap-6/g, 'gap-3');
gridBlock = gridBlock.replace(/w-8 h-8/g, 'w-5 h-5');
gridBlock = gridBlock.replace(/text-xl font-black/g, 'text-xs font-black');
gridBlock = gridBlock.replace(/text-xs leading-relaxed/g, 'text-[9px] leading-tight');
gridBlock = gridBlock.replace(/p-4 bg-/g, 'p-2.5 bg-');
gridBlock = gridBlock.replace(/rounded-2xl group-hover:scale-110/g, 'rounded-xl group-hover:scale-110');

c = c.substring(0, startIdx) + gridBlock + c.substring(endIdx);
fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Fixed buttons');
