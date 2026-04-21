const queries = [
    // 1. Limpieza de tablas dependientes
    `DROP TABLE IF EXISTS Stock_Solicitudes;`,
    `DROP TABLE IF EXISTS Stock_Movimientos;`,
    `DROP TABLE IF EXISTS Stock_Compras_Detalle;`,
    `DROP TABLE IF EXISTS Stock_Compras;`,
    `DROP TABLE IF EXISTS Stock_Etiquetas;`,
    `DROP TABLE IF EXISTS Stock_Variantes;`,
    `DROP TABLE IF EXISTS Stock_TiposFactura;`,
    `DROP TABLE IF EXISTS Stock_Proveedores;`,
    
    // Al intentar dropear Stock_Productos, si no funciona usamos TRUNCATE o directamente la ignoramos
    `BEGIN TRY DROP TABLE Stock_Productos_Maestros; END TRY BEGIN CATCH END CATCH;`,
    `BEGIN TRY DROP TABLE Stock_Productos; END TRY BEGIN CATCH END CATCH;`,
    

    // 2. Creacion Arquitectura Nueva
    // Productos Maestros (Padre)
    `CREATE TABLE Stock_Productos_Maestros (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        sku NVARCHAR(100) UNIQUE,
        nombre NVARCHAR(255) NOT NULL,
        categoria_id INT REFERENCES Stock_Categorias(id),
        unidad_base NVARCHAR(50) DEFAULT 'unidad',
        variantes_requeridas_json NVARCHAR(MAX) DEFAULT '[]',
        costo_unitario_base DECIMAL(18,2) DEFAULT 0,
        fecha_creacion DATETIME DEFAULT GETDATE()
    );`,

    // Variantes (Hijos)
    `CREATE TABLE Stock_Variantes (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        producto_maestro_id UNIQUEIDENTIFIER REFERENCES Stock_Productos_Maestros(id),
        codigo_variante NVARCHAR(150),
        nombre_variante NVARCHAR(255), 
        metadata_json NVARCHAR(MAX),
        fecha_creacion DATETIME DEFAULT GETDATE()
    );`,

    // Proveedores e Impuestos
    `CREATE TABLE Stock_Proveedores (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        nombre NVARCHAR(200) NOT NULL,
        documento NVARCHAR(100),
        telefono NVARCHAR(100),
        fecha_creacion DATETIME DEFAULT GETDATE()
    );`,

    `CREATE TABLE Stock_TiposFactura (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100)
    );`,

    // Pre cargar Facturas
    `INSERT INTO Stock_TiposFactura (nombre) VALUES ('Factura A'), ('Factura B'), ('Factura C'), ('Comprobante / Remito');`,

    // Compras Transaccional
    `CREATE TABLE Stock_Compras (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        proveedor_id UNIQUEIDENTIFIER REFERENCES Stock_Proveedores(id),
        referencia_factura NVARCHAR(200),
        tipo_factura_id INT REFERENCES Stock_TiposFactura(id),
        total_compra DECIMAL(18,2) NOT NULL DEFAULT 0,
        estado NVARCHAR(50) DEFAULT 'completada',
        fecha_creacion DATETIME DEFAULT GETDATE(),
        creado_por UNIQUEIDENTIFIER -- usuario_id
    );`,

    `CREATE TABLE Stock_Compras_Detalle (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        compra_id UNIQUEIDENTIFIER REFERENCES Stock_Compras(id),
        variante_id UNIQUEIDENTIFIER REFERENCES Stock_Variantes(id),
        cantidad DECIMAL(18,4) NOT NULL,
        precio_unitario DECIMAL(18,2) NOT NULL
    );`,

    // Etiquetas Físicas Operacionales (Tracking unitario por variante y deposito)
    `CREATE TABLE Stock_Etiquetas (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        variante_id UNIQUEIDENTIFIER REFERENCES Stock_Variantes(id),
        deposito_id INT REFERENCES Stock_Depositos(id),
        cantidad_actual DECIMAL(18,4) DEFAULT 0,
        ultima_actualizacion DATETIME DEFAULT GETDATE()
    );`,

    `CREATE TABLE Stock_Movimientos (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        etiqueta_id UNIQUEIDENTIFIER REFERENCES Stock_Etiquetas(id),
        tipo_movimiento NVARCHAR(100), -- 'compra_ingreso', 'traslado', 'consumo'
        cantidad_afectada DECIMAL(18,4),
        deposito_origen_id INT,
        deposito_destino_id INT,
        referencia_compra_id UNIQUEIDENTIFIER, -- null si no es compra
        usuario_id UNIQUEIDENTIFIER,
        fecha DATETIME DEFAULT GETDATE()
    );`
];

async function runQueries() {
    for (const q of queries) {
        console.log("Running:");
        try {
            const r = await fetch('http://3.85.26.173:5005/sql', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ query: q }) 
            });
            const text = await r.text();
            if(!JSON.parse(text).success) {
               console.error("Failed:", text);
            } else {
               console.log("OK!");
            }
        } catch(e) {
            console.error("HTTP Err:", e);
        }
    }
    console.log("NEW DB WMS COMPLETE!");
}

runQueries();
