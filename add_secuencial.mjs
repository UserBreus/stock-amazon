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
    const q1 = "ALTER TABLE Stock_Movimientos ADD numero_secuencial INT IDENTITY(1,1);";
    const q2 = "ALTER TABLE Stock_Compras ADD numero_secuencial INT IDENTITY(1,1);";
    const q3 = "ALTER TABLE Stock_Compras_Detalle ADD numero_secuencial INT IDENTITY(1,1);";
    
    console.log("Movimientos:", await executeQuery(q1));
    console.log("Compras:", await executeQuery(q2));
    console.log("Detalles:", await executeQuery(q3));
}

run().catch(console.error);
