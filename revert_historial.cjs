const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Revert the fetch function to wms_remitos_internos
const fetchRemitosHistorial = `
  const fetchGlobalHistorial = async () => {
    try {
      const res = await executeAWSQuery(\`
        SELECT TOP 200 r.*, d_origen.nombre as origen_nombre, d_destino.nombre as destino_nombre,
          (SELECT COUNT(*) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_items
        FROM wms_remitos_internos r
        LEFT JOIN Stock_Depositos d_origen ON r.deposito_origen_id = d_origen.id
        LEFT JOIN Stock_Depositos d_destino ON r.deposito_destino_id = d_destino.id
        ORDER BY r.fecha_creacion DESC
      \`);
      setGlobalHistorial(res || []);
      setHistorialLoaded(true);
    } catch (error: any) {
      toast.error('Error cargando historial de remitos: ' + error.message);
    }
  };
`;

code = code.replace(
  /const fetchGlobalHistorial = async \(\) => \{[\s\S]*?toast\.error\('Error cargando historial.*?\}\s*\};/,
  fetchRemitosHistorial.trim()
);

// 2. Revert handleVerHistorialDetalles to fetch wms_remitos_internos_items
const handleVerRemitosDetalles = `
  const handleVerHistorialDetalles = async (rem: any) => {
      try {
          const detailRes = await executeAWSQuery(\`
              SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre 
              FROM wms_remitos_internos_items i
              LEFT JOIN Stock_Variantes v ON i.variante_id = v.id
              LEFT JOIN Stock_Productos_Maestros p ON p.id = v.producto_maestro_id
              WHERE i.remito_id = \${rem.id}
          \`);
          
          setSelectedHistorialRemito({
             cart: detailRes || [],
             origen: rem.origen_nombre || 'WMS Central',
             destino: rem.destino_nombre || 'Destino',
             codigo: rem.numeracion,
             fecha: new Date(rem.fecha_creacion).toLocaleString()
          });
      } catch (err: any) {
          toast.error("Error cargando detalle: " + err.message);
      }
  };
`;

code = code.replace(
  /const handleVerHistorialDetalles = async \(sol: any\) => \{[\s\S]*?toast\.error\("Error cargando detalle: " \+ err\.message\);\s*\}\s*\};/,
  handleVerRemitosDetalles.trim()
);

// 3. Revert the UI mapping back to standard Remitos mapping
const remitosUI = `
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {globalHistorial
                  .filter(r => !historialDate || r.fecha_creacion.startsWith(historialDate))
                  .filter(r => 
                     r.numeracion?.toLowerCase().includes(historialSearch.toLowerCase()) || 
                     r.origen_nombre?.toLowerCase().includes(historialSearch.toLowerCase()) || 
                     r.destino_nombre?.toLowerCase().includes(historialSearch.toLowerCase())
                  ).map(rem => (
                        <div 
                          key={rem.id} 
                          onClick={() => handleVerHistorialDetalles(rem)}
                          className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col justify-between gap-6 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer group"
                        >
                           <div className="flex items-start gap-5">
                               <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                   <PackageCheck className="w-6 h-6" />
                               </div>
                               <div>
                                   <div className="flex items-center gap-2 mb-2">
                                       <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">{rem.numeracion}</span>
                                       <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{new Date(rem.fecha_creacion).toLocaleDateString()}</span>
                                   </div>
                                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-rose-400"/> {rem.origen_nombre}</p>
                                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-indigo-400"/> {rem.destino_nombre}</p>
                               </div>
                           </div>
                           <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                               <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{rem.total_items} Items Trasladados</p>
                               <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full font-black uppercase tracking-widest text-center">{rem.estado}</span>
                           </div>
                        </div>
                ))}
            </div>
`;

code = code.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">[\s\S]*?<\/div>\s*<\/div>\s*\)\}/,
  remitosUI.trim() + '\n         </div>\n      )}'
);

code = code.replace(
  'placeholder="Buscar por código de solicitud o sector destino..."',
  'placeholder="Buscar por código de remito, almacén origen o destino..."'
);

code = code.replace(
  '<History className="w-8 h-8 text-indigo-500" />\n                    Historial de Órdenes Solicitadas',
  '<History className="w-8 h-8 text-indigo-500" />\n                    Historial Global de Remitos'
);


fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
console.log('Done reverting!');
