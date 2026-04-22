const sql = `
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'wms_solicitudes')
BEGIN
    CREATE TABLE wms_solicitudes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        numeracion VARCHAR(50) NOT NULL,
        deposito_solicitante_id INT NOT NULL,
        creado_por VARCHAR(100),
        fecha_creacion DATETIME DEFAULT GETDATE(),
        estado VARCHAR(50) DEFAULT 'PENDIENTE'
    );
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'wms_solicitudes_items')
BEGIN
    CREATE TABLE wms_solicitudes_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        solicitud_id INT NOT NULL,
        variante_id INT NOT NULL,
        cantidad_solicitada DECIMAL(18,4) NOT NULL,
        cantidad_despachada DECIMAL(18,4) DEFAULT 0.00,
        FOREIGN KEY (solicitud_id) REFERENCES wms_solicitudes(id)
    );
END
`;

fetch('http://localhost:3000/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
})
.then(res => res.json())
.then(data => console.log('Tables created:', JSON.stringify(data)))
.catch(err => console.error('Error:', err));
