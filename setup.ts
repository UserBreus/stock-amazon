import { executeAWSQuery } from './src/lib/aws-client';

async function apply() {
  const q = `
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Compras_Costos_Extra]') AND type in (N'U'))
    BEGIN
        CREATE TABLE Stock_Compras_Costos_Extra (
            id INT IDENTITY(1,1) PRIMARY KEY,
            compra_id UNIQUEIDENTIFIER NOT NULL,
            descripcion VARCHAR(255) NOT NULL,
            monto DECIMAL(18,2) NOT NULL,
            fecha DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (compra_id) REFERENCES Stock_Compras(id)
        );
    END
  `;
  try {
      await executeAWSQuery(q);
      console.log('Tabla Stock_Compras_Costos_Extra verificada/creada exitosamente.');
  } catch(e) {
      console.error(e);
  }
}
apply();
