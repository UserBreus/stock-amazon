const fs = require('fs');
let code = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

// 1. processBarcodeCart modification
code = code.replace(
  /setCart\(\[\{\.\.\.etq, cantidad_a_extraer: etq.cantidad_actual\}, \.\.\.cart\]\);/g,
  'setCart([{...etq, isBulk: false, cantidad_a_extraer: etq.cantidad_actual}, ...cart]);'
);

const catalogOldString = `  const handleCatalogSelection = async (varianteId: string) => {\r\n      setLoadingCode(true);\r\n      try {\r\n          const res = await executeAWSQuery(\`\r\n              SELECT TOP 1 e.*, v.nombre_variante, pm.nombre as producto_nombre, d.nombre as deposito_nombre\r\n              FROM Stock_Etiquetas e\r\n              INNER JOIN Stock_Variantes v ON e.variante_id = v.id\r\n              INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id\r\n              LEFT JOIN Stock_Depositos d ON e.deposito_id = d.id\r\n              WHERE e.variante_id = \${varianteId} AND e.deposito_id = \${origenId} AND e.cantidad_actual > 0\r\n              ORDER BY e.id ASC\r\n          \`);\r\n          if(res && res.length > 0) {\r\n              const etq = res[0];\r\n              if (cart.find(c => c.id === etq.id)) {\r\n                 toast.error("La etiqueta física detectada de este producto ya está en la bandeja.");\r\n              } else {\r\n                 setCart([{...etq, cantidad_a_extraer: etq.cantidad_actual}, ...cart]);\r\n                 toast.success("Producto agregado desde inventario físico");\r\n              }\r\n          } else {\r\n              toast.error("No hay etiquetas físicas disponibles de este producto.");\r\n          }\r\n      } catch(e: any) {\r\n          toast.error("Fallo al obtener etiqueta física: " + e.message);\r\n      } finally {\r\n          setLoadingCode(false);\r\n      }\r\n  };`;

const catOldLinux = catalogOldString.replace(/\r\n/g, '\n');

const catalogNew = `  const handleCatalogSelection = async (varianteId: string) => {
      setLoadingCode(true);
      try {
          const res = await executeAWSQuery(\`
              SELECT v.id as variante_id, v.nombre_variante, pm.nombre as producto_nombre, d.nombre as deposito_nombre,
                     SUM(e.cantidad_actual) as cantidad_total
              FROM Stock_Variantes v
              INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
              INNER JOIN Stock_Etiquetas e ON e.variante_id = v.id
              LEFT JOIN Stock_Depositos d ON e.deposito_id = d.id
              WHERE e.variante_id = \${varianteId} AND e.deposito_id = \${origenId} AND e.cantidad_actual > 0 AND e.estado = 'activo'
              GROUP BY v.id, v.nombre_variante, pm.nombre, d.nombre
          \`);
          if(res && res.length > 0) {
              const bulkItem = res[0];
              const existingIndex = cart.findIndex(c => c.isBulk && c.variante_id === bulkItem.variante_id);
              if (existingIndex > -1) {
                 toast.error("Este producto ya está en el nivel de volumen del carrito.");
              } else {
                 setCart([{
                    id: 'BULK_' + bulkItem.variante_id,
                    isBulk: true,
                    variante_id: bulkItem.variante_id,
                    codigo_barras: 'GRANEL-AUTO',
                    producto_nombre: bulkItem.producto_nombre,
                    nombre_variante: bulkItem.nombre_variante,
                    cantidad_actual: bulkItem.cantidad_total,
                    cantidad_a_extraer: bulkItem.cantidad_total,
                    deposito_id: origenId
                 }, ...cart]);
                 toast.success("Volumen de producto agregado al carrito");
              }
          } else {
              toast.error("No hay stock físico activo disponible de este producto.");
          }
      } catch(e: any) {
          toast.error("Fallo al obtener stock físico: " + e.message);
      } finally {
          setLoadingCode(false);
      }
  };`;

let step2 = code.replace(catOldLinux, catalogNew);
if(step2 === code) { step2 = code.replace(catalogOldString, catalogNew); }
code = step2;

