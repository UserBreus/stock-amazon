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
    // Insert mock row using an INT for variante_id
    const q1 = `INSERT INTO Stock_Compras_Detalle (id, compra_id, variante_id, cantidad, precio_unitario) 
                VALUES (NEWID(), '${compraId}', 1, 50, 10.50)`;
                
    console.log("Q1:", await executeQuery(q1));
}

run().catch(console.error);
