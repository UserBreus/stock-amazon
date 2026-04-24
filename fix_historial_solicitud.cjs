const fs = require('fs');

let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Rewrite the fetch function for the global historial
const fetchNewHistorial = `
  const fetchGlobalHistorial = async () => {
    try {
      const res = await executeAWSQuery(\`
        SELECT s.*, d.nombre as sector_nombre,
          (SELECT COUNT(*) FROM wms_solicitudes_items i WHERE i.solicitud_id = s.id) as total_items
        FROM wms_solicitudes s
        LEFT JOIN Stock_Depositos d ON s.deposito_solicitante_id = d.id
        WHERE s.estado = 'APROBADA'
        ORDER BY s.fecha_creacion DESC
      \`);
      setGlobalHistorial(res || []);
      setHistorialLoaded(true);
    } catch (error: any) {
      toast.error('Error cargando historial de solicitudes: ' + error.message);
    }
  };
`;

code = code.replace(
  /const fetchGlobalHistorial = async \(\) => \{[\s\S]*?toast\.error\('Error cargando historial.*?\}\s*\};/,
  fetchNewHistorial.trim()
);

// 2. Rewrite handleVerHistorialDetalles
const newHandleDetalles = `
  const handleVerHistorialDetalles = async (sol: any) => {
      try {
          const detailRes = await executeAWSQuery(\`
              SELECT si.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre 
              FROM wms_solicitudes_items si
              JOIN Stock_Variantes v ON si.variante_id = v.id
              JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              WHERE si.solicitud_id = \${sol.id}
          \`);
          
          // Mapeamos los items para que coincidan con la estructura esperada por el visor PDF de remito
          const mappedItems = (detailRes || []).map((i: any) => ({
             ...i,
             cantidad_enviada: i.cantidad_solicitada // Usamos cantidad_solicitada porque WMS_solicitudes_items no tiene cantidad_enviada nativa como remitos
          }));

          setSelectedHistorialRemito({
             cart: mappedItems,
             origen: 'WMS Central (Aprobado)',
             destino: sol.sector_nombre || 'Destino',
             codigo: sol.numeracion,
             fecha: new Date(sol.fecha_creacion).toLocaleString()
          });
      } catch (err: any) {
          toast.error("Error cargando detalle: " + err.message);
      }
  };
`;

code = code.replace(
  /const handleVerHistorialDetalles = async \(rem: any\) => \{[\s\S]*?toast\.error\("Error cargando detalle: " \+ err\.message\);\s*\}\s*\};/,
  newHandleDetalles.trim()
);


// 3. Rewrite the rendering of the Historial list
const newHistorialUI = `
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {globalHistorial
                  .filter(r => !historialDate || r.fecha_creacion.startsWith(historialDate))
                  .filter(r => 
                     r.numeracion?.toLowerCase().includes(historialSearch.toLowerCase()) || 
                     r.sector_nombre?.toLowerCase().includes(historialSearch.toLowerCase())
                  ).map(sol => (
                        <div 
                          key={sol.id} 
                          onClick={() => handleVerHistorialDetalles(sol)}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 cursor-pointer transition-all overflow-hidden group"
                        >
                          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all">
                                <ClipboardList className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-mono font-black text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{sol.numeracion}</span>
                                  <span className="text-[10px] font-black tracking-widest text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full uppercase shadow-sm">APROBADA</span>
                                </div>
                                <h4 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-emerald-500" />
                                  Destino: {sol.sector_nombre}
                                </h4>
                                <p className="text-sm text-slate-500 mt-0.5">{new Date(sol.fecha_creacion).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                      </div>
                ))}
            </div>
`;

code = code.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">[\s\S]*?<\/div>\s*<\/div>\s*\)\}/,
  newHistorialUI.trim() + '\n         </div>\n      )}'
);

// We need to also fix "que ahi se vean todos los remitos que se procesaron con una barra de busqueda en la parte superior para buscar y un icono de calendario para buscar por fecha"
// We keep the search bars as they are, but update the placeholder text:
code = code.replace(
  'placeholder="Buscar por código de remito, almacén origen o destino..."',
  'placeholder="Buscar por código de solicitud o sector destino..."'
);

code = code.replace(
  '<History className="w-8 h-8 text-indigo-500" />\n                    Historial Global de Remitos',
  '<History className="w-8 h-8 text-indigo-500" />\n                    Historial de Órdenes Solicitadas'
);


fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
console.log('Done!');
