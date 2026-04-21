import fetch from 'node-fetch';

const API_URL = 'http://3.85.26.173:5005/sql';

async function executeSql(query) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const data = await res.json();
    return data;
}

const q = `
  DECLARE @CompraId UNIQUEIDENTIFIER = NEWID();
  DECLARE @ProvId UNIQUEIDENTIFIER;
  SELECT TOP 1 @ProvId = id FROM Stock_Proveedores;
  
  IF @ProvId IS NULL
  BEGIN
      SET @ProvId = NEWID();
      INSERT INTO Stock_Proveedores (id, nombre) VALUES (@ProvId, 'Proveedor Falso Test');
  END

  INSERT INTO Stock_Compras (id, proveedor_id, referencia_factura, total_compra, estado)
  VALUES (@CompraId, @ProvId, 'TEST-MODAL-001', 5000.00, 'pendiente');

  INSERT INTO Stock_Compras_Detalle (id, compra_id, variante_id, cantidad, precio_unitario)
  SELECT TOP 3 NEWID(), @CompraId, id, 10, 500.00 FROM Stock_Variantes;
`;

executeSql(q).then(console.log).catch(console.error);
