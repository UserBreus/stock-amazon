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
        console.log('--- REPORTE DE STOCK: ARTICULO "PRUEBA" ---');
        
        // 1. Buscar TODAS las variantes que tengan "prueba" en su nombre o en su maestro
        const sql = "SELECT v.id, v.nombre_variante, v.producto_maestro_id, p.nombre as maestro_nombre FROM Stock_Variantes v INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id WHERE v.nombre_variante LIKE '%prueba%' OR p.nombre LIKE '%prueba%'";
        const variantes = await executeDirectQuery(sql);
        
        if (variantes.length === 0) {
            console.log('No se encontraron variantes.');
            return;
        }

        console.log('Total de variantes analizadas:', variantes.length);

        for (const v of variantes) {
            const sqlStock = "SELECT SUM(cantidad_actual) as total FROM Stock_Etiquetas WHERE variante_id = " + v.id + " AND estado = 'activo' AND cantidad_actual > 0";
            const stock = await executeDirectQuery(sqlStock);
            const cant = stock[0]?.total || 0;

            if (cant > 0) {
                console.log('-----------------------------------------');
                console.log('ID VARIANTE: ' + v.id);
                console.log('MAESTRO: ' + v.maestro_nombre);
                console.log('VARIANTE: ' + (v.nombre_variante || 'Única'));
                console.log('STOCK ACTUAL: ' + cant);

                const sqlDet = "SELECT d.nombre as deposito, SUM(e.cantidad_actual) as cantidad FROM Stock_Etiquetas e INNER JOIN Stock_Depositos d ON e.deposito_id = d.id WHERE e.variante_id = " + v.id + " AND e.estado = 'activo' GROUP BY d.nombre";
                const detalles = await executeDirectQuery(sqlDet);
                detalles.forEach(d => console.log('   -> Ubicación: ' + d.deposito + ' | Cant: ' + d.cantidad));
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
