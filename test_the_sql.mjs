const sql = `
  SELECT r.*, d_origen.nombre as origen_nombre, 
    (SELECT COUNT(*) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_items
  FROM wms_remitos_internos r
  LEFT JOIN Stock_Depositos d_origen ON r.deposito_origen_id = d_origen.id
  WHERE r.deposito_destino_id = 2 AND r.estado = 'EN_TRANSITO'
  ORDER BY r.fecha_creacion ASC
`;

fetch('http://localhost:3000/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
})
.then(res => res.json())
.then(data => console.log("Success:", JSON.stringify(data, null, 2)))
.catch(err => console.error("Error!!!:", err));
