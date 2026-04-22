async function run() {
    try {
        const query = `
          SELECT * FROM wms_solicitudes ORDER BY fecha_creacion DESC
        `;
        
        const r1 = await fetch('http://3.85.26.173:5005/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const json1 = await r1.json();
        const d = json1.data || [];
        console.table(d);
        
        // Find those who are COMPLETADO but their remito is somehow empty or zero?
    } catch(e) {
        console.error("Error communicating with DB Proxy:", e.message);
    }
}
run();
