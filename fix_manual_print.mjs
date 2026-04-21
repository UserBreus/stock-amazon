import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const targetManual = `const handleGenerateLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prod = stockConsolidado.find(p => p.variante_id === newLabel.producto_id);
      if(!prod) return;

      const prefix = prod.sku || 'PROD';
      let insertEtiquetas = '';
      
      for(let i=0; i<newLabel.numero_etiquetas; i++) {
        const codigo_barras = \`\${prefix}-\${Date.now().toString().slice(-6)}-\${i+1}\`;
        insertEtiquetas += \`
          DECLARE @new_etq_\${i} INT;
          INSERT INTO Stock_Etiquetas (variante_id, deposito_id, codigo_barras, cantidad_inicial, cantidad_actual, estado)
          VALUES ('\${prod.variante_id}', \${newLabel.deposito_id}, '\${codigo_barras}', \${newLabel.cantidad_por_etiqueta}, \${newLabel.cantidad_por_etiqueta}, 'activo');
          SET @new_etq_\${i} = SCOPE_IDENTITY();
          
          INSERT INTO Stock_Movimientos (etiqueta_id, deposito_destino_id, cantidad_afectada, tipo_movimiento, usuario_id)
          VALUES (@new_etq_\${i}, \${newLabel.deposito_id}, \${newLabel.cantidad_por_etiqueta}, 'creacion', '\${user?.id}');
        \`;
      }

      await executeAWSQuery(insertEtiquetas);
      setIsLabelModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };`;

const replacementManual = `const handleGenerateLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prod = stockConsolidado.find(p => p.variante_id === newLabel.producto_id);
      if(!prod) return;

      const prefix = prod.sku || 'PROD';
      let insertEtiquetas = '';
      let newEtqs = [];
      
      for(let i=0; i<newLabel.numero_etiquetas; i++) {
        const codigo_barras = \`\${prefix}-\${Date.now().toString().slice(-6)}-\${i+1}\`;
        newEtqs.push({
           id: \`temp-\${i}\`,
           codigo_barras,
           variante_id: prod.variante_id
        });
        insertEtiquetas += \`
          DECLARE @new_etq_\${i} INT;
          INSERT INTO Stock_Etiquetas (variante_id, deposito_id, codigo_barras, cantidad_inicial, cantidad_actual, estado)
          VALUES ('\${prod.variante_id}', \${newLabel.deposito_id}, '\${codigo_barras}', \${newLabel.cantidad_por_etiqueta}, \${newLabel.cantidad_por_etiqueta}, 'activo');
          SET @new_etq_\${i} = SCOPE_IDENTITY();
          
          INSERT INTO Stock_Movimientos (etiqueta_id, deposito_destino_id, cantidad_afectada, tipo_movimiento, usuario_id)
          VALUES (@new_etq_\${i}, \${newLabel.deposito_id}, \${newLabel.cantidad_por_etiqueta}, 'creacion', '\${user?.id}');
        \`;
      }

      await executeAWSQuery(insertEtiquetas);
      
      setPrintProduct(prod);
      setPrintEtiquetas(newEtqs);
      setIsLabelModalOpen(false);
      
      setTimeout(() => {
          window.print();
      }, 500);

      fetchData();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };`;

txt = txt.replace(targetManual, replacementManual);
fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("Manual labels printing logic completely fixed!");
