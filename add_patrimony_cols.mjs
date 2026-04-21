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
    const queries = [
        "ALTER TABLE Stock_Etiquetas ADD compra_id UNIQUEIDENTIFIER NULL;",
        "ALTER TABLE Stock_Etiquetas ADD costo_unitario_real DECIMAL(18,2) DEFAULT 0;",
        "ALTER TABLE Stock_Compras ADD gastos_extras DECIMAL(18,2) DEFAULT 0;"
    ];

    for (let q of queries) {
        console.log("Running:", q);
        const res = await executeQuery(q);
        console.log("Result:", res);
    }
}

run().catch(console.error);
