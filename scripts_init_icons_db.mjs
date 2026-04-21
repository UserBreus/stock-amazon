import fs from 'fs';
const url = 'http://3.85.26.173:5005/sql';

async function executeQuery(query) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    return r.json();
}

async function run() {
    const tableSql = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WMS_Sys_Icons' and xtype='U')
    CREATE TABLE WMS_Sys_Icons (
        target_id VARCHAR(100) PRIMARY KEY,
        icon_type VARCHAR(20) NOT NULL, -- 'lucide' or 'svg'
        icon_value VARCHAR(MAX) NOT NULL,
        actualizado_en DATETIME DEFAULT GETDATE()
    );
    `;
    const res = await executeQuery(tableSql);
    console.log("Tabla creada/validada", res);
}
run();
