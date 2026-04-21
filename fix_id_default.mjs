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
    const q1 = "ALTER TABLE Stock_Movimientos ADD CONSTRAINT DF_Stock_Movimientos_id DEFAULT NEWID() FOR id;";
    const r1 = await executeQuery(q1);
    console.log("DF Stock_Movimientos:", r1);
}

run().catch(console.error);
