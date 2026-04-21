import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

if (!txt.includes("import { QRCodeSVG } from 'qrcode.react';")) {
    const importHook = "import React, { useEffect, useState } from 'react';";
    txt = txt.replace(importHook, importHook + "\nimport { QRCodeSVG } from 'qrcode.react';");
}

const previewTarget = `                 <img src={\`https://barcode.tec-it.com/barcode.ashx?data=\${et.codigo_barras}&code=QRCode\`} alt="Barcode QR" className="h-16 object-contain" />`;
const previewReplacement = `                 <QRCodeSVG value={et.codigo_barras} size={64} level="H" className="mx-auto" />`;

const printTarget = `              <img 
                src={\`https://barcode.tec-it.com/barcode.ashx?data=\${lbl.codigo_barras}&code=QRCode\`} 
                alt={lbl.codigo_barras} 
                className="w-48 h-48 object-contain my-4"
              />`;
const printReplacement = `              <div className="my-4 display-flex justify-center items-center">
                 <QRCodeSVG value={lbl.codigo_barras} size={180} level="H" />
              </div>`;

txt = txt.replace(previewTarget, previewReplacement);
txt = txt.replace(printTarget, printReplacement);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("QR Code SVG generation perfectly native!");
