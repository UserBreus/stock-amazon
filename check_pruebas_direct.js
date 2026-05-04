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
        const articulos = await executeDirectQuery("SELECT id, nombre_variante FROM Stock_Variantes WHERE nombre_variante LIKE '%prueba%'");
        console.log('--- RESULTADOS ---');
        console.log('Artículos de prueba encontrados:', articulos.length);
        
        if (articulos.length > 0) {
            const ids = articulos.map(a => a.id).join(',');
            const movs = await executeDirectQuery("SELECT m.tipo_movimiento, COUNT(*) as cantidad FROM Stock_Movimientos m INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id WHERE e.variante_id IN (" + ids + ") GROUP BY m.tipo_movimiento");
            console.log('Movimientos realizados con estos artículos:');
            movs.forEach(m => {
                console.log(' - ' + m.tipo_movimiento + ': ' + m.cantidad);
            });
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
