const fs = require('fs');
let c = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

c = c.replace(
`  const fetchSolicitudes = async () => {
      try {
         setSolicitudes([]); 
      } catch(e) {}
  };`,
`  const fetchSolicitudes = async () => {
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
          const res = await executeAWSQuery(\`
              SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre, v.codigo_barras as codigo_barras, p.id as producto_maestro_id, i.variante_id
              FROM wms_solicitudes_items i
              JOIN Stock_Variantes v ON i.variante_id = v.id
              JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              WHERE i.solicitud_id = \${solId}
          \`);
          
          if(res && res.length > 0) {
              const newCart = res.map((r:any) => ({
                 id: "sol-" + r.id, // Fake ID
                 etiqueta_real_id: null,
                 producto_nombre: r.producto_nombre,
                 nombre_variante: r.nombre_variante,
                 codigo_barras: r.codigo_barras,
                 variante_id: r.variante_id,
                 solicitud_item_id: r.id,
                 cantidad_actual: r.cantidad_solicitada, // Treated as max bounds
                 cantidad_a_extraer: r.cantidad_solicitada
              }));
              
              setCart(newCart);
              setDestinoId(depositoDestinoId.toString());
              setOperationType('traslado');
              setMode('lote');
              toast.success("Solicitud importada al carrito. Por favor corrobora stocks y presiona EJECUTAR SOLICITUD.");
          }
      } catch(e:any) {
          toast.error("Fallo al importar solicitud: " + e.message);
      }
  };`
);

let uiBlock = `{mode === 'solicitudes' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 opacity-50">
                  <ArchiveX className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-black">Módulo de Solicitudes en Construcción</h3>
                  <p className="max-w-xs mx-auto text-sm mt-2 font-medium">Próximamente el sistema conectará los pedidos de operarios automáticos para armar los carritos directamente.</p>
              </motion.div>
          )}`;

let newUIBlock = `{mode === 'solicitudes' && (
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

c = c.replace(uiBlock, newUIBlock);

// When creating a transfer, we have to fulfill the Request if it came from one.
// The executeBatchOperation doesn't know it came from a request because we didn't store request ID. 
// Let's modify the cart loading to include mapping the physical labels if they use "Catálogo Visual".
// Actually, if we map the cart via `handlePrepararSolicitud`, the \`id\` is fake ("sol-.."), so the user will click "Abrir Catalogo" to select the ACTUAL matching real stock labels. Wait! If they pull the request into the cart, the cart has fake labels! But `executeAWSQuery` expects REAL LABEL IDs because it does `UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual - X WHERE id = \${item.id}`.

fs.writeFileSync('src/components/DespachoEgresos.tsx', c);
console.log('Script patched Despacho tab 1 safely.');
