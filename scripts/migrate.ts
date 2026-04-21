import fetch from 'node-fetch';

async function executeAWSQuery(query) {
  const proxyUrl = 'http://3.85.26.173:5005/sql';
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error("Error en AWS Proxy: " + await response.text());
  const data = await response.json();
  if(!data.success) throw new Error("SQL failed: " + JSON.stringify(data.error));
  return data;
}

async function runMigration() {
  console.log("Resuming Migration Final Stage...");
  try {
    // Drop old UUID columns if they exist
    await executeAWSQuery("IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'etiqueta_id' AND Object_ID = Object_ID(N'Stock_Movimientos')) ALTER TABLE Stock_Movimientos DROP COLUMN etiqueta_id; IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'id' AND Object_ID = Object_ID(N'Stock_Productos_Maestros') AND system_type_id = 36) ALTER TABLE Stock_Productos_Maestros DROP COLUMN id; IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'id' AND Object_ID = Object_ID(N'Stock_Variantes') AND system_type_id = 36) ALTER TABLE Stock_Variantes DROP COLUMN id; IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'id' AND Object_ID = Object_ID(N'Stock_Etiquetas') AND system_type_id = 36) ALTER TABLE Stock_Etiquetas DROP COLUMN id;");
    console.log("Old UUID columns dropped safely.");

    // Stage 5: Rename to final names safely (if new_XX exists, rename it)
    await executeAWSQuery("IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'new_id' AND Object_ID = Object_ID(N'Stock_Productos_Maestros')) EXEC sp_rename 'Stock_Productos_Maestros.new_id', 'id', 'COLUMN'; IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'new_id' AND Object_ID = Object_ID(N'Stock_Variantes')) EXEC sp_rename 'Stock_Variantes.new_id', 'id', 'COLUMN'; IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'new_producto_maestro_id' AND Object_ID = Object_ID(N'Stock_Variantes')) EXEC sp_rename 'Stock_Variantes.new_producto_maestro_id', 'producto_maestro_id', 'COLUMN'; IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'new_id' AND Object_ID = Object_ID(N'Stock_Etiquetas')) EXEC sp_rename 'Stock_Etiquetas.new_id', 'id', 'COLUMN'; IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'new_variante_id' AND Object_ID = Object_ID(N'Stock_Etiquetas')) EXEC sp_rename 'Stock_Etiquetas.new_variante_id', 'variante_id', 'COLUMN'; IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'new_etiqueta_id' AND Object_ID = Object_ID(N'Stock_Movimientos')) EXEC sp_rename 'Stock_Movimientos.new_etiqueta_id', 'etiqueta_id', 'COLUMN';");
    console.log("Renaming done.");

    // Stage 6: Restore constraints
    await executeAWSQuery("IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('Stock_Productos_Maestros')) ALTER TABLE Stock_Productos_Maestros ADD CONSTRAINT PK_PM PRIMARY KEY (id); IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('Stock_Variantes')) ALTER TABLE Stock_Variantes ADD CONSTRAINT PK_Var PRIMARY KEY (id); IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE type = 'PK' AND parent_object_id = OBJECT_ID('Stock_Etiquetas')) ALTER TABLE Stock_Etiquetas ADD CONSTRAINT PK_Etq PRIMARY KEY (id); IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('Stock_Variantes')) ALTER TABLE Stock_Variantes ADD CONSTRAINT FK_Var_PM FOREIGN KEY (producto_maestro_id) REFERENCES Stock_Productos_Maestros(id) ON DELETE CASCADE; IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('Stock_Etiquetas')) ALTER TABLE Stock_Etiquetas ADD CONSTRAINT FK_Etq_Var FOREIGN KEY (variante_id) REFERENCES Stock_Variantes(id) ON DELETE CASCADE; IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('Stock_Movimientos') AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Stock_Movimientos') AND name = 'etiqueta_id')) ALTER TABLE Stock_Movimientos ADD CONSTRAINT FK_Mov_Etq FOREIGN KEY (etiqueta_id) REFERENCES Stock_Etiquetas(id) ON DELETE NO ACTION;");
    console.log("Constraints restored natively with INT identity.");

    console.log("MIGRATION COMPLETED SUCCESSFULLY!");
  } catch(e) {
    console.error("Migration failed:", e);
  }
}

runMigration();
