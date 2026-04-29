const fetch = globalThis.fetch;

async function executeSql(query) {
    const res = await fetch('http://3.85.26.173:5005/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const json = await res.json();
    if(json.error) throw new Error(json.error);
    return json.data;
}

async function retroSync() {
  try {
    console.log("Conectado localmente al endpoint...");

    // Obtenemos los detalles de compras pendientes que NO tienen todavía etiquetas 'pendiente_recepcion'
    const det = await executeSql(`
      SELECT 
          d.compra_id, d.variante_id, d.cantidad, d.precio_unitario,
          p.tipo_gestion
      FROM Stock_Compras_Detalle d
      JOIN Stock_Compras c ON c.id = d.compra_id
      JOIN Stock_Variantes v ON v.id = d.variante_id
      JOIN Stock_Productos_Maestros p ON p.id = v.producto_maestro_id
      WHERE c.estado = 'pendiente'
        AND NOT EXISTS (
            SELECT 1 FROM Stock_Etiquetas e 
            WHERE e.compra_id = d.compra_id AND e.variante_id = d.variante_id AND e.estado = 'pendiente_recepcion'
        )
    `);

    if (!det || det.length === 0) {
       console.log("No hay compras pendientes que necesiten retro-sync.");
       process.exit(0);
    }
    console.log("Encontradas " + det.length + " lineas de compras pendientes sin pre-mint.");
    
    // Asumimos depósito central = 1 para el pre-mint, luego RecepcionAuditoria lo actualiza.
    let count = 0;
    for (const item of det) {
      if (item.tipo_gestion === 'lote_individual') {
         // Insertar 'cantidad' de filas
         for(let i=0; i<item.cantidad; i++) {
             await executeSql(`
                 INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, compra_id, costo_unitario_real, estado)
                 VALUES (CONVERT(varchar(255), NEWID()), '${item.variante_id}', 1, 0, 0, '${item.compra_id}', ${item.precio_unitario}, 'pendiente_recepcion')
             `);
             count++;
         }
      } else {
         // Granel: 1 fila con la cantidad
         await executeSql(`
             INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, compra_id, costo_unitario_real, estado)
             VALUES (CONVERT(varchar(255), NEWID()), '${item.variante_id}', 1, ${item.cantidad}, 0, '${item.compra_id}', ${item.precio_unitario}, 'pendiente_recepcion')
         `);
         count++;
      }
    }

    console.log("¡Éxito! " + count + " IDs fantasmas generados para compras pre-existentes.");
    process.exit(0);

  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

retroSync();
