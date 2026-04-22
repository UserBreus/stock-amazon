const sql = `
  SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'wms_remitos_internos_items'
`;

fetch('http://localhost:3000/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
})
.then(res => res.json())
.then(data => console.log("Success:", JSON.stringify(data, null, 2)))
.catch(err => console.error("Error!!!:", err));
