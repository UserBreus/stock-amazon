import fs from 'fs';

let content = fs.readFileSync('src/components/RecepcionAuditoria.tsx', 'utf8');

// 1. Add new state for external code processing
const stateHookPos = content.indexOf('const [lineasAuditoria, setLineasAuditoria] = useState<any[]>([]);');
const stateHooks = `const [lineasAuditoria, setLineasAuditoria] = useState<any[]>([]);
  const [etiquetasEscaneadas, setEtiquetasEscaneadas] = useState<string[]>([]);
  const [pendingExternalCode, setPendingExternalCode] = useState<string | null>(null);
  const [externalCodeMap, setExternalCodeMap] = useState<{code: string, variante_id: string}[]>([]);`;

content = content.replace('const [lineasAuditoria, setLineasAuditoria] = useState<any[]>([]);', stateHooks);

// 2. Clear state on Compra Auth
const authCompraOld = `const obj = res.reduce((acc: any, val: any) => {`;
const authCompraNew = `setEtiquetasEscaneadas([]);
      setPendingExternalCode(null);
      setExternalCodeMap([]);
      const obj = res.reduce((acc: any, val: any) => {`;
content = content.replace(authCompraOld, authCompraNew);

// 3. Process Scan logic
const oldProcesar = `  const procesarEscaneoQR = (codigo: string) => {
      toast.success("Escaner simulado: " + codigo);
      // Aqui requeririamos que las etiquetas tengan codigo barras. 
      // Por simplicidad, si asume el código de la variante_id del QR
      let found = false;
      const nw = lineasAuditoria.map(l => {
          if (l.variante_id.toUpperCase() === codigo.toUpperCase() || codigo.includes(l.variante_id)) {
              found = true;
              l.Auditada += 1;
              if (l.Auditada === l.esperada) l.estado = 'listo';
              else if (l.Auditada > l.esperada) l.estado = 'excedente';
          }
          return l;
      });
      
      if(found) {
          setLineasAuditoria(nw);
      } else {
          toast.error("Código libre detectado. Agregalo usando 'Cargar artículo manual'.");
      }
  };`;

const newProcesar = `  const procesarEscaneoQR = (codigo: string) => {
      if (etiquetasEscaneadas.includes(codigo.toUpperCase())) {
          return toast.error("Este código ya fue escaneado en esta sesión.");
      }

      let foundVarianteId: string | null = null;
      
      // Check if code maps directly to a variant_id (direct catalogue barcode)
      const isDirect = lineasAuditoria.find(l => l.variante_id.toUpperCase() === codigo.toUpperCase() || codigo.includes(l.variante_id));
      if (isDirect) foundVarianteId = isDirect.variante_id;

      if (!foundVarianteId) {
         // Open mapping modal for external code
         setPendingExternalCode(codigo);
         return;
      }

      setEtiquetasEscaneadas(prev => [...prev, codigo.toUpperCase()]);
      const nw = lineasAuditoria.map(l => {
          if (l.variante_id === foundVarianteId) {
              return { ...l, Auditada: l.Auditada + 1 };
          }
          return l;
      });
      setLineasAuditoria(nw);
  };
  
  const mapExternalCode = (varianteId: string) => {
      if(!pendingExternalCode) return;
      setExternalCodeMap(prev => [...prev, { code: pendingExternalCode.toUpperCase(), variante_id: varianteId }]);
      setEtiquetasEscaneadas(prev => [...prev, pendingExternalCode.toUpperCase()]);
      
      const nw = lineasAuditoria.map(l => {
          if (l.variante_id === varianteId) {
              return { ...l, Auditada: l.Auditada + 1 };
          }
          return l;
      });
      setLineasAuditoria(nw);
      setPendingExternalCode(null);
      toast.success("Código externo enlazado y sumado");
  };`;

content = content.replace(oldProcesar, newProcesar);


// 4. Updating Asentar
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

const newAsentar = `       let assignedExternalCodes = [...externalCodeMap];
       
       for(const item of lineasAuditoria) {
          if(item.Auditada > 0) {
             let costoReal = (Number(item.costo_unitario) || 0) + costoExtraUnitario;
             for(let i=0; i<item.Auditada; i++) {
                // If there's an external code mapped to this item, use it
                const externalMatchIndex = assignedExternalCodes.findIndex(e => e.variante_id === item.variante_id);
                let codigoBarrasDb = "CONVERT(varchar(255), NEWID())"; // Fallback to auto-gen
                
                if (externalMatchIndex >= 0) {
                    codigoBarrasDb = \`'\${assignedExternalCodes[externalMatchIndex].code}'\`;
                    assignedExternalCodes.splice(externalMatchIndex, 1);
                }

                q += \`
                   INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, compra_id, costo_unitario_real)
                   VALUES (\${codigoBarrasDb}, '\${item.variante_id}', \${contextoDestinoId}, 1, 1, '\${compraSeleccionada.id}', \${costoReal});
                   
                   DECLARE @new_etq_\${item.variante_id.replace(/-/g,'')}_\${i} INT = SCOPE_IDENTITY();
                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, referencia_compra_id, usuario_id)
                   VALUES (@new_etq_\${item.variante_id.replace(/-/g,'')}_\${i}, 'ingreso_compra', 1, \${contextoDestinoId}, '\${compraSeleccionada.id}', '\${user?.id}');
                \`;
             }
          }
       }`;

content = content.replace(oldAsentar, newAsentar);

// 5. Add UI Modal for Pending Code Mapping
const oldModalSelector = `      {/* Modal Carga Manual Libre */}`;
const newModalSelector = `      {/* Modal de Asignación de Código Externo */}
      <AnimatePresence>
         {pendingExternalCode && (
             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPendingExternalCode(null)} />
                 <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-slate-50 dark:bg-slate-950 w-full max-w-lg rounded-2xl shadow-xl p-6">
                     <span className="bg-amber-100 text-amber-700 font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest mb-4 inline-block">Código Proveedor / Desconocido</span>
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Asignar Código</h3>
                     <p className="text-slate-500 text-sm font-medium mb-6">Escaneaste <strong className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{pendingExternalCode}</strong>. El sistema no lo reconoce. Selecciona a qué artículo de la orden corresponde para enlazarlo.</p>
                     
                     <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {lineasAuditoria.map(l => (
                            <button key={l.variante_id} onClick={() => mapExternalCode(l.variante_id)} className="w-full text-left p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                               <p className="font-bold text-slate-800 dark:text-slate-200">{l.producto_nombre}</p>
                               <p className="text-xs text-slate-500 mt-1">{l.nombre_variante}</p>
                            </button>
                        ))}
                     </div>
                 </motion.div>
             </div>
         )}
      </AnimatePresence>

      {/* Modal Carga Manual Libre */}`;

content = content.replace(oldModalSelector, newModalSelector);

fs.writeFileSync('src/components/RecepcionAuditoria.tsx', content);

console.log("RecepcionAuditoria updated for External Suppliers.");
