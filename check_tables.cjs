async function run() {
    try {
        const query = `
          SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'
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
