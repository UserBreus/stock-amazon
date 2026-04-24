async function run() {
    try {
        const res = await fetch('http://localhost:3002/api/sql', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ query: "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('Stock_Importaciones', 'Stock_Compras')" })
        });
        const d = await res.json();
        console.log(d);
    } catch(e) { console.error(e); }
}
run();
