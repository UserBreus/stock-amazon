async function run() {
    try {
        const query = `
          SELECT TOP 20 ri.id as remito_id, ri.numeracion, ri.estado as remito_estado, 
                 rii.id as item_id, rii.cantidad_enviada, rii.cantidad_recibida, rii.estado as item_estado
          FROM wms_remitos_internos ri
          JOIN wms_remitos_internos_items rii ON ri.id = rii.remito_id
          WHERE ri.estado IN ('RECIBIDO', 'CANCELADO', 'EN_TRANSITO')
          ORDER BY ri.fecha_creacion DESC
        `;
        
        const r1 = await fetch('http://3.85.26.173:5005/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const json1 = await r1.json();
        const d = json1.data || [];
        
        console.table(d);
        
        const zeros = d.filter(r => r.cantidad_recibida === 0 && (r.remito_estado === 'RECIBIDO' || r.remito_estado === 'CANCELADO' || r.remito_estado === 'EN_TRANSITO'));
        if (zeros.length > 0) {
            console.log('Zeros found:', zeros.length);
            const uniqueRemitos = [...new Set(zeros.map(z => z.remito_id))];
            
            let batchQuery = '';
            for (const rId of uniqueRemitos) {
                batchQuery += `
                   UPDATE wms_remitos_internos SET estado = 'EN_TRANSITO' WHERE id = ${rId};
                   UPDATE wms_remitos_internos_items SET estado = 'PENDIENTE', cantidad_recibida = 0.00 WHERE remito_id = ${rId} AND (cantidad_recibida = 0 OR cantidad_recibida IS NULL);
                `;
            }
            
            console.log("Running batch query:", batchQuery);
            const r2 = await fetch('http://3.85.26.173:5005/sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `BEGIN TRY BEGIN TRANSACTION; ${batchQuery} COMMIT TRANSACTION; END TRY BEGIN CATCH ROLLBACK TRANSACTION; THROW; END CATCH` })
            });
            const d2 = await r2.json();
            console.log('Fixed:', d2);
        } else {
            console.log('No 0-qty items found in top 20.');
        }
    } catch(e) {
        console.error("Error communicating with DB Proxy:", e.message);
    }
}
run();
