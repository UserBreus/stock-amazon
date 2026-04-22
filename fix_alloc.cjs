const fs = require('fs');
let c = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

const regex = /const handlePrepararSolicitud = async \(solId: string, depositoDestinoId: string\) => \{([\s\S]*?)catch\(e:any\) \{([\s\S]*?)\}/m;

const newBlock = `const handlePrepararSolicitud = async (solId: string, depositoDestinoId: string) => {
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
                     ORDER BY e.id ASC
                 \`);
                 
                 let qtyNeeded = req.cantidad_solicitada;
                 if (!stockRes || stockRes.length === 0) { incomplete = true; continue; }
                 
                 for (const st of stockRes) {
                     if (qtyNeeded <= 0) break;
                     const take = Math.min(st.cantidad_actual, qtyNeeded);
                     // Solicitud vinculada is attached to track it upon execute
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
  };`

if(c.includes('const handlePrepararSolicitud = async (solId: string, depositoDestinoId: string) => {')) {
    // Actually the regex is easier to just substring matching the old function.
    let startIdx = c.indexOf('const handlePrepararSolicitud = async (solId: string, depositoDestinoId: string) => {');
    let endIdx = c.indexOf('};', c.indexOf('toast.error("Fallo al importar solicitud: " + e.message);', startIdx)) + 2;
    c = c.substring(0, startIdx) + newBlock + c.substring(endIdx);
    fs.writeFileSync('src/components/DespachoEgresos.tsx', c);
    console.log('Fixed auto allocate');
} else { console.log('not found'); }
