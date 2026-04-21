import fs from 'fs';
const url = 'http://3.85.26.173:5005/sql';

async function executeQuery(query) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    return r.json();
}

async function run() {
    const tableSql = `
    IF OBJECT_ID('wms_sys_ui_config', 'U') IS NULL
    BEGIN
        CREATE TABLE wms_sys_ui_config (
            component_id VARCHAR(100) PRIMARY KEY,
            group_area VARCHAR(50) NOT NULL, -- e.g., 'dashboard', 'sistema_hub', 'sidebar'
            label VARCHAR(255) NOT NULL,
            sub_label VARCHAR(500),          -- text below the title
            icon_type VARCHAR(20) DEFAULT 'lucide', -- 'lucide' or 'svg'
            icon_value VARCHAR(MAX) NOT NULL,
            icon_color VARCHAR(50) DEFAULT 'text-blue-500',
            bg_color VARCHAR(50) DEFAULT 'bg-blue-50',
            order_index INT DEFAULT 0,
            actualizado_en DATETIME DEFAULT GETDATE()
        );
        -- INITIAL DATA MIGRATION FOR EXISTING DEFAULTS (Hub Dashboard)
        INSERT INTO wms_sys_ui_config (component_id, group_area, label, sub_label, icon_value, icon_color, bg_color, order_index) VALUES
        ('btn_ingreso_stock', 'dashboard', 'Ingresar Stock', 'Registrar nueva mercadería al sistema WMS mediante escaneo o compra.', 'ArrowDownToLine', 'text-blue-600', 'bg-blue-50', 1),
        ('btn_traslado_stock', 'dashboard', 'Trasladar', 'Mover artículos entre diferentes sectores y almacenes físicos.', 'ArrowRightLeft', 'text-purple-600', 'bg-purple-50', 2),
        ('btn_retiro_stock', 'dashboard', 'Retirar Stock', 'Registrar ventas, consumos libres, mermas o salidas definitivas del patrimonio.', 'ArrowUpFromLine', 'text-orange-600', 'bg-orange-50', 3),
        ('btn_etiquetas_stock', 'dashboard', 'Etiquetas', 'Catálogo maestro para impresión o reimpresión de códigos de barras sueltos.', 'ScanBarcode', 'text-slate-600', 'bg-slate-100', 4);

        -- INITIAL DATA MIGRATION FOR EXISTING DEFAULTS (Gestión de Sistema)
        INSERT INTO wms_sys_ui_config (component_id, group_area, label, sub_label, icon_value, icon_color, bg_color, order_index) VALUES
        ('btn_sys_maestros', 'sistema', 'Artículos Maestros', 'Crea las matrices principales de cada producto de tu catálogo.', 'Network', 'text-blue-600', 'bg-blue-50', 1),
        ('btn_sys_variantes', 'sistema', 'Variantes (SKU)', 'Generador de matrices. Multiplica artículos por Talle/Color/etc.', 'Box', 'text-purple-600', 'bg-purple-50', 2),
        ('btn_sys_rasgos', 'sistema', 'Rasgos y Atributos', 'Diccionario de combinaciones usadas para armar Variantes.', 'Tag', 'text-indigo-600', 'bg-indigo-50', 3),
        ('btn_sys_familias', 'sistema', 'Familias', 'Categorías o agrupadores globales para estadística y orden.', 'Layers', 'text-emerald-600', 'bg-emerald-50', 4),
        ('btn_sys_proveedores', 'sistema', 'Proveedores', 'Directorio de importadores y fabricantes.', 'Truck', 'text-amber-600', 'bg-amber-50', 5),
        ('btn_sys_rindes', 'sistema', 'Rendimientos WMS', 'Matemática de equivalencias (Kilos a Metros Lineales).', 'Activity', 'text-teal-600', 'bg-teal-50', 6),
        ('btn_sys_icons', 'sistema', 'Gestor de Interfaz & Iconos', 'Alteración dinámica del motor visual WMS.', 'Palette', 'text-slate-300', 'bg-slate-800', 7);
    END
    `;
    const res = await executeQuery(tableSql);
    console.log("Tabla de Componentes Visuales creada", res);
}
run();
