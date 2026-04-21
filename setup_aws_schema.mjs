import fs from 'fs';

async function executeSql(query) {
    try {
        const payload = JSON.stringify({ query });
        const res = await fetch('http://3.85.26.173:5005/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.data;
    } catch (e) {
        console.error("Query failed:", query.substring(0, 50) + "...\n", e);
        throw e;
    }
}

async function setup() {
    const scripts = [
        `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Categorias' AND xtype='U')
        CREATE TABLE Stock_Categorias (
            id INT IDENTITY(1,1) PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL UNIQUE
        );
        `,
        `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Depositos' AND xtype='U')
        CREATE TABLE Stock_Depositos (
            id INT IDENTITY(1,1) PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL UNIQUE,
            tipo VARCHAR(50) DEFAULT 'general' -- 'general', 'mini_sector'
        );
        `,
        // Insert main deposit and a mini sector if not exists
        `
        IF NOT EXISTS (SELECT 1 FROM Stock_Depositos WHERE tipo='general')
        INSERT INTO Stock_Depositos (nombre, tipo) VALUES ('Almacén Principal', 'general');

        IF NOT EXISTS (SELECT 1 FROM Stock_Depositos WHERE tipo='mini_sector')
        INSERT INTO Stock_Depositos (nombre, tipo) VALUES ('Mini Sector Fabricación A', 'mini_sector');
        `,
        `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Productos' AND xtype='U')
        CREATE TABLE Stock_Productos (
            id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            sku VARCHAR(50),
            costo DECIMAL(18,2) DEFAULT 0,
            moneda VARCHAR(10) DEFAULT 'USD',
            unidad VARCHAR(50),
            categoria_id INT REFERENCES Stock_Categorias(id),
            fecha_creacion DATETIME DEFAULT GETDATE()
        );
        `,
        `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Etiquetas' AND xtype='U')
        CREATE TABLE Stock_Etiquetas (
            id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
            producto_id UNIQUEIDENTIFIER REFERENCES Stock_Productos(id),
            deposito_id INT REFERENCES Stock_Depositos(id),
            codigo_barras VARCHAR(255) UNIQUE NOT NULL,
            cantidad_inicial INT DEFAULT 0,
            cantidad_actual INT DEFAULT 0,
            estado VARCHAR(50) DEFAULT 'activo', -- 'activo', 'consumido'
            fecha_impresion DATETIME DEFAULT GETDATE()
        );
        `,
        `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Movimientos' AND xtype='U')
        CREATE TABLE Stock_Movimientos (
            id INT IDENTITY(1,1) PRIMARY KEY,
            etiqueta_id UNIQUEIDENTIFIER REFERENCES Stock_Etiquetas(id),
            deposito_origen_id INT NULL REFERENCES Stock_Depositos(id),
            deposito_destino_id INT NULL REFERENCES Stock_Depositos(id),
            cantidad_afectada INT NOT NULL,
            tipo_movimiento VARCHAR(50) NOT NULL, -- 'creacion', 'consumo', 'transferencia_sector'
            usuario_id VARCHAR(50),
            fecha DATETIME DEFAULT GETDATE()
        );
        `,
        // Views for mathematical calculations directly from DB
        `
        IF EXISTS(select * FROM sys.views where name = 'Vista_Capital_Activo')
           DROP VIEW Vista_Capital_Activo;
        `,
        `
        CREATE VIEW Vista_Capital_Activo AS
        SELECT 
            p.moneda,
            SUM(p.costo * e.cantidad_actual) as capital_total,
            COUNT(DISTINCT p.id) as cantidad_items
        FROM Stock_Productos p
        INNER JOIN Stock_Etiquetas e ON p.id = e.producto_id
        WHERE e.estado = 'activo' AND e.cantidad_actual > 0
        GROUP BY p.moneda;
        `,
        `
        IF EXISTS(select * FROM sys.views where name = 'Vista_Stock_Actual')
           DROP VIEW Vista_Stock_Actual;
        `,
        `
        CREATE VIEW Vista_Stock_Actual AS
        SELECT 
            c.id as categoria_id,
            c.nombre as categoria_nombre,
            p.id as producto_id,
            p.nombre as producto_nombre,
            p.costo,
            p.moneda,
            d.nombre as deposito_nombre,
            d.tipo as deposito_tipo,
            SUM(e.cantidad_actual) as cantidad_total,
            COUNT(e.id) as variaciones_etiquetas
        FROM Stock_Productos p
        INNER JOIN Stock_Categorias c ON p.categoria_id = c.id
        LEFT JOIN Stock_Etiquetas e ON p.id = e.producto_id AND e.estado = 'activo'
        LEFT JOIN Stock_Depositos d ON e.deposito_id = d.id
        GROUP BY c.id, c.nombre, p.id, p.nombre, p.costo, p.moneda, d.nombre, d.tipo;
        `,
        // Updates to user roles
        `
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE rol='administrativo_stock')
        INSERT INTO usuarios (id, pass, rol, nombre_completo, cedula) VALUES ('AdminStock', 'admin123', 'administrativo_stock', 'Administrador General', '00000000');
        
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE rol='operario_stock')
        INSERT INTO usuarios (id, pass, rol, nombre_completo, cedula) VALUES ('OpeStock', 'ope123', 'operario_stock', 'Operario Deposito', '11111111');
        `
    ];

    console.log("Installing database structure...");
    for (let script of scripts) {
        if(script.trim()) {
            await executeSql(script);
            console.log("Executed block.");
        }
    }
    console.log("Schema setup complete.");
}

setup();
