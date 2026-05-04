async function executeDirectQuery(query) {
    const response = await fetch('http://3.85.26.173:5005/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const json = await response.json();
    return json;
}

async function run() {
    let r1 = await executeDirectQuery(`
        SELECT 
            v.id, 
            v.nombre_variante, 
            p.categoria_id, 
            p.id as producto_maestro_id,
            p.nombre as producto_nombre
        FROM Stock_Variantes v
        INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
    `);
    console.log('Query 1:', r1.success, r1.error);
    
    let r2 = await executeDirectQuery(`
        SELECT 
            v.id, 
            v.nombre_variante, 
            v.cantidad_alerta, 
            v.cantidad_critica,
            c.nombre as categoria_nombre
        FROM Stock_Variantes v
        INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
        LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
        WHERE v.cantidad_alerta > 0 OR v.cantidad_critica > 0
        ORDER BY c.nombre, v.nombre_variante
    `);
    console.log('Query 2:', r2.success, r2.error);
}

run();
