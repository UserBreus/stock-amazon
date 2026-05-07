const fetch = require('node-fetch'); // If not available, use dynamic import or native fetch
async function run() {
    const res = await fetch('https://administracionuser.uy/api/sql', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ query: "UPDATE Stock_Variantes SET moneda = 'USD' WHERE costo IS NOT NULL" }) 
    });
    console.log(await res.text());
}
run();
