const fetch = globalThis.fetch;

async function executeSql(query) {
    const res = await fetch('http://3.85.26.173:5005/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const json = await res.json();
    if(json.error) throw new Error(json.error);
    return json.data;
}

async function clean() {
    try {
        console.log("Iniciando purga de compras y etiquetas relacionadas...");
        
        await executeSql(`
            -- 1. Eliminar movimientos ligados a las etiquetas de compras
            DELETE FROM Stock_Movimientos 
            WHERE referencia_compra_id IS NOT NULL 
               OR etiqueta_id IN (SELECT id FROM Stock_Etiquetas WHERE compra_id IS NOT NULL);

            -- 2. Eliminar etiquetas pre-minted y activas atadas a compras
            DELETE FROM Stock_Etiquetas WHERE compra_id IS NOT NULL;

            -- 3. Eliminar costos extra
            IF OBJECT_ID('Stock_Compras_Costos_Extra', 'U') IS NOT NULL 
                DELETE FROM Stock_Compras_Costos_Extra;

            -- 4. Eliminar lineas de compras
            DELETE FROM Stock_Compras_Detalle;

            -- 5. Eliminar cabeceras de compras
            DELETE FROM Stock_Compras;
        `);

        console.log("¡Todo limpio! Se han purgado las compras y el stock asociado.");
    } catch (e) {
        console.error("Error limpiando BD:", e.message);
    }
}

clean();
