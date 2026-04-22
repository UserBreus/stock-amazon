const sql = `
    IF OBJECT_ID('wms_remitos_internos', 'U') IS NULL
    BEGIN
        CREATE TABLE wms_remitos_internos (
            id INT IDENTITY(1,1) PRIMARY KEY,
            numeracion VARCHAR(50) NOT NULL UNIQUE,
            deposito_origen_id INT NOT NULL,
            deposito_destino_id INT NOT NULL,
            creado_por VARCHAR(50),
            fecha_creacion DATETIME DEFAULT GETDATE(),
            estado VARCHAR(50) DEFAULT 'EN_TRANSITO',
            observaciones_generales TEXT
        );
    END
    
    IF OBJECT_ID('wms_remitos_internos_items', 'U') IS NULL
    BEGIN
        CREATE TABLE wms_remitos_internos_items (
            id INT IDENTITY(1,1) PRIMARY KEY,
            remito_id INT NOT NULL REFERENCES wms_remitos_internos(id) ON DELETE CASCADE,
            etiqueta_generada_id INT NULL,
            variante_id INT NOT NULL, 
            cantidad_enviada DECIMAL(18,4) NOT NULL,
            cantidad_recibida DECIMAL(18,4) NULL,
            estado VARCHAR(50) DEFAULT 'PENDIENTE'
        );
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
