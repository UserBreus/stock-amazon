async function findDuplicates() {
    console.log('Searching for duplicates in Stock_Variantes...');
    const API_URL = "http://3.85.26.173:5005/sql";
    
    async function executeQuery(query) {
        const r = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        return await r.json();
    }

    try {
        const query = `
            SELECT producto_maestro_id, nombre_variante, COUNT(*) as count
            FROM Stock_Variantes
            GROUP BY producto_maestro_id, nombre_variante
            HAVING COUNT(*) > 1
        `;
        const res = await executeQuery(query);
        if (res && res.length > 0) {
            console.log(`Found ${res.length} groups of duplicates:`);
            console.table(res);
            
            for (const group of res) {
                const details = await executeQuery(`SELECT id, producto_maestro_id, nombre_variante, codigo_variante FROM Stock_Variantes WHERE producto_maestro_id = ${group.producto_maestro_id} AND nombre_variante = '${group.nombre_variante.replace(/'/g, "''")}'`);
                console.log(`\nGroup: Maestro ${group.producto_maestro_id}, Variant "${group.nombre_variante}"`);
                console.table(details);
            }
        } else {
            console.log('No duplicates found.');
        }
    } catch (e) {
        console.error('Error finding duplicates:', e);
    }
}

findDuplicates();
