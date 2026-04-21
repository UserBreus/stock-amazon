const fs = require('fs');
let txt = fs.readFileSync('src/pages/Ingresos.tsx', 'utf8');

// Simply add the closing bracket for the \`tipoIngreso !== 'importaciones' && (\` section right before </div>
txt = txt.replace(
  "      <ModalSelector isOpen={isVarianteModalOpen}",
  "      )}\\n      <ModalSelector isOpen={isVarianteModalOpen}"
);

fs.writeFileSync('src/pages/Ingresos.tsx', txt);
console.log("Fixed!");
