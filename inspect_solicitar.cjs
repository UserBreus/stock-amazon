const fs = require('fs');
const code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

// find tab content for solicitar
const j = code.indexOf("activeTab === 'solicitar'");
if(j !== -1) {
  console.log(code.substring(j - 20, j + 3000));
} else {
  console.log('solicitar tab content not found - searching for solicitudCart');
  const k = code.indexOf('solicitudCart');
  console.log(code.substring(k - 100, k + 1000));
}
