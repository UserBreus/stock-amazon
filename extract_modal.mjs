import fs from 'fs';

const txt = fs.readFileSync('original.tsx', 'utf8');
const mStart = txt.indexOf('title="Generar Etiquetas WMS (De Orden)');
const start = txt.lastIndexOf('<Modal', mStart);
const end = txt.indexOf('</Modal>', start) + 8;
console.log(txt.substring(start, end));
