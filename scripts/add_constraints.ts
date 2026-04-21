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

async function addConstraints() {
  try {
    await executeAWSQuery("ALTER TABLE Stock_Productos_Maestros ADD CONSTRAINT PK_PM PRIMARY KEY (id); ALTER TABLE Stock_Variantes ADD CONSTRAINT PK_Var PRIMARY KEY (id); ALTER TABLE Stock_Etiquetas ADD CONSTRAINT PK_Etq PRIMARY KEY (id);");
    console.log("PK added");
    
    await executeAWSQuery("ALTER TABLE Stock_Variantes ADD CONSTRAINT FK_Var_PM FOREIGN KEY (producto_maestro_id) REFERENCES Stock_Productos_Maestros(id) ON DELETE CASCADE; ALTER TABLE Stock_Etiquetas ADD CONSTRAINT FK_Etq_Var FOREIGN KEY (variante_id) REFERENCES Stock_Variantes(id) ON DELETE CASCADE; ALTER TABLE Stock_Movimientos ADD CONSTRAINT FK_Mov_Etq FOREIGN KEY (etiqueta_id) REFERENCES Stock_Etiquetas(id) ON DELETE NO ACTION;");
    console.log("FK added");
  } catch(e) {
    console.log(e);
  }
}
addConstraints();
