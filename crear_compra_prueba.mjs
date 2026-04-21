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
    // Get some PRUEBA variants (1 from PRUEBA1, 2 from PRUEBA4, 2 from PRUEBA2)
    const vars = await executeQuery("SELECT TOP 5 id, codigo_variante, nombre_variante FROM Stock_Variantes WHERE codigo_variante LIKE 'PRU-PRUEB-%' ORDER BY id");
    console.log("Vars found:", vars.data);
    
    // Get a proveedor
    const pro = await executeQuery("SELECT TOP 1 id FROM Stock_Proveedores");
    console.log("Prov:", pro.data);
    
    // Get tipo factura
    const tf = await executeQuery("SELECT TOP 1 id FROM Stock_TiposFactura");
    console.log("TipoFact:", tf.data);
    
    if (!vars.data || vars.data.length < 5) return console.log("Not enough variants");
    
    const provId = pro.data[0].id;
    const tfId = tf.data[0].id;
    
    // Build purchase
    const lines = [
        { varianteId: vars.data[0].id, cantidad: 20, precio: 45.00 },
        { varianteId: vars.data[1].id, cantidad: 15, precio: 38.50 },
        { varianteId: vars.data[2].id, cantidad: 30, precio: 22.75 },
        { varianteId: vars.data[3].id, cantidad: 10, precio: 89.00 },
        { varianteId: vars.data[4].id, cantidad: 25, precio: 55.00 },
    ];
    
    const total = lines.reduce((a, l) => a + l.cantidad * l.precio, 0);
    const gastosExtras = 320.00; // simulated import freight
    
    const q = `
        DECLARE @CId UNIQUEIDENTIFIER = NEWID();
        INSERT INTO Stock_Compras (id, proveedor_id, referencia_factura, tipo_factura_id, total_compra, creado_por, estado, gastos_extras)
        VALUES (@CId, '${provId}', 'TEST-COMPRA-${Date.now().toString().slice(-6)}', ${tfId}, ${total}, 'GER', 'pendiente', ${gastosExtras});
        
        INSERT INTO Stock_Compras_Detalle (id, compra_id, variante_id, cantidad, precio_unitario)
        VALUES
          (NEWID(), @CId, ${lines[0].varianteId}, ${lines[0].cantidad}, ${lines[0].precio}),
          (NEWID(), @CId, ${lines[1].varianteId}, ${lines[1].cantidad}, ${lines[1].precio}),
          (NEWID(), @CId, ${lines[2].varianteId}, ${lines[2].cantidad}, ${lines[2].precio}),
          (NEWID(), @CId, ${lines[3].varianteId}, ${lines[3].cantidad}, ${lines[3].precio}),
          (NEWID(), @CId, ${lines[4].varianteId}, ${lines[4].cantidad}, ${lines[4].precio});
        
        SELECT @CId as compra_id;
    `;
    
    const result = await executeQuery(q);
    console.log("Compra creada:", result);
    console.log("Total:", total);
    console.log("Gastos extras cargados:", gastosExtras);
}

run().catch(console.error);
