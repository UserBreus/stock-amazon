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
    const dt = await executeQuery(\`
        SELECT id, codigo_variante, nombre_variante 
        FROM Stock_Variantes 
        WHERE codigo_variante LIKE 'PRU-PRUEB-%'
    \`);
    console.log("Variantes:", dt);
}

run().catch(console.error);
