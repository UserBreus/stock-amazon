async function findDuplicates() {
    console.log('Searching for duplicates in Stock_Variantes by SKU...');
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
            SELECT codigo_variante, COUNT(*) as count
            FROM Stock_Variantes
            WHERE codigo_variante IS NOT NULL AND codigo_variante <> ''
            GROUP BY codigo_variante
            HAVING COUNT(*) > 1
        `;
        const res = await executeQuery(query);
        if (res && res.length > 0) {
            console.log(`Found ${res.length} groups of duplicate SKUs:`);
            console.table(res);
        } else {
            console.log('No duplicate SKUs found.');
        }
    } catch (e) {
        console.error('Error finding duplicates:', e);
    }
}

findDuplicates();
