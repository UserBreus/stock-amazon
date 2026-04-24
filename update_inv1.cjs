const fs = require('fs');

let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Add printRemito import if missing
if (!code.includes('import { printRemito }')) {
    code = code.replace(
        "import { executeAWSQuery } from '../lib/aws-client';", 
        "import { executeAWSQuery } from '../lib/aws-client';\r\nimport { printRemito } from '../lib/printRemito';"
    );
    console.log("Added printRemito import.");
}

// 2. Add submodal, pdf states, and change solicitudOrigenSel definition
let statesMarker = "const [solicitudOrigenSel, setSolicitudOrigenSel] = useState<Record<number, string>>({});";
if (!code.includes(statesMarker)) {
    // maybe it varies slightly
    statesMarker = "const [solicitudOrigenSel, setSolicitudOrigenSel] = useState<Record<number, string>>({});";
}
const statesReplacement = `  const [solicitudOrigenSel, setSolicitudOrigenSel] = useState<Record<number, string[]>>({});
  const [isSubModalOriginOpen, setIsSubModalOriginOpen] = useState(false);
  const [remitoPDFInfo, setRemitoPDFInfo] = useState<any>(null);
  const [isViewingFullscreenPDF, setIsViewingFullscreenPDF] = useState(false);`;

if (code.includes("const [solicitudOrigenSel, setSolicitudOrigenSel] = useState<Record<number, string>>({});")) {
    code = code.replace("const [solicitudOrigenSel, setSolicitudOrigenSel] = useState<Record<number, string>>({});", statesReplacement);
    console.log("Updated states.");
} else if (code.includes("useState<Record<number, string>>({});")) {
    code = code.replace("useState<Record<number, string>>({});", "useState<Record<number, string[]>>({});\n  const [isSubModalOriginOpen, setIsSubModalOriginOpen] = useState(false);\n  const [remitoPDFInfo, setRemitoPDFInfo] = useState<any>(null);\n  const [isViewingFullscreenPDF, setIsViewingFullscreenPDF] = useState(false);");
    console.log("Updated states (fallback).");
}


// 3. Update handleEnviarSolicitud to support multiple origins and PDF Generation
const handleStart = "const handleEnviarSolicitud = async (sol: any) => {";
const handleEndStr = "const openLabelDrillDown = async (prod: any) => {"; // search for the next function exactly
const endIdx = code.indexOf(handleEndStr);

