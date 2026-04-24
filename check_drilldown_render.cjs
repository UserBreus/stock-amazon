const fs = require('fs');
const code = fs.readFileSync('src/components/ui/CategoryDrillDownModal.tsx', 'utf8');

// See full item card rendering (first 1500 chars from map start)
const itemCard = code.indexOf('map((item');
console.log(code.substring(itemCard, itemCard + 1500));

// Also find how flatItems / treeItems are built from the props
const flatIdx = code.indexOf('flat');
console.log('\n---FLAT DATA BUILD---');
console.log(code.substring(flatIdx - 50, flatIdx + 400));

// Find what fields are used from the productos prop
const prodIdx = code.indexOf('productos');
console.log('\n---PRODUCTOS USAGE---');
let pos = prodIdx;
for (let i = 0; i < 8; i++) {
  const next = code.indexOf('productos', pos + 1);
  if (next === -1) break;
  console.log('  at', next, ':', JSON.stringify(code.substring(next - 10, next + 80)));
  pos = next;
}
