import fs from 'fs';
const url = 'http://3.85.26.173:5005/sql';

async function executeQuery(query) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    return r.json();
}

async function run() {
    const res = await executeQuery("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Solicitudes'");
    console.log("Stock_Solicitudes:", res.map(c => c.COLUMN_NAME).join(', '));
    const res2 = await executeQuery("SELECT TOP 1 * FROM Stock_Solicitudes");
    console.log("Muestra:", res2);
}
run();