if (code.includes(handleStart) && endIdx !== -1) {
    const handleOld = code.substring(code.indexOf(handleStart), endIdx);

    const handleNew = `const handleEnviarSolicitud = async (sol: any) => {
    const origenIdsArray = solicitudOrigenSel[sol.id] || [];
    if (origenIdsArray.length === 0) return toast.error('Seleccioná al menos un almacén de origen primero');
    const items = solicitudItems[sol.id];
    if (!items || items.length === 0) return toast.error('Cargá los ítems primero');

    setEnviandoSolicitud(sol.id);
    try {
      const remitoCode = 'REM-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
      const destino = sol.deposito_solicitante_id;

      // 1. Crear remito provisionalmente referenciado al primer almacén (origen principal representativo)
      const primaryOrigen = origenIdsArray[0];
      const remitoRes = await executeAWSQuery(\`
        INSERT INTO wms_remitos_internos (numeracion, deposito_origen_id, deposito_destino_id, creado_por, estado)
        OUTPUT INSERTED.id
        VALUES ('\${remitoCode}', \${primaryOrigen}, \${destino}, '\${user?.id || ''}', 'EN_TRANSITO');
      \`);
      const remitoId = remitoRes?.[0]?.id;
      if (!remitoId) throw new Error('No se pudo crear el remito');

      let pdfItemsExtracted: any[] = [];
      let labelsToPrint: any[] = [];
      let missingStockErrors: string[] = [];

      // 2. Por cada ítem, iterar la cadena de orígenes hasta satisfacer la cuota
      for (const item of items) {
        let remaining = item.cantidad_solicitada;
        let localTaken = 0;

        for (const oId of origenIdsArray) {
           if (remaining <= 0) break;
           const etqs = await executeAWSQuery(\`
             SELECT TOP 100 id, cantidad_actual, codigo_barras FROM Stock_Etiquetas
             WHERE variante_id = \${item.variante_id} AND deposito_id = \${oId} AND estado = 'activo' AND cantidad_actual > 0
             ORDER BY fecha_creacion ASC
           \`);
           
           if (!etqs || etqs.length === 0) continue; // No stock here, try next origin
           
           for (const etq of etqs) {
             if (remaining <= 0) break;
             const toTake = Math.min(etq.cantidad_actual, remaining);
             remaining -= toTake;
             localTaken += toTake;
             
             // Extract from this etiquette
             if (toTake === etq.cantidad_actual) {
                // Entire lot taken
                await executeAWSQuery(\`
                  UPDATE Stock_Etiquetas SET deposito_id = \${destino}, estado = 'trasladando' WHERE id = \${etq.id};
                  INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                  VALUES (\${etq.id}, 'traslado_salida', \${toTake}, \${oId}, \${destino}, \${remitoId}, '\${user?.id || ''}');
                  INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                  VALUES (\${remitoId}, \${item.variante_id}, \${toTake}, \${etq.id}, 'PENDIENTE');
                \`);
             } else {
                // Partial Lot Fractioning
                await executeAWSQuery(\`UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual - \${toTake} WHERE id = \${etq.id};\`);
                const newCode = \`\${etq.codigo_barras}-S\${Math.floor(Math.random()*999)}\`;
                
                labelsToPrint.push({ codigo_barras: newCode, producto_nombre: item.producto_nombre, nombre_variante: item.nombre_variante, cantidad_actual: toTake });
                
                // Create transit lot
                await executeAWSQuery(\`
                  DECLARE @NewLote INT;
                  INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, estado)
                  VALUES ('\${newCode}', \${item.variante_id}, \${destino}, \${toTake}, \${toTake}, 'trasladando');
                  SET @NewLote = SCOPE_IDENTITY();
                  INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                  VALUES (@NewLote, 'fraccionamiento_ingreso', \${toTake}, \${oId}, \${destino}, \${remitoId}, '\${user?.id || ''}');
                  INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                  VALUES (\${etq.id}, 'fraccionamiento_salida', \${toTake}, \${oId}, \${destino}, \${remitoId}, '\${user?.id || ''}');
                  INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                  VALUES (\${remitoId}, \${item.variante_id}, \${toTake}, @NewLote, 'PENDIENTE');
                \`);
             }
           }
        }
        
        if (localTaken > 0) {
            pdfItemsExtracted.push({
               id: item.variante_id + '-' + Date.now(), 
               codigo_barras: 'MULTI-SEQ',
               cantidad_a_extraer: localTaken,
               producto_nombre: item.producto_nombre,
               nombre_variante: item.nombre_variante
            });
        }
        
        if (remaining > 0) {
            missingStockErrors.push(\`Faltaron \${remaining} uds de \${item.nombre_variante}\`);
        }
      }

      if (missingStockErrors.length > 0) {
         toast.error(\`Atención: No hubo stock físico suficiente para completar todo el pedido. \${missingStockErrors.join('. ')}\`, { duration: 6000 });
      }

      // Marcar solicitud como aprobada
      await executeAWSQuery(\`
        UPDATE wms_solicitudes SET estado = 'APROBADA', remito_id = \${remitoId}
        WHERE id = \${sol.id};
      \`);

      setRemitoPDFInfo({ 
         cart: pdfItemsExtracted, 
         origen: 'Consolidado (Multi-Origen)',
         destino: sol.sector_nombre, 
         codigo: remitoCode, 
         fecha: new Date().toLocaleString(), 
         nuevasEtiquetas: labelsToPrint 
      });

      toast.success(\`✅ Solicitud aprobada — Remito \${remitoCode} en tránsito\`);
      await fetchData();
      setSolicitudItems(prev => { const n = {...prev}; delete n[sol.id]; return n; });
      setSelectedModalSol(null);
    } catch (e: any) {
      toast.error('Error al despachar: ' + e.message);
    } finally {
      setEnviandoSolicitud(null);
    }
  };

  `;
    code = code.replace(handleOld, handleNew);
    console.log("Updated handleEnviarSolicitud");
}

fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
