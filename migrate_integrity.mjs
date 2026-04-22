const sql = `
    -- First, check if numeracion doesn't exist, maybe it's called codigo_remito?
    IF EXISTS (
        SELECT * FROM sys.columns 
        WHERE Name = N'codigo_remito' AND Object_ID = Object_ID(N'wms_remitos_internos')
    )
    BEGIN
        EXEC sp_rename 'wms_remitos_internos.codigo_remito', 'numeracion', 'COLUMN';
    END

    -- Re-check if it somehow doesn't exist at all..
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE Name = N'numeracion' AND Object_ID = Object_ID(N'wms_remitos_internos')
    )
    BEGIN
        ALTER TABLE wms_remitos_internos ADD numeracion VARCHAR(50);
    END
    
    -- Ensure estado exists
    IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE Name = N'estado' AND Object_ID = Object_ID(N'wms_remitos_internos')
    )
    BEGIN
        ALTER TABLE wms_remitos_internos ADD estado VARCHAR(50) DEFAULT 'EN_TRANSITO';
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
