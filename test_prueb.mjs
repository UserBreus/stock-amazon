import fs from 'fs';

const url = 'http://3.85.26.173:5005/sql';

async function executeQuery(query) {
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    return r.json();
}

async function run() {
    const compraId = '7949CCE3-989F-46D4-8895-AF906B06A599';
    
    // Clear the old ones
    const q1 = `DELETE FROM Stock_Compras_Detalle WHERE compra_id = '${compraId}'`;
    console.log("Q1 DELETE:", await executeQuery(q1));

    // Find PRUEBA variants
    const qVars = "SELECT id, codigo_variante FROM Stock_Variantes WHERE codigo_variante LIKE 'PRU-PRUEB-%'";
    const { data: variants } = await executeQuery(qVars);
    console.log("Found variants:", variants);

    if (variants && variants.length > 0) {
        let insertValues = variants.map(v => 
           `(NEWID(), '${compraId}', ${v.id}, 10, 50.00)`
        ).join(", ");
        
        const qInsert = `INSERT INTO Stock_Compras_Detalle (id, compra_id, variante_id, cantidad, precio_unitario) VALUES ${insertValues}`;
        console.log("QInsert:", await executeQuery(qInsert));
    } else {
        console.log("No prueba variants found in DB");
    }
}

run().catch(console.error);
