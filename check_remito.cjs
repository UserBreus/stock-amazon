const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.VITE_DB_USER || 'admin',
    password: process.env.VITE_DB_PASSWORD || 'Oeste123456',
    server: process.env.VITE_DB_HOST || 'database-1.cdwyyw0q8yl4.us-east-1.rds.amazonaws.com',
    database: process.env.VITE_DB_NAME || 'OESTE_PROD',
    options: { encrypt: false, trustServerCertificate: true }
};

async function check() {
    try {
        await sql.connect(config);
        const res = await sql.query(`
            SELECT TOP 20 ri.id as remito_id, ri.numeracion, ri.estado as remito_estado, 
                   rii.id as item_id, rii.cantidad_enviada, rii.cantidad_recibida, rii.estado as item_estado
            FROM wms_remitos_internos ri
            JOIN wms_remitos_internos_items rii ON ri.id = rii.remito_id
            WHERE ri.estado IN ('RECIBIDO', 'CANCELADO', 'EN_TRANSITO')
            ORDER BY ri.fecha_creacion DESC
        `);
        console.table(res.recordset);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
