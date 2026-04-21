import fs from 'fs';

const data = JSON.parse(fs.readFileSync('pdf_data_new.json', 'utf8'));

let currentCategoria = '';
let products = [];

data.Pages.forEach((page, pageIndex) => {
    const lines = [];
    page.Texts.forEach(t => {
        let text = decodeURIComponent(t.R[0].T).trim();
        if (!text) return;

        let y = Math.round(t.y * 10);
        let added = false;
        for (let l of lines) {
            if (Math.abs(l.y - y) <= 2) {
                l.texts.push({ x: t.x, text });
                added = true;
                break;
            }
        }
        if (!added) {
            lines.push({ y, texts: [{ x: t.x, text }] });
        }
    });

    lines.sort((a, b) => a.y - b.y).forEach(line => {
        line.texts.sort((a, b) => a.x - b.x);
        let fullText = line.texts.map(t => t.text).join(' ').trim();
        
        if (fullText.includes('---')) return;
        if (fullText.includes('INVENTARIO USER') || fullText.includes('STOCK Marzo 2026')) return;
        if (fullText.toLowerCase() === 'producto' || fullText.toLowerCase() === 'cantidad') return; // headers if any

        const catMatch = fullText.match(/\*\*([^*]+)\*\*/);
        if (catMatch) {
            currentCategoria = catMatch[1].trim();
            // a veces trae un stock 0 pegado o basura al final, ignoramos lo demas
            return;
        }
        
        if (!currentCategoria) return;

        let nombre = '';
        let cantidad = 0;

        if (line.texts.length >= 2) {
            nombre = line.texts.slice(0, -1).map(t => t.text).join(' ').trim();
            let last = line.texts[line.texts.length - 1].text.replace(/\s/g, '');
            if (/^-?\d+$/.test(last)) {    // handles negative numbers or pure digits just in case
                cantidad = parseInt(last, 10);
            } else {
                nombre += ' ' + last;
                cantidad = 0;
            }
        } else if (line.texts.length === 1) {
            // RegEx to separate text and leading numbers.
            const match = line.texts[0].text.match(/^(.*?)\s*(\d+)$/);
            if (match) {
                nombre = match[1].trim();
                cantidad = parseInt(match[2], 10);
            } else {
                nombre = line.texts[0].text.trim();
                cantidad = 0;
            }
        }

        if (nombre && !nombre.startsWith('**')) { // En caso de lineas basura
           if(nombre.length > 2) {
             products.push({
                nombre: nombre,
                categoria: currentCategoria,
                cantidad
             });
           }
        }
    });
});

console.log(`Total Extraidos: ${products.length} productos.\n`);

const demostracion = products.slice(0, 10).map(p => `Categoría: [ ${p.categoria} ] | Producto: ${p.nombre} | Cantidad: ${p.cantidad}`).join('\n');
console.log(demostracion);
