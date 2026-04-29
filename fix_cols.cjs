const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const startIdx = c.indexOf('className="grid grid-cols-2');
const endIdx = c.indexOf('</motion.div>', startIdx);
let gridBlock = c.substring(startIdx, endIdx);

const colors = ['blue', 'red', 'purple', 'emerald', 'orange', 'cyan', 'pink', 'rose', 'green', 'amber'];

colors.forEach(col => {
    gridBlock = gridBlock.replace(new RegExp('hover:border-' + col + '-300', 'g'), 'hover:border-indigo-300');
    gridBlock = gridBlock.replace(new RegExp('dark:hover:border-' + col + '-900', 'g'), 'dark:hover:border-indigo-900');
    gridBlock = gridBlock.replace(new RegExp('bg-' + col + '-50', 'g'), 'bg-indigo-50');
    gridBlock = gridBlock.replace(new RegExp('bg-' + col + '-900\\\\/30', 'g'), 'bg-indigo-900/30');
    gridBlock = gridBlock.replace(new RegExp('text-' + col + '-600', 'g'), 'text-indigo-600');
    gridBlock = gridBlock.replace(new RegExp('text-' + col + '-400', 'g'), 'text-indigo-400');
});

c = c.substring(0, startIdx) + gridBlock + c.substring(endIdx);
fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Fixed colors');
