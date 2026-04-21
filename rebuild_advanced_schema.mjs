const queries = [
`IF OBJECT_ID('Vista_Stock_Actual', 'v') IS NOT NULL DROP VIEW Vista_Stock_Actual;`,
`IF OBJECT_ID('Vista_Capital_Activo', 'v') IS NOT NULL DROP VIEW Vista_Capital_Activo;`,

`IF OBJECT_ID('Stock_Solicitudes', 'U') IS NOT NULL DROP TABLE Stock_Solicitudes;`,
`IF OBJECT_ID('Stock_Movimientos', 'U') IS NOT NULL DROP TABLE Stock_Movimientos;`,
`IF OBJECT_ID('Stock_Etiquetas', 'U') IS NOT NULL DROP TABLE Stock_Etiquetas;`,
`IF OBJECT_ID('Stock_Productos', 'U') IS NOT NULL DROP TABLE Stock_Productos;`,
`IF OBJECT_ID('Stock_Categorias', 'U') IS NOT NULL DROP TABLE Stock_Categorias;`,
`IF OBJECT_ID('Stock_Depositos', 'U') IS NOT NULL DROP TABLE Stock_Depositos;`,

`CREATE TABLE Stock_Categorias (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(500),
    config_json NVARCHAR(MAX) DEFAULT '{}',
    fecha_creacion DATETIME DEFAULT GETDATE()
);`,

`CREATE TABLE Stock_Productos (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria_id INT REFERENCES Stock_Categorias(id),
    unidad_base VARCHAR(50) NOT NULL,
    empaque_ingreso VARCHAR(50),
    factor_conversion DECIMAL(18,4) DEFAULT 1.0, 
    costo_unitario_base DECIMAL(18,2) DEFAULT 0.00,
    moneda VARCHAR(10) DEFAULT 'USD',
    fecha_creacion DATETIME DEFAULT GETDATE()
);`,

`CREATE TABLE Stock_Depositos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    ubicacion VARCHAR(255)
);`,

`CREATE TABLE Stock_Etiquetas (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    codigo_barras VARCHAR(100) UNIQUE NOT NULL,
    producto_id UNIQUEIDENTIFIER REFERENCES Stock_Productos(id),
    deposito_id INT REFERENCES Stock_Depositos(id),
    cantidad_inicial DECIMAL(18,4),
    cantidad_actual DECIMAL(18,4),
    metadata_lote NVARCHAR(MAX) DEFAULT '{}',
    fecha_vencimiento DATE,
    estado VARCHAR(50) DEFAULT 'activo',
    fecha_creacion DATETIME DEFAULT GETDATE()
);`,

`CREATE TABLE Stock_Movimientos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    etiqueta_id UNIQUEIDENTIFIER REFERENCES Stock_Etiquetas(id),
    tipo_movimiento VARCHAR(50),
    cantidad_afectada DECIMAL(18,4) NOT NULL,
    deposito_origen_id INT REFERENCES Stock_Depositos(id),
    deposito_destino_id INT REFERENCES Stock_Depositos(id),
    usuario_id VARCHAR(255),
    fecha DATETIME DEFAULT GETDATE(),
    observaciones NVARCHAR(500)
);`,

`CREATE TABLE Stock_Solicitudes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    deposito_id INT REFERENCES Stock_Depositos(id),
    producto_id UNIQUEIDENTIFIER REFERENCES Stock_Productos(id),
    cantidad_solicitada DECIMAL(18,4),
    estado VARCHAR(50) DEFAULT 'pendiente',
    usuario_id VARCHAR(255),
    fecha_creacion DATETIME DEFAULT GETDATE()
);`,

`DELETE FROM usuarios WHERE email IN ('GER', 'adminstock');`,
`INSERT INTO usuarios (id, email, pass, nombre_completo, permisos) VALUES 
('USR-GER-001', 'GER', 'Vilardebo2031', 'Super Gerente WMS', 'gerente_stock'),
('USR-ADM-002', 'adminstock', 'admin123', 'Administrativo Central', 'administrativo_stock');`,

`INSERT INTO Stock_Depositos (nombre, tipo) VALUES 
('Centro Logístico', 'central'),
('Sector Corte 1', 'mini_sector');`,

`CREATE VIEW Vista_Stock_Actual AS
SELECT 
    p.id AS producto_id, p.sku, p.nombre AS producto_nombre, p.unidad_base,
    c.nombre AS categoria,
    ISNULL(SUM(e.cantidad_actual), 0) AS cantidad_total,
    COUNT(e.id) as bultos_activos
FROM Stock_Productos p
LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
LEFT JOIN Stock_Etiquetas e ON p.id = e.producto_id AND e.estado = 'activo'
GROUP BY p.id, p.sku, p.nombre, p.unidad_base, c.nombre;`,

`CREATE VIEW Vista_Capital_Activo AS
SELECT 
    p.moneda,
    SUM(e.cantidad_actual * p.costo_unitario_base) AS capital_total
FROM Stock_Etiquetas e
JOIN Stock_Productos p ON e.producto_id = p.id
WHERE e.estado = 'activo'
GROUP BY p.moneda;`
];

async function runQueries() {
    for (const q of queries) {
        console.log("Running:", q.substring(0, 50));
        try {
            const r = await fetch('http://3.85.26.173:5005/sql', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ query: q }) 
            });
            const text = await r.text();
            if(!JSON.parse(text).success) {
               console.error("Failed:", text);
            }
        } catch(e) {
            console.error("HTTP Err:", e);
        }
    }
    console.log("SCHEMA DEPLOYED!");
}

runQueries();
