import fs from 'fs';

let content = fs.readFileSync('src/components/RecepcionAuditoria.tsx', 'utf8');

// 1. Add state for tracked tags
content = content.replace(
  "const [lineasAuditoria, setLineasAuditoria] = useState<any[]>([]);",
  "const [lineasAuditoria, setLineasAuditoria] = useState<any[]>([]);\n  const [etiquetasPendientes, setEtiquetasPendientes] = useState<any[]>([]);\n  const [etiquetasEscaneadas, setEtiquetasEscaneadas] = useState<string[]>([]);"
);

// 2. Load the tags when auditing a purchase order
const oldAuditarCompra = `      const obj = res.reduce((acc: any, val: any) => {
          if (!acc[val.variante_id]) {
             acc[val.variante_id] = { ...val, Auditada: 0, costo_unitario: val.costo_unitario };`;

const newAuditarCompra = `      const etq = await executeAWSQuery(\`SELECT id, codigo_barras, variante_id FROM Stock_Etiquetas WHERE compra_id = '\${compra.id}' AND estado = 'impreso_pendiente'\`);
      setEtiquetasPendientes(etq || []);
      setEtiquetasEscaneadas([]);

      const obj = res.reduce((acc: any, val: any) => {
          if (!acc[val.variante_id]) {
             acc[val.variante_id] = { ...val, Auditada: 0, costo_unitario: val.costo_unitario };`;

content = content.replace(oldAuditarCompra, newAuditarCompra);

// 3. Scan logic
const oldProcesarEscaneo = `  const procesarEscaneoQR = (codigo: string) => {
      // Por simplicidad, si asume el código de la variante_id del QR
      let found = false;
      const nw = lineasAuditoria.map(l => {
          if (l.variante_id.toUpperCase() === codigo.toUpperCase() || codigo.includes(l.variante_id)) {
              found = true;
              return { ...l, Auditada: l.Auditada + 1 };
          }
          return l;
      });`;

const newProcesarEscaneo = `  const procesarEscaneoQR = (codigo: string) => {
      let trueTargetVariante = codigo;
      let isPrePrinted = false;
      const prePrinted = etiquetasPendientes.find(e => e.codigo_barras.toUpperCase() === codigo.toUpperCase() || e.id.toString() === codigo);
      if (prePrinted) {
          if (etiquetasEscaneadas.includes(prePrinted.id)) {
              toast.error('Esta etiqueta física ya fue escaneada');
              return;
          }
          trueTargetVariante = prePrinted.variante_id;
          isPrePrinted = true;
          setEtiquetasEscaneadas(prev => [...prev, prePrinted.id]);
      }

      let found = false;
      const nw = lineasAuditoria.map(l => {
          if (l.variante_id.toUpperCase() === trueTargetVariante.toUpperCase() || trueTargetVariante.includes(l.variante_id)) {
              found = true;
              return { ...l, Auditada: l.Auditada + 1 };
          }
          return l;
      });
      
      if (isPrePrinted && found) {
          // toast.success("Etiqueta validada con éxito", { icon: '✅' });
      }`;

content = content.replace(oldProcesarEscaneo, newProcesarEscaneo);

// 4. Update the save logic (asentarIngreso)
// Instead of creating new ones blindly, it should do an UPDATE for the scanned pre-printed tags.
// Anything else (or difference) is created?

// Wait, the existing code:
/*
       let q = `UPDATE Stock_Compras SET estado = 'completada' WHERE id = '${compraSeleccionada.id}';`;
       
       for(const item of lineasAuditoria) {
          if(item.Auditada > 0) {
             let costoReal = (Number(item.costo_unitario) || 0) + costoExtraUnitario;
             for(let i=0; i<item.Auditada; i++) {
                q += `
                   INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, compra_id, costo_unitario_real)
                   VALUES (CONVERT(varchar(255), NEWID()), '${item.variante_id}', ${contextoDestinoId}, 1, 1, '${compraSeleccionada.id}', ${costoReal});
                   
                   DECLARE @new_etq_${item.variante_id.replace(/-/g,'')}_${i} INT = SCOPE_IDENTITY();
                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, referencia_compra_id, usuario_id)
                   VALUES (@new_etq_${item.variante_id.replace(/-/g,'')}_${i}, 'ingreso_compra', 1, ${contextoDestinoId}, '${compraSeleccionada.id}', '${user?.id}');
                `;
             }
          }
       }
*/
const oldAsentar = `       for(const item of lineasAuditoria) {
          if(item.Auditada > 0) {
             let costoReal = (Number(item.costo_unitario) || 0) + costoExtraUnitario;
             for(let i=0; i<item.Auditada; i++) {
                q += \`
                   INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, compra_id, costo_unitario_real)
                   VALUES (CONVERT(varchar(255), NEWID()), '\${item.variante_id}', \${contextoDestinoId}, 1, 1, '\${compraSeleccionada.id}', \${costoReal});
                   
                   DECLARE @new_etq_\${item.variante_id.replace(/-/g,'')}_\${i} INT = SCOPE_IDENTITY();
                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, referencia_compra_id, usuario_id)
                   VALUES (@new_etq_\${item.variante_id.replace(/-/g,'')}_\${i}, 'ingreso_compra', 1, \${contextoDestinoId}, '\${compraSeleccionada.id}', '\${user?.id}');
                \`;
             }
          }
       }`;

const newAsentar = `       // Agrupamos las etiquetas escaneadas por variante para darles UPDATE en vez de INSERT
       let trackUsadas = [...etiquetasEscaneadas];
       for(const item of lineasAuditoria) {
          if(item.Auditada > 0) {
             let costoReal = (Number(item.costo_unitario) || 0) + costoExtraUnitario;
             for(let i=0; i<item.Auditada; i++) {
                // Busco si escaneó alguna etiqueta de esta variante que está en preimpresas
                const preimpresaObj = etiquetasPendientes.find(e => e.variante_id === item.variante_id && trackUsadas.includes(e.id));
                if (preimpresaObj) {
                    trackUsadas = trackUsadas.filter(id => id !== preimpresaObj.id);
                    q += \`
                       UPDATE Stock_Etiquetas SET estado = 'activo', deposito_id = \${contextoDestinoId}, costo_unitario_real = \${costoReal} WHERE id = \${preimpresaObj.id};
                       INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, referencia_compra_id, usuario_id)
                       VALUES (\${preimpresaObj.id}, 'ingreso_compra', 1, \${contextoDestinoId}, '\${compraSeleccionada.id}', '\${user?.id}');
                    \`;
                } else {
                    q += \`
                       INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, compra_id, costo_unitario_real)
                       VALUES (CONVERT(varchar(255), NEWID()), '\${item.variante_id}', \${contextoDestinoId}, 1, 1, '\${compraSeleccionada.id}', \${costoReal});
                       
                       DECLARE @new_etq_\${item.variante_id.replace(/-/g,'')}_\${i} INT = SCOPE_IDENTITY();
                       INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, referencia_compra_id, usuario_id)
                       VALUES (@new_etq_\${item.variante_id.replace(/-/g,'')}_\${i}, 'ingreso_compra', 1, \${contextoDestinoId}, '\${compraSeleccionada.id}', '\${user?.id}');
                    \`;
                }
             }
          }
       }`;

content = content.replace(oldAsentar, newAsentar);

fs.writeFileSync('src/components/RecepcionAuditoria.tsx', content);

console.log("RecepcionAuditoria successfully updated.");
