async function executeDirectQuery(query) {
    const response = await fetch('http://3.85.26.173:5005/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const json = await response.json();
    return json.data;
}

async function run() {
    const prodRes = await executeDirectQuery(`
        SELECT 
            v.id, 
            v.nombre_variante, 
            p.categoria_id, 
            p.id as producto_maestro_id,
            p.nombre as producto_nombre
        FROM Stock_Variantes v
        INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
    `);
    
    if (prodRes) {
        const mapped = prodRes.map((p) => ({
            ...p,
            id: p.id.toString(),
            nombre: p.nombre_variante ? `${p.producto_nombre} (${p.nombre_variante})` : p.producto_nombre,
            producto_maestro_id: p.producto_maestro_id.toString(),
            categoria_id: p.categoria_id ? p.categoria_id.toString() : null
        }));
        console.log(mapped.slice(0, 3));
    }
}
run();
