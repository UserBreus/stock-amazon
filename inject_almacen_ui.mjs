import fs from 'fs';
const url = 'http://3.85.26.173:5005/sql';

async function executeQuery(query) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    return r.json();
}

async function run() {
    const query = `
    IF NOT EXISTS (SELECT 1 FROM wms_sys_ui_config WHERE component_id = 'btn_sys_almacenes')
    BEGIN
        INSERT INTO wms_sys_ui_config (component_id, group_area, label, sub_label, icon_value, icon_color, bg_color, order_index) 
        VALUES ('btn_sys_almacenes', 'sistema', 'Almacenes y Sectores', 'Locaciones físicas o lógicas. Configuración de depositos de stock.', 'ArchiveRestore', 'text-rose-600', 'bg-rose-50', 6);
    END
    `;
    const res = await executeQuery(query);
    console.log("Insert btn_sys_almacenes:", res);
}
run();