const executeNew = `  const executeBatchOperation = async () => {
      if(cart.length === 0) return toast.error("La bandeja está vacía.");
      if(!origenId) return toast.error("Seleccione un Origen Logístico.");
      if(operationType === 'traslado' && !destinoId) return toast.error("Para traslados, seleccione el destino.");
      if(cart.some(c => c.cantidad_a_extraer <= 0 || c.cantidad_a_extraer > c.cantidad_actual)) return toast.error("Verifique las cantidades.");

      setIsExecuting(true);
      try {
          const isTransfer = operationType === 'traslado';
          let queries = [];
          
          let remitoId = 'NULL';
          if (isTransfer) {
              const remitoCode = 'REM-' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100).toString();
              const destClean = Number(destinoId);
              queries.push(\`
                  INSERT INTO wms_remitos_internos (codigo_remito, destino_id, usuario_id) 
                  VALUES ('\${remitoCode}', \${destClean}, '\${(user as any)?.id || ''}');
                  DECLARE @RemId INT = SCOPE_IDENTITY();
              \`);
              remitoId = '@RemId';
          } else {
              queries.push("DECLARE @RemId INT = NULL;");
          }

          let labelsToPrint: any[] = [];
          const opNameOut = isTransfer ? 'traslado_salida' : 'egreso_final';
          const origenFijoSQL = origenId; 
          let queryVarCounter = 0;

          const pushQueriesForLot = (loteId: number, loteCodigo: string, allocQty: number, initialLoteQty: number, info: any) => {
              if (allocQty === initialLoteQty) {
                  if (isTransfer) {
                      queries.push(\`
                          UPDATE Stock_Etiquetas SET deposito_id = \${destinoId} WHERE id = \${loteId};
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                          VALUES (\${loteId}, '\${opNameOut}', \${allocQty}, \${origenFijoSQL}, \${destinoId}, @RemId, '\${(user as any)?.id || ''}');
                      \`);
                  } else {
                      queries.push(\`
                          UPDATE Stock_Etiquetas SET cantidad_actual = 0, estado = 'consumido' WHERE id = \${loteId};
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, remito_id, usuario_id)
                          VALUES (\${loteId}, '\${opNameOut}', \${allocQty}, \${origenFijoSQL}, @RemId, '\${(user as any)?.id || ''}');
                      \`);
                  }
              } else {
                  queries.push(\`UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual - \${allocQty} WHERE id = \${loteId};\`);
                  if (isTransfer) {
                      const newCode = \`\${loteCodigo}-S\${Math.floor(Math.random()*999)}\`;
                      labelsToPrint.push({ codigo_barras: newCode, producto_nombre: info.producto_nombre, nombre_variante: info.nombre_variante, cantidad_actual: allocQty });
                      queryVarCounter++;
                      queries.push(\`
                          DECLARE @NewLote_\${queryVarCounter} INT;
                          INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, estado)
                          VALUES ('\${newCode}', \${info.variante_id}, \${destinoId}, \${allocQty}, \${allocQty}, 'activo');
                          SET @NewLote_\${queryVarCounter} = SCOPE_IDENTITY();
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                          VALUES (@NewLote_\${queryVarCounter}, 'fraccionamiento_ingreso', \${allocQty}, \${origenFijoSQL}, \${destinoId}, @RemId, '\${(user as any)?.id || ''}');
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                          VALUES (\${loteId}, 'fraccionamiento_salida', \${allocQty}, \${origenFijoSQL}, \${destinoId}, @RemId, '\${(user as any)?.id || ''}');
                      \`);
                  } else {
                      queries.push(\`
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, remito_id, usuario_id)
                          VALUES (\${loteId}, '\${opNameOut}', \${allocQty}, \${origenFijoSQL}, @RemId, '\${(user as any)?.id || ''}');
                      \`);
                  }
              }
          };

          const bulkVariants = cart.filter(c => c.isBulk).map(c => c.variante_id);
          let allBulkLabels: any[] = [];
          if (bulkVariants.length > 0) {
              const bRes = await executeAWSQuery(\`
                 SELECT id, variante_id, cantidad_actual, codigo_barras 
                 FROM Stock_Etiquetas 
                 WHERE variante_id IN (\${bulkVariants.join(',')}) AND deposito_id = \${origenId} AND cantidad_actual > 0 AND estado = 'activo'
                 ORDER BY fecha_creacion ASC
              \`);
              if(bRes) allBulkLabels = bRes;
          }
          const manuallyScannedIds = cart.filter(c => !c.isBulk).map(c => c.id);

          for (let i = 0; i < cart.length; i++) {
              const item = cart[i];
              if (!item.isBulk) {
                  pushQueriesForLot(Number(item.id), item.codigo_barras, item.cantidad_a_extraer, item.cantidad_actual, item);
              } else {
                  let reqQty = item.cantidad_a_extraer;
                  let myLabels = allBulkLabels.filter(l => l.variante_id === item.variante_id && !manuallyScannedIds.includes(l.id));
                  
                  let bestFit = myLabels.find(l => l.cantidad_actual === reqQty);
                  if (bestFit) {
                      pushQueriesForLot(bestFit.id, bestFit.codigo_barras, reqQty, bestFit.cantidad_actual, item);
                      bestFit.cantidad_actual -= reqQty; 
                      reqQty = 0;
                  } else {
                      for (let lb of myLabels) {
                          if (reqQty <= 0) break;
                          if (lb.cantidad_actual <= 0) continue; 
                          
                          let draw = Math.min(lb.cantidad_actual, reqQty);
                          pushQueriesForLot(lb.id, lb.codigo_barras, draw, lb.cantidad_actual, item);
                          lb.cantidad_actual -= draw;
                          reqQty -= draw;
                      }
                  }

                  if (reqQty > 0) {
                     throw new Error(\`Inconsistencia: No hay suficiente stock físico libre no-escaneado para completar la orden granel de \${item.producto_nombre}.\`);
                  }
              }
          }

          if (isTransfer) { queries.push(\`SELECT codigo_remito as rem_code FROM wms_remitos_internos WHERE id = @RemId;\`); }

          const executeRes = await executeAWSQuery(\`BEGIN TRY BEGIN TRANSACTION; \${queries.join('\\n')} COMMIT TRANSACTION; END TRY BEGIN CATCH ROLLBACK TRANSACTION; THROW; END CATCH\`);

          if (isTransfer) {
             setRemitoPDFInfo({ cart: [...cart], destino: depositos.find(d => d.id.toString() === destinoId)?.nombre || 'Ubicación', codigo: executeRes?.[0]?.rem_code || 'REM-0000', fecha: new Date().toLocaleString(), nuevasEtiquetas: labelsToPrint });
          }
          setCart([]);
          toast.success("Operación ejecutada con éxito.");
      } catch (err: any) {
          toast.error("Error: " + err.message);
      } finally { setIsExecuting(false); }
  };`;

const oldPartStart = code.indexOf('  const executeBatchOperation = async () => {');
const oldPartEnd = code.indexOf('  return (');
code = code.substring(0, oldPartStart) + executeNew + '\n\n' + code.substring(oldPartEnd);

fs.writeFileSync('src/components/DespachoEgresos.tsx', code);
console.log('Script executed. File restored.');
