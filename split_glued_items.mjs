import fs from 'fs';

// Delete the old confusing file so the user only looks at the correct one
if (fs.existsSync('pre_carga_variantes_arreglado.csv')) {
    fs.unlinkSync('pre_carga_variantes_arreglado.csv');
}

let content = fs.readFileSync('pre_carga_variantes.csv', 'utf8').split('\n');
let pcf = fs.readFileSync('productos_a_cargar_final.csv', 'utf8').split('\n');

// 1. Separate the massive line
const massiveStringRegex = /Estructuras Roll Up Fuerte(?:\s|cm|80X200)*Estructuras Roll Up/i;
let fixedLines = [];

for (const line of content) {
    if (!line.trim()) continue;
    
    if (massiveStringRegex.test(line)) {
        // Explode it into the hidden elements
        fixedLines.push(`"ARTICULOS","Estructuras Roll Up Fuerte","Estructuras Roll Up Fuerte","80X200","","","","",""`);
        fixedLines.push(`"ARTICULOS","Estructuras Roll Up comun de aluminio","Estructuras Roll Up comun de aluminio","80X200","","","","",""`);
        fixedLines.push(`"ARTICULOS","Backing Pop Up (Soporte para Tela)","Backing Pop Up (Soporte para Tela)","","","","","",""`);
        fixedLines.push(`"ARTICULOS","Palo de Bandera para Auto","Palo de Bandera para Auto","","","","","",""`);
        fixedLines.push(`"ARTICULOS","CAJAS","CAJAS","","","","","",""`);
        fixedLines.push(`"ARTICULOS","Auriculares","Auriculares","","","","","",""`);
        fixedLines.push(`"ARTICULOS","Gorras de invierno","Gorras de invierno","","","","","",""`);
    } else {
        fixedLines.push(line);
    }
}

// Ensure "Nombre Variante PDF" (which is now completely identical to base name per rules) isn't causing confusion. 
// Just write it out.
fs.writeFileSync('pre_carga_variantes.csv', fixedLines.join('\n'));
console.log("Archivo re-escrito y separado el glitched string múltiple.");
