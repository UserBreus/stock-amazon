async function run() {
    try {
        const q1 = `
          IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Importaciones]') AND type in (N'U'))
          BEGIN
              CREATE TABLE Stock_Importaciones (
                  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                  origen VARCHAR(255) NOT NULL,
                  empresa_importadora VARCHAR(255),
                  contacto_importadora VARCHAR(255),
                  empresa_transporte_local VARCHAR(255),
                  contacto_transporte_local VARCHAR(255),
                  estado VARCHAR(50) DEFAULT 'en_transito',
                  fecha_creacion DATETIME DEFAULT GETDATE(),
                  creado_por VARCHAR(50)
              );
          END;
        `;
        
        const q2 = `
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'importacion_id' AND Object_ID = Object_ID(N'Stock_Compras'))
          BEGIN
              ALTER TABLE Stock_Compras ADD importacion_id UNIQUEIDENTIFIER NULL;
              ALTER TABLE Stock_Compras ADD CONSTRAINT FK_Stock_Compras_Importacion FOREIGN KEY (importacion_id) REFERENCES Stock_Importaciones(id) ON DELETE SET NULL;
          END;
        `;

        const r1 = await fetch('http://localhost:3002/api/sql', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: q1 })
        });
        const d1 = await r1.json();
        console.log('Q1', d1);

        const r2 = await fetch('http://localhost:3002/api/sql', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: q2 })
        });
        const d2 = await r2.json();
        console.log('Q2', d2);
    } catch(e) {
        console.error(e);
    }
}
run();
