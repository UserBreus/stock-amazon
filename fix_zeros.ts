import { executeAWSQuery } from './src/lib/aws-client';

async function fix() {
    try {
        const res = await executeAWSQuery(`
            SELECT TOP 20 ri.id as remito_id, ri.numeracion, ri.estado as remito_estado, 
                   rii.id as item_id, rii.cantidad_enviada, rii.cantidad_recibida, rii.estado as item_estado
            FROM wms_remitos_internos ri
            JOIN wms_remitos_internos_items rii ON ri.id = rii.remito_id
            WHERE ri.estado IN ('RECIBIDO', 'CANCELADO', 'EN_TRANSITO')
            ORDER BY ri.fecha_creacion DESC
        `);
        console.table(res);
        
        // Find the ones with 0 that belong to a received remito
        const zeros = res.filter(r => r.cantidad_recibida === 0 && (r.remito_estado === 'RECIBIDO' || r.remito_estado === 'CANCELADO'));
        
        if (zeros.length > 0) {
            console.log("Found zeros:", zeros);
            
            // The user wants them reverted to 'EN_TRANSITO'
            // So we revert the item to PENDIENTE, and the remito to EN_TRANSITO
            const uniqueRemitos = [...new Set(zeros.map(z => z.remito_id))];
            
            for (const rId of uniqueRemitos) {
                console.log("Reverting Remito", rId);
                await executeAWSQuery(`
                   UPDATE wms_remitos_internos SET estado = 'EN_TRANSITO' WHERE id = ${rId};
                   UPDATE wms_remitos_internos_items SET estado = 'PENDIENTE', cantidad_recibida = 0 WHERE remito_id = ${rId} AND (cantidad_recibida = 0 OR cantidad_recibida IS NULL);
                `);
            }
            console.log("Reverts completed. User can now re-receive in InventarioOperativo.");
        } else {
            console.log("No canceled 0 items found in the top 20.");
        }
        
    } catch(e) {
        console.error(e);
    }
}
fix();
