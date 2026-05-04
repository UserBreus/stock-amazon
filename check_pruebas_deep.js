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
        console.log('--- BUSQUEDA PROFUNDA DE PRUEBAS ---');
        
        // 1. Buscar en Variantes
        const variantes = await executeDirectQuery("SELECT id, nombre_variante FROM Stock_Variantes WHERE nombre_variante LIKE '%prueba%'");
        console.log('Variantes con "prueba":', variantes.length);
        variantes.forEach(v => console.log(' - ID ' + v.id + ': ' + v.nombre_variante));

        // 2. Buscar en Productos Maestros
        const maestros = await executeDirectQuery("SELECT id, nombre FROM Stock_Productos_Maestros WHERE nombre LIKE '%prueba%'");
        console.log('\nProductos Maestros con "prueba":', maestros.length);
        maestros.forEach(m => console.log(' - ID ' + m.id + ': ' + m.nombre));

        // 3. Buscar movimientos de TODAS las variantes de esos maestros
        let allVariantIds = variantes.map(v => v.id);
        if (maestros.length > 0) {
            const mIds = maestros.map(m => m.id).join(',');
            const varsOfMaestros = await executeDirectQuery("SELECT id FROM Stock_Variantes WHERE producto_maestro_id IN (" + mIds + ")");
            varsOfMaestros.forEach(v => {
                if (!allVariantIds.includes(v.id)) allVariantIds.push(v.id);
            });
        }

        if (allVariantIds.length > 0) {
            const idsStr = allVariantIds.join(',');
            console.log('\nAnalizando movimientos para ' + allVariantIds.length + ' IDs de variantes...');
            
            const movs = await executeDirectQuery("SELECT m.tipo_movimiento, COUNT(*) as cantidad FROM Stock_Movimientos m INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id WHERE e.variante_id IN (" + idsStr + ") GROUP BY m.tipo_movimiento");
            
            if (movs.length > 0) {
                console.log('Movimientos encontrados:');
                movs.forEach(m => console.log(' - ' + m.tipo_movimiento + ': ' + m.cantidad));
            } else {
                console.log('No se encontraron movimientos en Stock_Movimientos.');
            }

            // 4. Ver si hay stock actual (etiquetas) aunque no haya movimientos (raro pero posible)
            const etiquetas = await executeDirectQuery("SELECT SUM(cantidad_actual) as total FROM Stock_Etiquetas WHERE variante_id IN (" + idsStr + ") AND estado = 'activo'");
            console.log('Stock actual en etiquetas: ' + (etiquetas[0]?.total || 0));
        }

        // 5. Buscar en la tabla de HISTORICOS por si acaso
        const historicos = await executeDirectQuery("SELECT COUNT(*) as cantidad FROM Stock_Consumo_Historico h WHERE h.variante_id IN (SELECT id FROM Stock_Variantes WHERE nombre_variante LIKE '%prueba%')");
        console.log('Registros en Consumo_Historico: ' + (historicos[0]?.cantidad || 0));

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
