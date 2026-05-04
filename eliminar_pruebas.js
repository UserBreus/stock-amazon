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
        console.log('--- INICIANDO ELIMINACION DE ARTICULOS "PRUEBA" ---');

        // 1. Obtener IDs de Maestros
        const maestros = await executeDirectQuery("SELECT id FROM Stock_Productos_Maestros WHERE nombre LIKE '%prueba%'");
        if (maestros.length === 0) {
            console.log('No se encontraron maestros con ese nombre.');
            return;
        }
        const mIds = maestros.map(m => m.id).join(',');
        console.log('Maestros a eliminar: ' + mIds);

        // 2. Obtener IDs de Variantes asociadas
        const variantes = await executeDirectQuery("SELECT id FROM Stock_Variantes WHERE producto_maestro_id IN (" + mIds + ")");
        const vIds = variantes.map(v => v.id).join(',');
        
        if (vIds) {
            console.log('Variantes a eliminar: ' + vIds);

            // 3. Eliminar Movimientos (Stock_Movimientos) a través de Etiquetas
            console.log('Eliminando movimientos asociados...');
            await executeDirectQuery("DELETE FROM Stock_Movimientos WHERE etiqueta_id IN (SELECT id FROM Stock_Etiquetas WHERE variante_id IN (" + vIds + "))");

            // 4. Eliminar Etiquetas (Stock_Etiquetas)
            console.log('Eliminando etiquetas (stock físico)...');
            await executeDirectQuery("DELETE FROM Stock_Etiquetas WHERE variante_id IN (" + vIds + ")");

            // 5. Eliminar Registros en Históricos
            console.log('Eliminando registros históricos...');
            await executeDirectQuery("DELETE FROM Stock_Consumo_Historico WHERE variante_id IN (" + vIds + ")");

            // 6. Eliminar Variantes
            console.log('Eliminando variantes...');
            await executeDirectQuery("DELETE FROM Stock_Variantes WHERE id IN (" + vIds + ")");
        }

        // 7. Eliminar Maestros
        console.log('Eliminando maestros...');
        await executeDirectQuery("DELETE FROM Stock_Productos_Maestros WHERE id IN (" + mIds + ")");

        console.log('\n¡ELIMINACION COMPLETADA CON EXITO!');
    } catch (e) {
        console.error('Error durante la eliminación:', e.message);
    }
}

run();
