const sql = `
UPDATE Stock_Movimientos 
SET remito_id = NULL 
WHERE remito_id IN (
    SELECT id FROM wms_remitos_internos 
    WHERE id NOT IN (SELECT remito_id FROM wms_remitos_internos_items)
);

DELETE FROM wms_remitos_internos
WHERE id NOT IN (SELECT remito_id FROM wms_remitos_internos_items);
`;
fetch('http://localhost:3000/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
})
.then(res => res.json())
.then(data => console.log('Success:', JSON.stringify(data, null, 2)))
.catch(err => console.error('Error!!!:', err));
