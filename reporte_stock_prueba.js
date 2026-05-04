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
        console.log('--- REPORTE DE STOCK: ARTICULO MAESTRO "PRUEBA" ---');
        
        // 1. Buscar el producto maestro "PRUEBA"
        const maestros = await executeDirectQuery("SELECT id, nombre FROM Stock_Productos_Maestros WHERE nombre LIKE '%prueba%'");
        
        if (maestros.length === 0) {
            console.log('No se encontró ningún Producto Maestro con ese nombre.');
            return;
        }

        for (const m of maestros) {
            console.log('\n=========================================');
            console.log('MAESTRO: ' + m.nombre + ' (ID: ' + m.id + ')');
            console.log('=========================================');

            // 2. Buscar sus variantes y su stock actual
            const variantes = await executeDirectQuery(`
                SELECT 
                    v.id, 
                    v.nombre_variante,
                    v.sku,
                    ISNULL((SELECT SUM(cantidad_actual) FROM Stock_Etiquetas WHERE variante_id = v.id AND estado = 'activo'), 0) as stock_total
                FROM Stock_Variantes v
                WHERE v.producto_maestro_id = ${m.id}
            `);

            if (variantes.length === 0) {
                console.log('Este maestro no tiene variantes configuradas.');
            } else {
                let totalMaestro = 0;
                variantes.forEach(v => {
                    console.log(' - Variante: ' + (v.nombre_variante || 'Única') + ' | SKU: ' + (v.sku || '-') + ' | STOCK: ' + v.stock_total);
                    totalMaestro += v.stock_total;
                });
                console.log('-----------------------------------------');
                console.log('TOTAL EN STOCK PARA ESTE MAESTRO: ' + totalMaestro);
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
