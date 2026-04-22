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
        const res = await sql.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'wms_remitos_internos_items'");
        console.dir(res.recordset);
        process.exit(0);
    } catch(e) {
        console.error(e);
    }
}
check();
