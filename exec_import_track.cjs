async function run() {
    try {
        const q1 = `
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'progreso' AND Object_ID = Object_ID(N'Stock_Importaciones'))
          BEGIN
              ALTER TABLE Stock_Importaciones ADD progreso VARCHAR(100) DEFAULT 'en_deposito_traslado';
          END;
        `;
        const r1 = await fetch('http://localhost:3002/api/sql', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: q1 })
        });
        const d1 = await r1.json();
        console.log('DB Update:', d1);
    } catch(e) {
        console.error(e);
    }
}
run();
