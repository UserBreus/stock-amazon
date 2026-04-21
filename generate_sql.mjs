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
        if (fullText.toLowerCase() === 'producto' || fullText.toLowerCase() === 'cantidad') return;

        const catMatch = fullText.match(/\*\*([^*]+)\*\*/);
        if (catMatch) {
            currentCategoria = catMatch[1].trim();
            return;
        }

        if (!currentCategoria) return;

        let nombre = '';
        let cantidad = 0;

        if (line.texts.length >= 2) {
            nombre = line.texts.slice(0, -1).map(t => t.text).join(' ').trim();
            let last = line.texts[line.texts.length - 1].text.replace(/\s/g, '');
            if (/^-?\d+$/.test(last)) {    
                cantidad = parseInt(last, 10);
            } else {
                nombre += ' ' + last;
                cantidad = 0;
            }
        } else if (line.texts.length === 1) {
            const match = line.texts[0].text.match(/^(.*?)\s*(\d+)$/);
            if (match) {
                nombre = match[1].trim();
                cantidad = parseInt(match[2], 10);
            } else {
                nombre = line.texts[0].text.trim();
                cantidad = 0;
            }
        }

        if (nombre && !nombre.startsWith('**')) { 
           if(nombre.length > 2) {
             products.push({
                nombre: nombre.replace(/'/g, "''"),
                categoria: currentCategoria.replace(/'/g, "''"),
                cantidad
             });
           }
        }
    });
});

console.log(`Parsed ${products.length} products.`);

let sql = `-- VACIADADO DE BASE DE DATOS
TRUNCATE TABLE movimientos CASCADE;
TRUNCATE TABLE etiquetas CASCADE;
TRUNCATE TABLE productos CASCADE;
TRUNCATE TABLE tipos_producto CASCADE;

`;

const categorias = [...new Set(products.map(p => p.categoria))];
sql += `-- INSERTAR CATEGORIAS\n`;
categorias.forEach(cat => {
    sql += `INSERT INTO tipos_producto (nombre) VALUES ('${cat}');\n`;
});
sql += '\n';

sql += `-- INSERTAR PRODUCTOS Y ETIQUETAS\n`;
products.forEach(p => {
    sql += `WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    '${p.nombre}', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('${p.nombre}', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = '${p.categoria}'
  RETURNING id
)
`;
    if (p.cantidad > 0) {
        sql += `INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), ${p.cantidad}, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;\n\n`;
    } else {
        sql += `SELECT 1; -- No stock para ${p.nombre}\n\n`;
    }
});

fs.writeFileSync('migracion_inventario.sql', sql);
console.log('migracion_inventario.sql generated.');
