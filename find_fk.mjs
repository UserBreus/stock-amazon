const sql = `
  SELECT 
      f.name AS ForeignKey,
      OBJECT_NAME(f.parent_object_id) AS TableName
  FROM 
      sys.foreign_keys AS f
  WHERE 
      f.referenced_object_id = OBJECT_ID('wms_remitos_internos');
`;

fetch('http://localhost:3000/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
})
.then(res => res.json())
.then(data => console.log("Success:", JSON.stringify(data, null, 2)))
.catch(err => console.error("Error!!!:", err));
