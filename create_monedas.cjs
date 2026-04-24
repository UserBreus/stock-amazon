

async function run() {
    try {
        const query1 = `
          IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Monedas' AND xtype='U')
          CREATE TABLE Stock_Monedas (
             id INT IDENTITY(1,1) PRIMARY KEY,
             codigo VARCHAR(10) NOT NULL,
             simbolo VARCHAR(10) NOT NULL,
             nombre VARCHAR(100) NOT NULL,
             creada_el DATETIME DEFAULT GETDATE()
          );
        `;
        
        await fetch('http://localhost:3002/api/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query1 })
        });
        
        const query2 = `
          IF NOT EXISTS (SELECT * FROM Stock_Monedas WHERE codigo='USD')
          INSERT INTO Stock_Monedas (codigo, simbolo, nombre) VALUES ('USD', 'U$S', 'Dólares Estadounidenses');
          
          IF NOT EXISTS (SELECT * FROM Stock_Monedas WHERE codigo='UYU')
          INSERT INTO Stock_Monedas (codigo, simbolo, nombre) VALUES ('UYU', '$', 'Pesos Uruguayos');
        `;
        
        await fetch('http://localhost:3002/api/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query2 })
        });
        
        const query3 = `
          IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'moneda_id' AND Object_ID = Object_ID(N'Stock_Operaciones_Financieras'))  
             BEGIN 
                 /* Si hay una tabla transaccional como Movimientos o Compras deberia alterarla,
                    pero necesitamos verificar primero como se guardan las compras.
                    Normalmente: Stock_Movimientos o wms_remitos_internos. Revisare el codigo 
                    una vez cree la tabla de monedas.
                 */
             END
        `;

        console.log('Stock_Monedas Table Created and Populated');
    } catch(e) {
        console.error(e);
    }
}
run();
