import fs from 'fs';

const url = 'http://3.85.26.173:5005/sql';

async function executeQuery(query) {
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    return r.json();
}

async function run() {
    console.log("Creando tabla wms_remitos_internos...");
    try {
        await executeQuery(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='wms_remitos_internos' AND xtype='U')
            CREATE TABLE wms_remitos_internos (
                id INT IDENTITY(1,1) PRIMARY KEY,
                codigo_remito VARCHAR(50) NOT NULL UNIQUE,
                origen_id INT,
                destino_id INT,
                fecha DATETIME DEFAULT GETDATE(),
                usuario_id UNIQUEIDENTIFIER,
                tipo_movimiento VARCHAR(50) DEFAULT 'transferencia',
                estado VARCHAR(50) DEFAULT 'completado'
            )
        `);
        console.log("wms_remitos_internos procesado.");
    } catch (e) {
        console.error(e);
    }
    
    console.log("Alterando Stock_Movimientos si es necesario...");
    try {
        await executeQuery(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'remito_id' AND Object_ID = Object_ID(N'Stock_Movimientos'))
            BEGIN
                ALTER TABLE Stock_Movimientos ADD remito_id INT NULL;
                ALTER TABLE Stock_Movimientos ADD CONSTRAINT FK_Stock_Movs_Remito FOREIGN KEY (remito_id) REFERENCES wms_remitos_internos(id);
            END
        `);
        console.log("Stock_Movimientos alterado exitosamente.");
    } catch(e) {
        console.error(e);
        console.log("Reintentando sin foreign key (por si acaso)...");
        try {
            await executeQuery(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'remito_id' AND Object_ID = Object_ID(N'Stock_Movimientos'))
                BEGIN
                    ALTER TABLE Stock_Movimientos ADD remito_id INT NULL;
                END
            `);
        } catch(e2) {
             console.log("Remito_id alternativo: Ya existe o falló.");
        }
    }
    
    const cs = await executeQuery("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Movimientos'");
    console.log("Columnas de Stock_Movs:", cs.map(c => c.COLUMN_NAME));
}

run().catch(console.error);
