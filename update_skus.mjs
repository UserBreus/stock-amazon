import fs from 'fs';

const url = 'http://3.85.26.173:5005/sql';

async function executeQuery(query) {
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    return r.json();
}

async function run() {
    console.log("Fetching maestros...");
    const dt = await executeQuery("SELECT id, sku, nombre FROM Stock_Productos_Maestros");
    if(!dt.success || !dt.data) {
        console.error("Failed to fetch", dt);
        return;
    }
    
    // Process items. If it matches something like GEN-PANT-001, turn to GEN-PANT-1
    for(const row of dt.data) {
        if (!row.sku) continue;
        const pts = row.sku.split('-');
        if(pts.length === 3) {
            const numPart = pts[2];
            // Check if it's purely numeric and starts with 0
            if (/^0+[0-9]+$/.test(numPart)) {
                const newNum = parseInt(numPart, 10).toString();
                const newSku = `${pts[0]}-${pts[1]}-${newNum}`;
                console.log(`Updating ${row.sku} -> ${newSku}`);
                await executeQuery(`UPDATE Stock_Productos_Maestros SET sku='${newSku}' WHERE id=${row.id}`);
                
                // Extra check for variants!
                const vdt = await executeQuery(`SELECT id, codigo_variante FROM Stock_Variantes WHERE producto_maestro_id=${row.id}`);
                if (vdt.success && vdt.data) {
                    for(const v of vdt.data) {
                        if (v.codigo_variante && v.codigo_variante.startsWith(row.sku)) {
                            const newVsku = v.codigo_variante.replace(row.sku, newSku);
                            console.log(`  Updating variant ${v.codigo_variante} -> ${newVsku}`);
                            await executeQuery(`UPDATE Stock_Variantes SET codigo_variante='${newVsku}' WHERE id=${v.id}`);
                            
                            // Let's also magically update any Etiquetas (Stock_Etiquetas) just in case
                            // But usually Stock_Etiquetas uses variante_id. 
                        }
                    }
                }
            }
        }
    }
    console.log("Done");
}

run().catch(console.error);
