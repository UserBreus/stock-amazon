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

async function executeSql(query) {
    const payload = JSON.stringify({ query });
    const res = await fetch('http://3.85.26.173:5005/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.data;
}

async function runBatch() {
    let queries = [];

    const categorias = [...new Set(products.map(p => p.categoria))];
    categorias.forEach(cat => {
        queries.push(`IF NOT EXISTS (SELECT 1 FROM Stock_Categorias WHERE nombre='${cat}') INSERT INTO Stock_Categorias (nombre) VALUES ('${cat}')`);
    });

    products.forEach(p => {
        const skuBlock = p.nombre.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
        const randBarcode = 'LOTE-' + Math.floor(Math.random()*100000) + '-' + Math.floor(Math.random()*1000);
        
        let query = `
        DECLARE @cat_id INT;
        SELECT @cat_id = id FROM Stock_Categorias WHERE nombre = '${p.categoria}';
        IF NOT EXISTS (SELECT 1 FROM Stock_Productos WHERE nombre='${p.nombre}' AND categoria_id=@cat_id)
        BEGIN
            DECLARE @prod_id UNIQUEIDENTIFIER = NEWID();
            INSERT INTO Stock_Productos (id, nombre, costo, moneda, unidad, categoria_id, sku)
            VALUES (@prod_id, '${p.nombre}', 0, 'USD', 'ud', @cat_id, '${skuBlock}');
            
            ${p.cantidad > 0 ? `
            DECLARE @dep_id INT;
            SELECT TOP 1 @dep_id = id FROM Stock_Depositos WHERE tipo='general';
            INSERT INTO Stock_Etiquetas (producto_id, deposito_id, codigo_barras, cantidad_inicial, cantidad_actual, estado)
            VALUES (@prod_id, @dep_id, '${randBarcode}', ${p.cantidad}, ${p.cantidad}, 'activo');
            ` : ''}
        END
        `;
        queries.push(query);
    });

    for(let query of queries) {
        try {
            await executeSql(query);
        } catch(e) {
            console.error(e);
        }
    }
    console.log("Database Sync to AWS Completed via sequentially statements.");
}

runBatch();
