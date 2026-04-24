async function run() {
    try {
        const q1 = `
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'contacto' AND Object_ID = Object_ID(N'Stock_Proveedores'))
          BEGIN
              ALTER TABLE Stock_Proveedores ADD contacto NVARCHAR(255);
              ALTER TABLE Stock_Proveedores ADD ciudad NVARCHAR(255);
              ALTER TABLE Stock_Proveedores ADD razon_social NVARCHAR(255);
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
