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
    // We clear Stock_Compras_Detalle because it contains obsolete UUIDs instead of the new INT variant IDs
    const q1 = `DELETE FROM Stock_Compras_Detalle`;
    
    // Drop the column and redefine it properly as INT
    const q2 = `ALTER TABLE Stock_Compras_Detalle DROP COLUMN variante_id`;
    const q3 = `ALTER TABLE Stock_Compras_Detalle ADD variante_id INT`;

    console.log("Q1:", await executeQuery(q1));
    console.log("Q2:", await executeQuery(q2));
    console.log("Q3:", await executeQuery(q3));
}

run().catch(console.error);
