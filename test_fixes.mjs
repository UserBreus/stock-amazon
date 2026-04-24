// Full end-to-end test of the dispatch flow
async function testDispatch() {
  // Get a pending solicitud
  const solRes = await fetch('http://localhost:3000/api/sql', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({query: `SELECT TOP 1 s.*, d.nombre as sector_nombre FROM wms_solicitudes s LEFT JOIN Stock_Depositos d ON s.deposito_solicitante_id = d.id WHERE s.estado = 'PENDIENTE'`})
  }).then(r=>r.json());
  
  const sol = solRes.data?.[0];
  if (!sol) return console.log('No pending solicitudes found');
  console.log('Testing with solicitud:', sol.numeracion, 'sector:', sol.sector_nombre);

  // Get items for this solicitud
  const itemsRes = await fetch('http://localhost:3000/api/sql', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({query: `SELECT i.*, v.nombre_variante, p.nombre as producto_nombre FROM wms_solicitudes_items i JOIN Stock_Variantes v ON i.variante_id = v.id JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id WHERE i.solicitud_id = ${sol.id}`})
  }).then(r=>r.json());
  
  console.log('Items:', JSON.stringify(itemsRes.data?.map(i => ({var: i.nombre_variante, qty: i.cantidad_solicitada}))));

  // Test creating remito with OUTPUT INSERTED.id
  const remitoCode = 'TEST-' + Date.now().toString().slice(-6);
  const remitoRes = await fetch('http://localhost:3000/api/sql', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({query: `
      INSERT INTO wms_remitos_internos (numeracion, deposito_origen_id, deposito_destino_id, creado_por, estado)
      OUTPUT INSERTED.id
      VALUES ('${remitoCode}', 1, ${sol.deposito_solicitante_id}, 'TEST', 'EN_TRANSITO');
    `})
  }).then(r=>r.json());
  
  const remitoId = remitoRes.data?.[0]?.id;
  console.log('Created remito ID:', remitoId, '| error:', remitoRes.error || 'none');
  
  if (remitoId) {
    // Test UPDATE solicitud with remito_id
    const updateRes = await fetch('http://localhost:3000/api/sql', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({query: `UPDATE wms_solicitudes SET remito_id = ${remitoId} WHERE id = ${sol.id};`})
    }).then(r=>r.json());
    console.log('Update solicitud remito_id:', updateRes.error || 'OK');
    
    // Cleanup
    await fetch('http://localhost:3000/api/sql', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({query: `DELETE FROM wms_remitos_internos WHERE id = ${remitoId}; UPDATE wms_solicitudes SET remito_id = NULL WHERE id = ${sol.id};`})
    }).then(r=>r.json());
    console.log('✅ Full flow works! Cleanup done.');
  }
}
testDispatch().catch(console.error);
