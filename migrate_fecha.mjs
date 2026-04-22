const sql = `
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE Name = N'fecha_creacion' AND Object_ID = Object_ID(N'wms_remitos_internos')
    )
    BEGIN
        ALTER TABLE wms_remitos_internos ADD fecha_creacion DATETIME DEFAULT GETDATE();
    END
`;

fetch('http://localhost:3000/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
})
.then(res => res.json())
.then(data => console.log("Success:", data))
.catch(err => console.error("Error:", err));
