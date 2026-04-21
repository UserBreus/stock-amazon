import { executeAWSQuery } from './src/lib/aws-client.ts';

async function migrate() {
    try {
        console.log("Adding estado column to Stock_Compras...");
        await executeAWSQuery(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE Name = N'estado'
                AND Object_ID = Object_ID(N'Stock_Compras')
            )
            BEGIN
                ALTER TABLE Stock_Compras ADD estado VARCHAR(50) DEFAULT 'pendiente';
                UPDATE Stock_Compras SET estado = 'completada' WHERE estado IS NULL;
            END
        `);
        console.log("Migration successful");
    } catch(e) {
        console.error(e);
    }
}
migrate();
