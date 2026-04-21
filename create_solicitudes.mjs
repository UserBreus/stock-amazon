fetch('http://3.85.26.173:5005/sql', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ query: "IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Solicitudes' AND xtype='U') CREATE TABLE Stock_Solicitudes (id INT IDENTITY(1,1) PRIMARY KEY, deposito_id INT REFERENCES Stock_Depositos(id), producto_id UNIQUEIDENTIFIER REFERENCES Stock_Productos(id), cantidad_solicitada INT, estado VARCHAR(50) DEFAULT 'pendiente', usuario_id VARCHAR(50), fecha_creacion DATETIME DEFAULT GETDATE());" }) 
}).then(r=>r.json()).then(console.log);
