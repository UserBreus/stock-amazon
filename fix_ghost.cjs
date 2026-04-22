async function run() {
    try {
        const query = `
           BEGIN TRY
               BEGIN TRANSACTION;
               -- Restore the 5 units to the original Etiqueta 1
               UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual + 5 WHERE id = 1;
               
               -- Move the ghost target Etiqueta 1457 to 0 and inactive
               UPDATE Stock_Etiquetas SET cantidad_actual = 0, estado = 'inactivo' WHERE id = 1457;

               -- Delete the ghost movements
               DELETE FROM Stock_Movimientos WHERE remito_id = 1;
               
               -- Delete the Ghost Remito Items (None exist, but just in case)
               DELETE FROM wms_remitos_internos_items WHERE remito_id = 1;

               -- Delete the Ghost Remito
               DELETE FROM wms_remitos_internos WHERE id = 1;
               COMMIT TRANSACTION;
           END TRY
           BEGIN CATCH
               ROLLBACK TRANSACTION;
               THROW;
           END CATCH
        `;
        
        const r1 = await fetch('http://3.85.26.173:5005/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const json1 = await r1.json();
        console.log("Cleanup executed:", json1);
        
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
