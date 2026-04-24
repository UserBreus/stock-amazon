const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. UPDATE BUTTON ALARMA
const oldButton = `<button onClick={() => setPanelView('solicitudes')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-emerald-200 dark:border-slate-800 dark:hover:border-emerald-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <Send className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Órdenes Solicitadas</h3>
                   <p className="text-slate-500 font-medium text-sm">Aprobar, gestionar origen logístico y descontar envíos pedidos por otros sectores.</p>
                </div>
            </button>`;

const newButton = `<button onClick={() => setPanelView('solicitudes')} className={"relative bg-white dark:bg-slate-900 border-2 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl " + (solicitudes.length > 0 ? "border-rose-400 dark:border-rose-500/50 shadow-rose-500/10 hover:shadow-rose-500/20" : "border-slate-100 hover:border-emerald-200 dark:border-slate-800 dark:hover:border-emerald-900 hover:shadow-emerald-500/5")}>
                {solicitudes.length > 0 && (
                   <span className="absolute top-4 right-4 bg-rose-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg shadow-rose-500/40 animate-pulse border-2 border-white dark:border-slate-900 z-10 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4"/> {solicitudes.length} PENDIENTES
                   </span>
                )}
                <div className={"p-4 rounded-2xl group-hover:scale-110 transition-transform " + (solicitudes.length > 0 ? "bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400")}>
                   <Send className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Órdenes Solicitadas</h3>
                   <p className="text-slate-500 font-medium text-sm">Aprobar, gestionar origen logístico y descontar envíos pedidos por otros sectores.</p>
                </div>
            </button>`;

if (code.includes('NUEVO BOTON SOLICITUDES EN PANEL') && !code.includes('border-rose-400')) {
    code = code.replace(oldButton, newButton);
}

// 2. FETCH HISTORIAL SQL: change COUNT to SUM, add UUID
const oldSQL1 = `SELECT TOP 200 r.*, d_origen.nombre as origen_nombre, d_destino.nombre as destino_nombre,
          (SELECT COUNT(*) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_items
        FROM wms_remitos_internos r`;
const newSQL1 = `SELECT TOP 200 r.*, d_origen.nombre as origen_nombre, d_destino.nombre as destino_nombre, u.nombre as usuario_emisor,
          (SELECT SUM(cantidad_enviada) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_unidades
        FROM wms_remitos_internos r
        LEFT JOIN Usuarios u ON r.creado_por = u.id`;

if (code.includes('SELECT COUNT(*) FROM wms_remitos_internos_items')) {
    code = code.replace(oldSQL1, newSQL1);
}

// 3. Modifying handleVerHistorialDetalles SQL
const oldSQL2 = `SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre 
              FROM wms_remitos_internos_items i
              JOIN Stock_Variantes v ON i.variante_id = v.id
              JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              WHERE i.remito_id = \${rem.id}`;
const newSQL2 = `SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre, e.codigo_barras
              FROM wms_remitos_internos_items i
              JOIN Stock_Variantes v ON i.variante_id = v.id
              JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              LEFT JOIN Stock_Etiquetas e ON i.etiqueta_generada_id = e.id
              WHERE i.remito_id = \${rem.id}`;

if (code.includes('SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre')) {
    code = code.replace(oldSQL2, newSQL2);
}

// 4. Modifying Card text
const oldCardTxt = `<p className="text-xs font-black text-slate-500 uppercase tracking-widest">{rem.total_items} Items Trasladados</p>`;
const newCardTxt = `<div>
                                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{rem.total_unidades || 0} Unidades Físicas</p>
                                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Resp: {rem.usuario_emisor || rem.creado_por || 'Sistema'}</p>
                               </div>`;
if (code.includes(oldCardTxt)) {
    code = code.replace(oldCardTxt, newCardTxt);
}

// 5. Update Historical Remito PDF Viewer UI to add barcode column
const oldPDF = `<table className="w-full text-left bg-slate-50 border rounded-xl border-collapse">
                            <thead><tr className="border-b"><th className="py-2 px-3 text-[10px] bg-white border-r">Cant.</th><th className="py-2 px-3 text-[10px] bg-white">Artículo</th></tr></thead>
                            <tbody className="divide-y">
                                {pageItems.map((c:any, idx:number)=>(
                                   <tr key={idx} className="bg-white"><td className="py-2 px-3 border-r font-black text-center">{c.cantidad_a_extraer || c.cantidad_enviada}</td><td className="py-2 px-3 font-bold">{c.producto_nombre} <span className="text-[10px] bg-slate-100 font-normal px-2 ml-2 rounded">{c.nombre_variante}</span></td></tr>
                                ))}
                            </tbody>
                        </table>`;
const newPDF = `<table className="w-full text-left bg-white border border-slate-200 rounded-xl border-collapse">
                            <thead><tr className="border-b"><th className="py-2 px-3 text-[10px] border-r">Cantidad</th><th className="py-2 px-3 text-[10px] border-r">Lotes (Multi-Secuencia)</th><th className="py-2 px-3 text-[10px]">Artículo</th></tr></thead>
                            <tbody className="divide-y">
                                {pageItems.map((c:any, idx:number)=>(
                                   <tr key={idx} className="bg-white"><td className="py-2 px-3 border-r font-black text-center">{c.cantidad_a_extraer || c.cantidad_enviada}</td><td className="py-2 px-3 border-r font-mono text-xs text-slate-500">{c.codigo_barras || 'N/A'}</td><td className="py-2 px-3 font-bold">{c.producto_nombre} <span className="text-[10px] font-normal px-2 ml-2 rounded bg-slate-100">{c.nombre_variante}</span></td></tr>
                                ))}
                            </tbody>
                        </table>`;
if (code.includes('th className="py-2 px-3 text-[10px] bg-white border-r">Cant.</th>')) {
    code = code.replace(oldPDF, newPDF);
}

fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
console.log('Script done');
