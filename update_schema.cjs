async function run() {
    try {
        const query1 = `
          IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'moneda_id' AND Object_ID = Object_ID(N'Stock_Compras'))
          BEGIN
             ALTER TABLE Stock_Compras ADD moneda_id INT NULL;
             ALTER TABLE Stock_Compras ADD CONSTRAINT fk_compras_moneda FOREIGN KEY (moneda_id) REFERENCES Stock_Monedas(id);
          END
        `;
        
        await fetch('http://localhost:3002/api/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query1 })
        });
        
        console.log('Stock_Compras altered successfully');
    } catch(e) {
        console.error(e);
    }
}
run();
