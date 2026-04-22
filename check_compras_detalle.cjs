async function run() {
    try {
        const query = `
          SELECT TOP 20 * FROM Stock_Compras_Detalle ORDER BY id DESC;
        `;
        
        const r1 = await fetch('http://3.85.26.173:5005/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const json1 = await r1.json();
        const d = json1.data || [];
        console.table(d);
        
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
