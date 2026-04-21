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
    const q1 = "ALTER TABLE Stock_Movimientos ALTER COLUMN usuario_id VARCHAR(50);";
    const q2 = "ALTER TABLE Stock_Compras ALTER COLUMN creado_por VARCHAR(50);";
    
    console.log("Q1:", await executeQuery(q1));
    console.log("Q2:", await executeQuery(q2));
}

run().catch(console.error);
