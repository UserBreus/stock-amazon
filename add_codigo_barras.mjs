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
    const query = `ALTER TABLE Stock_Etiquetas ADD codigo_barras VARCHAR(255) NULL;`;
    const dt = await executeQuery(query);
    console.log("Result:", dt);
}

run().catch(console.error);
