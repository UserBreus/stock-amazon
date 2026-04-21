import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// Add settimeout to window print
const target1 = `       setPrintProduct({ producto_nombre: 'Lote de Orden ' + selectedCompraId.split('-')[0] });
       setPrintEtiquetas(etiquetasToPrint);

       fetchData();`;

const replacement1 = `       setPrintProduct({ producto_nombre: 'Lote de OC-' + selectedCompraId.split('-')[0].toUpperCase(), nombre_completo: 'Códigos Pre-impresos para WMS' });
       setPrintEtiquetas(etiquetasToPrint);

       setTimeout(() => {
           window.print();
       }, 500);

       fetchData();`;

txt = txt.replace(target1, replacement1);

// Rename button
const target2 = `Emitir Calcomanías WMS</button>`;
const replacement2 = `Generar Etiquetas y Ver QRs</button>`;
txt = txt.replace(target2, replacement2);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial.tsx printing fixed!");
