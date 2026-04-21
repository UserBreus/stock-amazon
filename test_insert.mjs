const insertEtiquetas = `
                 INSERT INTO Stock_Etiquetas (variante_id, deposito_id, compra_id, codigo_barras, cantidad_inicial, cantidad_actual, estado)
                 VALUES ('207', 1, 'EDAA62E4-A9AB-458D-8BA2-1E10C2F5FFC3', 'TEST-OC-1', 1, 1, 'impreso_pendiente');
               `;
fetch('http://3.85.26.173:5005/sql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: insertEtiquetas }) }).then(r => r.json()).then(data => console.log(JSON.stringify(data)))
