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
    console.log("Fetching ALL maestros...");
    const dt = await executeQuery("SELECT p.id, p.sku, p.nombre, c.nombre as cat_nombre FROM Stock_Productos_Maestros p LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id ORDER BY p.id ASC");
    if(!dt.success || !dt.data) {
        console.error("Failed to fetch", dt);
        return;
    }
    
    const baseCounter = {};

    for(const row of dt.data) {
        let catPrefix = row.cat_nombre ? row.cat_nombre.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : 'GEN';
        if (catPrefix.length === 0) catPrefix = 'GEN';

        let nomPrefix = row.nombre.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (nomPrefix.length === 0) nomPrefix = 'ART';

        const baseSKU = `${catPrefix}-${nomPrefix}`;

        if(!baseCounter[baseSKU]) baseCounter[baseSKU] = 0;
        baseCounter[baseSKU]++;

        const newSku = `${baseSKU}-${baseCounter[baseSKU]}`;

        if (row.sku !== newSku) {
            console.log(`Updating Master: ${row.sku} -> ${newSku}`);
            await executeQuery(`UPDATE Stock_Productos_Maestros SET sku='${newSku}' WHERE id=${row.id}`);
            
            // update variations
            const vdt = await executeQuery(`SELECT id, codigo_variante FROM Stock_Variantes WHERE producto_maestro_id=${row.id}`);
            if (vdt.success && vdt.data) {
                for(const v of vdt.data) {
                    if (v.codigo_variante && row.sku) {
                        let newVsku = v.codigo_variante;
                        
                        if (v.codigo_variante.includes(row.sku)) {
                            newVsku = v.codigo_variante.replace(row.sku, newSku);
                        } else {
                            // If for some reason the variation SKU didn't contain the master SKU at all (e.g. they were random standalone), we force prefix it
                            newVsku = `${newSku}-${v.codigo_variante.substring(0, 20)}`; 
                        }

                        if (newVsku !== v.codigo_variante) {
                            console.log(`  Updating variant ${v.codigo_variante} -> ${newVsku}`);
                            // Escape single quotes if any
                            await executeQuery(`UPDATE Stock_Variantes SET codigo_variante='${newVsku.replace(/'/g, "''")}' WHERE id=${v.id}`);
                        }
                    }
                }
            }
        }
    }
    console.log("All done!");
}

run().catch(console.error);
