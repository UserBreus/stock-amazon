const fetch = require('node-fetch');
async function run() {
    try {
        const res = await fetch('http://localhost:3002/api/sql', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ query: "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Importaciones'" })
        });
        const d = await res.json();
        console.log('Stock_Importaciones Columns:', d.map ? d.map(r => r.COLUMN_NAME) : d);
        
        const res2 = await fetch('http://localhost:3002/api/sql', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ query: "SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Compras'" })
        });
        const d2 = await res2.json();
        console.log('Stock_Compras Columns:', d2.map ? d2.map(r => r.COLUMN_NAME) : d2);
    } catch(e) { console.error(e); }
}
run();
