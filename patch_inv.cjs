const fs = require('fs');

try {
    let invCode = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

    const sInv1 = invCode.indexOf('if (cantToReceive > 0) {');
    const midString = "UPDATE wms_remitos_internos_items SET estado = 'CANCELADO'";
    const sInv2 = invCode.indexOf(midString, sInv1);
    const endStr = '              }';
    let eInv2 = invCode.indexOf(endStr, sInv2 + 50); // After the cancelado sentence
    
    // add length of endStr to capture it fully
    eInv2 += endStr.length;

    const rInv = `if (cantToReceive > 0) {
                  queries.push(\`
                      UPDATE Stock_Etiquetas 
                      SET estado = 'activo', cantidad_actual = \${cantToReceive}
                      WHERE id = \${item.etiqueta_generada_id};
                      
                      INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id)
                      VALUES (\${item.etiqueta_generada_id}, 'recepcion_confirmada', \${cantToReceive}, @RemitoDestino);
                      
                      UPDATE wms_remitos_internos_items SET estado = 'RECIBIDO_OK', cantidad_recibida = \${cantToReceive} WHERE id = \${item.id};
                  \`);
              } else {
                  // Received nothing of this line
                  queries.push(\`
                      UPDATE Stock_Etiquetas 
                      SET estado = 'extraviado', cantidad_actual = 0
                      WHERE id = \${item.etiqueta_generada_id};
                      
                      UPDATE wms_remitos_internos_items SET estado = 'CANCELADO', cantidad_recibida = 0 WHERE id = \${item.id};
                  \`);
              }`;

    if (sInv1 !== -1 && sInv2 !== -1 && eInv2 !== -1) {
        invCode = invCode.substring(0, sInv1) + rInv + invCode.substring(eInv2);
        fs.writeFileSync('src/pages/InventarioOperativo.tsx', invCode);
        console.log('Patched InventarioOperativo logic');
    } else {
        console.error('Indices not found in InventarioOperativo');
    }
} catch (e) { console.error(e) }
