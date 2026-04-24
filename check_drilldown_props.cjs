const fs = require('fs');
const code = fs.readFileSync('src/components/ui/CategoryDrillDownModal.tsx', 'utf8');
// Find onSelect call
const i = code.indexOf('onSelect(');
console.log('onSelect called at:', i);
console.log(code.substring(i - 100, i + 200));
