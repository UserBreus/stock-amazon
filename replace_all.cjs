const fs = require('fs');

let s = fs.readFileSync('src/pages/Ingresos.tsx', 'utf8');

const t2 = fs.readFileSync('content.txt', 'utf8');
const t3 = fs.readFileSync('modal.txt', 'utf8');

const start1 = s.indexOf('{/* Cabecera Tipo Invoice - COLLAPSIBLE */}');
const start2 = s.indexOf('{/* Cabecera Tipo Invoice */}');
const start = start1 > -1 ? start1 : start2;

const end = s.indexOf('      {/* Modals Globales del Formulario */}');

if (start > -1 && end > start) {
    s = s.substring(0, start) + t2 + t3 + s.substring(end + '      {/* Modals Globales del Formulario */}'.length);
    fs.writeFileSync('src/pages/Ingresos.tsx', s);
    console.log('REPLACED SUCCESS');
} else {
    console.log('NOT FOUND', start, end);
}
