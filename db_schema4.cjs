async function run() {
    try {
        const res = await fetch('http://localhost:3002/api/sql', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ query: "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('Stock_Productos_Maestros')" })
        });
        const d = await res.json();
        console.log(d.data);
    } catch(e) { console.error(e); }
}
run();
