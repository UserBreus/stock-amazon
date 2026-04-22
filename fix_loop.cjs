const fs = require('fs');
const file = 'src/components/DespachoEgresos.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/for \(let i = 0; i < cart\.length; i\+\+\) \{[\s\S]*?if \(isTransfer\) \{ queries.push\(\`SELECT numeracion as rem_code FROM wms_remitos_internos WHERE id = @RemId;\`\); \}/,
`for (let i = 0; i < cart.length; i++) {
              const item = cart[i];
              const origenFijoSQL = origenId; 

              // Unconditional origin deduction (Stock disappears from Origin)
              if (item.cantidad_a_extraer === item.cantidad_actual) {
                  queries.push(\`UPDATE Stock_Etiquetas SET cantidad_actual = 0, estado = '\${isTransfer ? 'en_transito' : 'consumido'}' WHERE id = \${item.id};\`);
              } else {
                  queries.push(\`UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual - \${item.cantidad_a_extraer} WHERE id = \${item.id};\`);
                  // For partial egress/transfer, generate the NEW split tag physically for printing/auditing
                  const newCode = \`\${item.codigo_barras}-S\${Math.floor(Math.random()*99)}\`;
                  labelsToPrint.push({ codigo_barras: newCode, producto_nombre: item.producto_nombre, nombre_variante: item.nombre_variante, cantidad_actual: item.cantidad_a_extraer });
              }

              // Movements and WMS Queue
              if (isTransfer) {
                  // Register the exit movement completely against the origin
                  queries.push(\`
                      INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, remito_id, usuario_id)
                      VALUES (\${item.id}, 'traslado_salida', \${item.cantidad_a_extraer}, \${origenFijoSQL}, @RemId, '\${(user as any)?.id || ''}');
                  \`);
                  // Enqueue into the 2-step WMS transfer items table
                  queries.push(\`
                      INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, cantidad_recibida, estado)
                      VALUES (@RemId, \${item.variante_id}, \${item.cantidad_a_extraer}, 0.00, 'PENDIENTE');
                  \`);
              } else {
                  // Final Egress
                  queries.push(\`
                      INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, remito_id, usuario_id)
                      VALUES (\${item.id}, 'egreso_final', \${item.cantidad_a_extraer}, \${origenFijoSQL}, @RemId, '\${(user as any)?.id || ''}');
                  \`);
              }
          }

          if (isTransfer) { queries.push(\`SELECT numeracion as rem_code FROM wms_remitos_internos WHERE id = @RemId;\`); }`);

fs.writeFileSync(file, c);
console.log('Fixed loop');
