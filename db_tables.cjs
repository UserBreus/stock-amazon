async function run() {
    try {
        const res = await fetch('http://localhost:3002/api/sql', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ query: "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES" })
        });
        const d = await res.json();
        console.log(d.data.map(r => r.TABLE_NAME));
    } catch(e) { console.error(e); }
}
run();
