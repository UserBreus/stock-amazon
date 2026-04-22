import { executeAWSQuery } from './src/lib/aws-client';

const runMigration = async () => {
    try {
        console.log("Iniciando migración de remitos...");
        
        await executeAWSQuery(`
            IF OBJECT_ID('wms_remitos_internos', 'U') IS NULL
            BEGIN
                CREATE TABLE wms_remitos_internos (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    numeracion VARCHAR(50) NOT NULL UNIQUE,
                    deposito_origen_id INT NOT NULL,
                    deposito_destino_id INT NOT NULL,
                    creado_por VARCHAR(50),
                    fecha_creacion DATETIME DEFAULT GETDATE(),
                    estado VARCHAR(50) DEFAULT 'EN_TRANSITO', -- EN_TRANSITO, RECIBIDO, RECIBIDO_CON_OBSERVACION
                    observaciones_generales TEXT
                );
            END
            
            IF OBJECT_ID('wms_remitos_internos_items', 'U') IS NULL
            BEGIN
                CREATE TABLE wms_remitos_internos_items (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    remito_id INT NOT NULL REFERENCES wms_remitos_internos(id) ON DELETE CASCADE,
                    etiqueta_generada_id INT NULL, -- Para lotes o bultos especificos
                    variante_id INT NOT NULL, 
                    cantidad_enviada DECIMAL(18,4) NOT NULL,
                    cantidad_recibida DECIMAL(18,4) NULL,
                    estado VARCHAR(50) DEFAULT 'PENDIENTE' -- PENDIENTE, RECIBIDO_OK, FALTANTE
                );
            END
        `);
        console.log("Tablas base creadas exitosamente.");
        
        // Vamos a alterar Stock_Movimientos para permitir movimientos 'en_transito_salida'
        console.log("Migración completada.");
    } catch(err) {
        console.error("Error en migración:", err);
    }
};

runMigration();
