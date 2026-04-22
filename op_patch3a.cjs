const fs = require('fs');
let c = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

const regexVars = /const \[remitoDetalleItems, setRemitoDetalleItems\] = useState<any\[\]\|null>\(null\);/;
if (c.includes('const [remitoDetalleItems, setRemitoDetalleItems] = useState<any[]|null>(null);') && !c.includes('selectedActiveRemitoId')) {
    c = c.replace(regexVars, `const [remitoDetalleItems, setRemitoDetalleItems] = useState<any[]|null>(null);
  const [selectedActiveRemitoId, setSelectedActiveRemitoId] = useState<string|null>(null);
  const [selectedRemitoEstado, setSelectedRemitoEstado] = useState<string|null>(null);
  const [isReceiving, setIsReceiving] = useState(false);`);
}

const fetchBlock = /const handleVerDetalles = async \(remitoId: string\) => \{[\s\S]*?toast\.error\("Error cargando detalle: " \+ err\.message\);\s*\}\s*\};/m;

const newFetchBlock = `  const handleVerDetalles = async (remitoId: string, estado: string) => {
      setSelectedActiveRemitoId(remitoId);
      setSelectedRemitoEstado(estado);
      try {
          const detailRes = await executeAWSQuery(\`
              SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre 
              FROM wms_remitos_internos_items i
              JOIN Stock_Variantes v ON i.variante_id = v.id
              JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              WHERE i.remito_id = \${remitoId}
          \`);
          if (detailRes) {
              const mapped = detailRes.map((r:any) => ({
                  ...r,
                  edit_cantidad_recibida: estado === 'EN_TRANSITO' ? r.cantidad_enviada : r.cantidad_recibida
              }));
              setRemitoDetalleItems(mapped);
          } else {
              setRemitoDetalleItems([]);
          }
      } catch (err:any) {
          toast.error("Error cargando detalle: " + err.message);
      }
  };

  const handleProcesarRecepcion = async () => {
      if(!remitoDetalleItems || !selectedActiveRemitoId) return;
      
      const invalid = remitoDetalleItems.some(i => i.edit_cantidad_recibida < 0 || i.edit_cantidad_recibida > i.cantidad_enviada);
      if(invalid) return toast.error("No puedes recibir más de lo enviado ni cantidades negativas.");
      
      setIsReceiving(true);
      try {
          let queries = [\`
             DECLARE @RemitoDestino INT = \${sectorSeleccionado};
          \`];
          
          for (let i = 0; i < remitoDetalleItems.length; i++) {
              const item = remitoDetalleItems[i];
              const cantToReceive = Number(item.edit_cantidad_recibida);
              
              if (cantToReceive > 0) {
                  queries.push(\`
                      DECLARE @NuevoLote_\${i} INT;
                      INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, estado)
                      VALUES (CONVERT(varchar(255), NEWID()), \${item.variante_id}, @RemitoDestino, \${cantToReceive}, \${cantToReceive}, 'activo');
                      
                      SET @NuevoLote_\${i} = SCOPE_IDENTITY();
                      
                      INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id)
                      VALUES (@NuevoLote_\${i}, 'traslado_ingreso', \${cantToReceive}, @RemitoDestino);
                      
                      UPDATE wms_remitos_internos_items SET estado = 'RECIBIDO_OK', cantidad_recibida = \${cantToReceive} WHERE id = \${item.id};
                  \`);
              } else {
                  // Received nothing of this line
                  queries.push(\`UPDATE wms_remitos_internos_items SET estado = 'CANCELADO', cantidad_recibida = 0 WHERE id = \${item.id};\`);
              }
          }
          
          queries.push(\`UPDATE wms_remitos_internos SET estado = 'RECIBIDO' WHERE id = \${selectedActiveRemitoId};\`);
          
          await executeAWSQuery(\`BEGIN TRY BEGIN TRANSACTION; \${queries.join('\\n')} COMMIT TRANSACTION; END TRY BEGIN CATCH ROLLBACK TRANSACTION; THROW; END CATCH\`);
          toast.success("Recepción procesada. Etiquetas generadas en su stock físico.");
          setRemitoDetalleItems(null);
          setSelectedActiveRemitoId(null);
          setSelectedRemitoEstado(null);
          fetchDataRelacional();
      } catch (err:any) {
          toast.error("Error al procesar recepción: " + err.message);
      } finally {
          setIsReceiving(true); // Is ok to leave it true? Let's just reset
          setIsReceiving(false);
      }
  };`;

c = c.replace(fetchBlock, newFetchBlock);
fs.writeFileSync('src/pages/InventarioOperativo.tsx', c);
console.log('Done script A');
