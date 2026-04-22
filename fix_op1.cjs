const fs = require('fs');
const file = 'src/pages/InventarioOperativo.tsx';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('remitosHistoricos')) {
   // 1. Add states
   c = c.replace('const [remitosPendientes, setRemitosPendientes] = useState<any[]>([]);',
                 "const [remitosPendientes, setRemitosPendientes] = useState<any[]>([]);\n  const [remitosHistoricos, setRemitosHistoricos] = useState<any[]>([]);\n  const [remitoDetalleItems, setRemitoDetalleItems] = useState<any[]|null>(null);");

   // 2. Fetch history
   c = c.replace(`const [etiqRes, remitosRes] = await Promise.all([`,
                 `const [etiqRes, remitosRes, historialRes] = await Promise.all([`);
                 
   c = c.replace(`executeAWSQuery(\`
          SELECT r.*, d_origen.nombre as origen_nombre, 
            (SELECT COUNT(*) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_items
          FROM wms_remitos_internos r
          LEFT JOIN Stock_Depositos d_origen ON r.deposito_origen_id = d_origen.id
          WHERE r.deposito_destino_id = \${sectorSeleccionado} AND r.estado = 'EN_TRANSITO'
          ORDER BY r.fecha_creacion ASC
        \`)
      ]);`,
`executeAWSQuery(\`
          SELECT r.*, d_origen.nombre as origen_nombre, 
            (SELECT COUNT(*) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_items
          FROM wms_remitos_internos r
          LEFT JOIN Stock_Depositos d_origen ON r.deposito_origen_id = d_origen.id
          WHERE r.deposito_destino_id = \${sectorSeleccionado} AND r.estado = 'EN_TRANSITO'
          ORDER BY r.fecha_creacion ASC
        \`),
        executeAWSQuery(\`
          SELECT TOP 50 r.*, d_origen.nombre as origen_nombre, 
            (SELECT COUNT(*) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_items
          FROM wms_remitos_internos r
          LEFT JOIN Stock_Depositos d_origen ON r.deposito_origen_id = d_origen.id
          WHERE r.deposito_destino_id = \${sectorSeleccionado} AND r.estado = 'RECIBIDO'
          ORDER BY r.fecha_creacion DESC
        \`)
      ]);`);
      
   c = c.replace(`setRemitosPendientes(remitosRes || []);`,
                 `setRemitosPendientes(remitosRes || []);\n      setRemitosHistoricos(historialRes || []);`);

   // 3. Add function to view details
   c = c.replace(`if(loading)`,
`
  const handleVerDetalles = async (remitoId: string) => {
      try {
          const detailRes = await executeAWSQuery(\`
              SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre 
              FROM wms_remitos_internos_items i
              JOIN Stock_Variantes v ON i.variante_id = v.id
              JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              WHERE i.remito_id = \${remitoId}
          \`);
          setRemitoDetalleItems(detailRes || []);
      } catch (err:any) {
          toast.error("Error cargando detalle: " + err.message);
      }
  };

  if(loading)`);

   // 4. Expose the tab
   c = c.replace(`{ id: 'recepcion', label: 'Remitos Entrantes', count: remitosPendientes.length, alert: remitosPendientes.length > 0 }`,
                 `{ id: 'recepcion', label: 'Remitos Entrantes', count: remitosPendientes.length, alert: remitosPendientes.length > 0 },
          { id: 'historial', label: 'Remitos Recibidos', count: remitosHistoricos.length }`);

   // 5. Build Modal & Replace old Recepcion rendering to just map similar blocks
   // Since the user wants to "abrir", I'll add "Ver Detalles" to the existing remitos too.
   c = c.replace(/<button[^>]+onClick=\{\(\) => handleRecibirRemitoEntero\(rem\.id\)\}[^>]+>\s*Ingresar Stock\s*<\/button>/g,
                   `$&
                              <button onClick={() => handleVerDetalles(rem.id)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">Ver Detalles</button>`);

   // In case the replace above doesn't match perfectly, let's inject it into the map
   // The map looks like: `remitosPendientes.map(rem => (` ... \`Ingresar Stock</button></div>\`)
}

fs.writeFileSync(file, c);
console.log('Phase 1 done');
