const fs = require('fs');
let c = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

const regexFunc = /const fetchSolicitudes = async \(\) => \{[\s\S]*?catch\(e\) \{\}\s*\};/;

const newFunc = `const fetchSolicitudes = async () => {
      try {
         const res = await executeAWSQuery(\`
             SELECT s.*, d.nombre as solicitante_nombre 
             FROM wms_solicitudes s
             INNER JOIN Stock_Depositos d ON s.deposito_solicitante_id = d.id
             WHERE s.estado = 'PENDIENTE'
             ORDER BY s.fecha_creacion ASC
         \`);
         setSolicitudes(res || []);
      } catch(e) {
         toast.error("Error cargando solicitudes pendientes");
      }
  };

  const handlePrepararSolicitud = async (solId: string, depositoDestinoId: string) => {
      try {
          if(!origenId) { toast.error("Seleccione su Deposito Origen (desde donde sale el stock)"); return; }
          
          const res = await executeAWSQuery(\`SELECT variante_id, cantidad_solicitada FROM wms_solicitudes_items WHERE solicitud_id = \${solId}\`);
          if(res && res.length > 0) {
              let tempCart = [];
              let incomplete = false;
              
              for (const req of res) {
                 const stockRes = await executeAWSQuery(\`
                     SELECT e.*, v.nombre_variante, pm.nombre as producto_nombre, d.nombre as deposito_nombre
                     FROM Stock_Etiquetas e
                     INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                     INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
                     INNER JOIN Stock_Depositos d ON e.deposito_id = d.id
                     WHERE e.deposito_id = \${origenId} AND e.variante_id = \${req.variante_id} AND e.cantidad_actual > 0 AND (e.estado = 'activo' OR e.estado IS NULL)
                     ORDER BY e.idASC
                 \`);
                 // FIX idASC to id ASC
                 
                 let qtyNeeded = req.cantidad_solicitada;
                 if (!stockRes || stockRes.length === 0) { incomplete = true; continue; }
                 
                 for (const st of stockRes) {
                     if (qtyNeeded <= 0) break;
                     const take = Math.min(st.cantidad_actual, qtyNeeded);
                     tempCart.push({ ...st, cantidad_a_extraer: take, origin_req_id: solId });
                     qtyNeeded -= take;
                 }
                 if (qtyNeeded > 0) {
                     incomplete = true;
                 }
              }
              
              setCart(tempCart);
              setDestinoId(depositoDestinoId.toString());
              setOperationType('traslado');
              setMode('lote');
              
              if (incomplete) {
                  toast.error("El pedido fue importado parcialmente porque no posees stock físico suficiente para todos los ítems.");
              } else {
                  toast.success("Solicitud importada y lotes asignados automáticamente FIFO listos para despachar.");
              }
          }
      } catch(e:any) {
          toast.error("Fallo al importar solicitud: " + e.message);
      }
  };`;

// Also fix UI
const regexUI = /\{mode === 'solicitudes' && \([\s\S]*?<ArchiveX[\s\S]*?<\/motion\.div>\s*\)\}/;

const newUIBlock = `{mode === 'solicitudes' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-lg flex items-center gap-2"><Send className="w-5 h-5 text-indigo-500" /> Cola de Reposiciones Solicitadas ({solicitudes.length})</h3>
                      <button onClick={fetchSolicitudes} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full hover:bg-slate-200 transition">Recargar Cola</button>
                  </div>
                  
                  {solicitudes.length === 0 ? (
                      <div className="text-center py-20 opacity-50">
                          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
                          <h3 className="text-2xl font-black">Todo al día</h3>
                          <p className="max-w-xs mx-auto text-sm mt-2 font-medium">No hay ninguna solicitud de reposición pendiente desde los sectores operativos.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {solicitudes.map(s => (
                              <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                                  <div className="flex justify-between items-start mb-4">
                                      <div>
                                          <h4 className="font-black text-xl">{s.solicitante_nombre}</h4>
                                          <p className="font-mono text-sm text-slate-500">{s.numeracion}</p>
                                      </div>
                                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-black text-[10px] uppercase px-3 py-1 rounded-lg">A la espera</span>
                                  </div>
                                  <p className="text-xs font-medium text-slate-500 mb-6 flex items-center gap-2"><Clock className="w-4 h-4" /> Solicitado: {new Date(s.fecha_creacion).toLocaleString()}</p>
                                  
                                  <button onClick={() => handlePrepararSolicitud(s.id, s.deposito_solicitante_id)} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white transition group">
                                     EMPAQUETAR PEDIDO <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </motion.div>
          )}`;

c = c.replace(regexFunc, newFunc.replace('ORDER BY e.idASC', 'ORDER BY e.id ASC'));
c = c.replace(regexUI, newUIBlock);

fs.writeFileSync('src/components/DespachoEgresos.tsx', c);
console.log('Fixed functionality via regex');
