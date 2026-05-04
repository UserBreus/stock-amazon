async function executeDirectQuery(query) {
    const response = await fetch('http://3.85.26.173:5005/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const json = await response.json();
    return json.data || [];
}

async function run() {
    try {
        console.log('--- REPORTE DE STOCK: ARTICULO "PRUEBA" (VARIACIONES Y ETIQUETAS) ---');
        
        // 1. Buscar TODAS las variantes que tengan "prueba" en su nombre
        const variantes = await executeDirectQuery(\`
            SELECT 
                v.id, 
                v.nombre_variante, 
                v.producto_maestro_id,
                p.nombre as maestro_nombre
            FROM Stock_Variantes v
            INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
            WHERE v.nombre_variante LIKE '%prueba%' OR p.nombre LIKE '%prueba%'
        \`);
        
        if (variantes.length === 0) {
            console.log('No se encontraron variantes.');
            return;
        }

        console.log('Total de variantes encontradas:', variantes.length);

        for (const v of variantes) {
            // 2. Buscar stock actual (etiquetas activas) para cada variante encontrada
            const stock = await executeDirectQuery("SELECT SUM(cantidad_actual) as total FROM Stock_Etiquetas WHERE variante_id = " + v.id + " AND estado = 'activo' AND cantidad_actual > 0");
            const cant = stock[0]?.total || 0;

            console.log('-----------------------------------------');
            console.log('ID: ' + v.id);
            console.log('Maestro: ' + v.maestro_nombre);
            console.log('Variante: ' + (v.nombre_variante || 'Sin Nombre'));
            console.log('STOCK ACTUAL: ' + cant);

            if (cant > 0) {
                // Ver dónde está ese stock
                const detalles = await executeDirectQuery("SELECT d.nombre as deposito, SUM(e.cantidad_actual) as cantidad FROM Stock_Etiquetas e INNER JOIN Stock_Depositos d ON e.deposito_id = d.id WHERE e.variante_id = " + v.id + " AND e.estado = 'activo' GROUP BY d.nombre");
                detalles.forEach(d => console.log('   -> En ' + d.deposito + ': ' + d.cantidad));
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
