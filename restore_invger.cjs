const fs = require('fs');

try {
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. ADD missing imports if needed
if (!code.includes('import { printRemito }')) {
    code = code.replace("import { executeAWSQuery }", "import { executeAWSQuery }\nimport { printRemito } from '../lib/printRemito';");
}
if (!code.includes('MapPin')) {
    code = code.replace("History,", "History, MapPin, Send, ClipboardList, CheckCircle, PackageCheck,");
}

// 2. Add State Variables
const stateVars = `
  // Solicitudes & Historial Global states restored
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [solicitudItems, setSolicitudItems] = useState<{ [key: string]: any[] }>({});
  const [selectedModalSol, setSelectedModalSol] = useState<any>(null);
  const [solicitudOrigenSel, setSolicitudOrigenSel] = useState<{ [solId: number]: string[] }>({});
  const [isSubModalOriginOpen, setIsSubModalOriginOpen] = useState(false);
  const [stockCoverage, setStockCoverage] = useState<Record<number, {status: "FULL"|"PARTIAL"|"NONE"}>>({});
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(false);
  const [remitoPDFInfo, setRemitoPDFInfo] = useState<any>(null);
  const [isViewingFullscreenPDF, setIsViewingFullscreenPDF] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState<string | null>(null);
`;
if (!code.includes('const [solicitudItems,')) {
    code = code.replace('const filterRef = useRef<string | null>(null);', 'const filterRef = useRef<string | null>(null);\n' + stateVars);
}

// 3. Add fetching methods & logic inside component
const fetchLogic = `
  const fetchGlobalSolicitudes = async () => {
      try {
          const res = await executeAWSQuery(\`
              SELECT s.*, d.nombre as sector_nombre, u.nombre as operario_nombre 
              FROM wms_solicitudes s
              LEFT JOIN Stock_Depositos d ON s.deposito_solicitante_id = d.id
              LEFT JOIN Usuarios u ON s.creado_por = u.id
              WHERE s.estado = 'PENDIENTE'
              ORDER BY s.fecha_creacion DESC
          \`);
          setSolicitudes(res || []);
      } catch (err) { }
  };

  const fetchGlobalHistorial = async () => {
    try {
      const res = await executeAWSQuery(\`
        SELECT TOP 200 r.*, d_origen.nombre as origen_nombre, d_destino.nombre as destino_nombre,
          (SELECT COUNT(*) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_items
        FROM wms_remitos_internos r
        LEFT JOIN Stock_Depositos d_origen ON r.deposito_origen_id = d_origen.id
        LEFT JOIN Stock_Depositos d_destino ON r.deposito_destino_id = d_destino.id
        ORDER BY r.fecha_creacion DESC
      \`);
      setGlobalHistorial(res || []);
      setHistorialLoaded(true);
    } catch (error: any) { }
  };

  useEffect(() => {
    fetchGlobalSolicitudes();
  }, []);

  useEffect(() => {
    if (activeTab === 'historial' && !historialLoaded) fetchGlobalHistorial();
  }, [activeTab]);

  const handleOpenSolicitud = async (sol: any) => {
      setSelectedModalSol(sol);
      try {
          const res = await executeAWSQuery(\`
             SELECT i.*, v.nombre_variante, p.nombre as producto_nombre
             FROM wms_solicitudes_items i
             JOIN Stock_Variantes v ON i.variante_id = v.id
             JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
             WHERE i.solicitud_id = \${sol.id}
          \`);
          setSolicitudItems(prev => ({ ...prev, [sol.id]: res || [] }));
      } catch (err) { }
  };

  const openOriginSubModal = async () => {
     setIsSubModalOriginOpen(true);
     if (!selectedModalSol) return;
     const items = solicitudItems[selectedModalSol.id];
     if (!items || items.length === 0) return;
     
     setIsLoadingCoverage(true);
     try {
       const qs = items.map((i:any) => i.variante_id).join(',');
       const stock = await executeAWSQuery(\`
          SELECT deposito_id, variante_id, SUM(cantidad_actual) as stock_total 
          FROM Stock_Etiquetas 
          WHERE variante_id IN (\${qs}) AND estado = 'activo' AND cantidad_actual > 0
          GROUP BY deposito_id, variante_id
       \`);
       
       const availability: Record<number, {status: "FULL"|"PARTIAL"|"NONE"}> = {};
       depositos.forEach((d:any) => {
          let hasSufficientAll = true;
          let hasAny = false;
          for(const rq of items) {
             const found = (stock||[]).find((s:any) => s.deposito_id === d.id && s.variante_id === rq.variante_id);
             const qty = found ? found.stock_total : 0;
             if (qty > 0) hasAny = true;
             if (qty < rq.cantidad_solicitada) hasSufficientAll = false;
          }
          if (hasSufficientAll) availability[d.id] = { status: "FULL" };
          else if (hasAny) availability[d.id] = { status: "PARTIAL" };
          else availability[d.id] = { status: "NONE" };
       });
       setStockCoverage(availability);
     } catch (e) { } finally { setIsLoadingCoverage(false); }
  };

  const handleEnviarSolicitud = async (sol: any) => {
    const origenIdsArray = solicitudOrigenSel[sol.id] || [];
    if (origenIdsArray.length === 0) return toast.error('Seleccioná al menos un almacén de origen primero');
    const items = solicitudItems[sol.id];
    if (!items || items.length === 0) return toast.error('Cargá los ítems primero');

    setEnviandoSolicitud(sol.id);
    try {
      const remitoCode = 'REM-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
      const destino = sol.deposito_solicitante_id;
      const primaryOrigen = origenIdsArray[0];
      const remitoRes = await executeAWSQuery(\`
        INSERT INTO wms_remitos_internos (numeracion, deposito_origen_id, deposito_destino_id, creado_por, estado)
        VALUES ('\${remitoCode}', \${primaryOrigen}, \${destino}, '\${(user as any)?.id || ''}', 'EN_TRANSITO');
        SELECT SCOPE_IDENTITY() as id;
      \`);
      const remitoId = remitoRes?.[0]?.id;
      if (!remitoId) throw new Error('No se pudo crear el remito');

      let pdfItemsExtracted: any[] = [];
      let labelsToPrint: any[] = [];
      let missingStockErrors: string[] = [];

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
           
           if (!etqs || etqs.length === 0) continue; 
           
           for (const etq of etqs) {
             if (remaining <= 0) break;
             const toTake = Math.min(etq.cantidad_actual, remaining);
             remaining -= toTake;
             localTaken += toTake;
             
             if (toTake === etq.cantidad_actual) {
                await executeAWSQuery(\`
                  UPDATE Stock_Etiquetas SET deposito_id = \${destino}, estado = 'trasladando' WHERE id = \${etq.id};
                  INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                  VALUES (\${etq.id}, 'traslado_salida', \${toTake}, \${oId}, \${destino}, \${remitoId}, '\${(user as any)?.id || ''}');
                  INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                  VALUES (\${remitoId}, \${item.variante_id}, \${toTake}, \${etq.id}, 'PENDIENTE');
                \`);
             } else {
                await executeAWSQuery(\`UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual - \${toTake} WHERE id = \${etq.id};\`);
                const newCode = \`\${etq.codigo_barras}-S\${Math.floor(Math.random()*999)}\`;
                labelsToPrint.push({ codigo_barras: newCode, producto_nombre: item.producto_nombre, nombre_variante: item.nombre_variante, cantidad_actual: toTake });
                
                await executeAWSQuery(\`
                  DECLARE @NewLote INT;
                  INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, estado)
                  VALUES ('\${newCode}', \${item.variante_id}, \${destino}, \${toTake}, \${toTake}, 'trasladando');
                  SET @NewLote = SCOPE_IDENTITY();
                  INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                  VALUES (@NewLote, 'fraccionamiento_ingreso', \${toTake}, \${oId}, \${destino}, \${remitoId}, '\${(user as any)?.id || ''}');
                  INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                  VALUES (\${etq.id}, 'fraccionamiento_salida', \${toTake}, \${oId}, \${destino}, \${remitoId}, '\${(user as any)?.id || ''}');
                  INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                  VALUES (\${remitoId}, \${item.variante_id}, \${toTake}, @NewLote, 'PENDIENTE');
                \`);
             }
           }
        }
        if (localTaken > 0) pdfItemsExtracted.push({ id: item.variante_id + '-' + Date.now(), codigo_barras: 'MULTI-SEQ', cantidad_a_extraer: localTaken, producto_nombre: item.producto_nombre, nombre_variante: item.nombre_variante });
        if (remaining > 0) missingStockErrors.push(\`Faltaron \${remaining} uds de \${item.nombre_variante}\`);
      }

      if (missingStockErrors.length > 0) toast.error(\`Atención: No hubo stock físico suficiente para todo el pedido. \${missingStockErrors.join('. ')}\`, { duration: 6000 });

      await executeAWSQuery(\`UPDATE wms_solicitudes SET estado = 'APROBADA', remito_id = \${remitoId} WHERE id = \${sol.id};\`);

      setRemitoPDFInfo({ cart: pdfItemsExtracted,  origen: 'Consolidado (Multi-Origen)', destino: sol.sector_nombre, codigo: remitoCode, fecha: new Date().toLocaleString(), nuevasEtiquetas: labelsToPrint });
      toast.success(\`Solicitud aprobada - Remito \${remitoCode} en tránsito\`);
      await fetchGlobalSolicitudes();
      setSelectedModalSol(null);
    } catch (e: any) { toast.error('Error al despachar: ' + e.message); } finally { setEnviandoSolicitud(null); }
  };

  const handleVerHistorialDetalles = async (rem: any) => {
      try {
          const detailRes = await executeAWSQuery(\`
              SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre 
              FROM wms_remitos_internos_items i
              JOIN Stock_Variantes v ON i.variante_id = v.id
              JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              WHERE i.remito_id = \${rem.id}
          \`);
          setSelectedHistorialRemito({
             cart: detailRes || [],
             origen: rem.origen_nombre,
             destino: rem.destino_nombre,
             codigo: rem.numeracion,
             fecha: new Date(rem.fecha_creacion).toLocaleString()
          });
      } catch (err: any) { toast.error("Error cargando detalle: " + err.message); }
  };
`;

if (!code.includes('const fetchGlobalSolicitudes')) {
    code = code.replace('const fetchData = async () => {', fetchLogic + '\n  const fetchData = async () => {');
}

// 4. Inject Panel Button
const buttonToInsert = `
            {/* NUEVO BOTON SOLICITUDES EN PANEL */}
            <button onClick={() => setPanelView('solicitudes')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-emerald-200 dark:border-slate-800 dark:hover:border-emerald-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-emerald-500/5">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <Send className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Órdenes Solicitadas</h3>
                   <p className="text-slate-500 font-medium text-sm">Aprobar, gestionar origen logístico y descontar envíos pedidos por otros sectores.</p>
                </div>
            </button>
            
`;
if (!code.includes('setPanelView(\'solicitudes\')')) {
    code = code.replace('<button onClick={() => setPanelView(\'retiro\')}', buttonToInsert + '            <button onClick={() => setPanelView(\'retiro\')}');
}

// 5. Inject list of solicitudes and modals
const solicitudesViewAndModals = `
      {/* PANEL SOLICITUDES */}
      {activeTab === 'panel' && panelView === 'solicitudes' && (
         <div className="space-y-6 animate-in slide-in-from-right-4 w-full">
            <button onClick={() => setPanelView('hub')} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black px-6 py-3 rounded-xl mb-4 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Volver al Panel Central</button>
            
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-2xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Send className="w-8 h-8 text-emerald-500" /> Cola de Órdenes Solicitadas ({solicitudes.length})
                </h3>
            </div>
            
            {solicitudes.length === 0 ? (
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-6 py-12 text-center rounded-3xl border-2 border-emerald-100 dark:border-emerald-800">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-black mb-2">Todo al día</h3>
                    <p className="font-bold max-w-sm mx-auto">No hay ninguna solicitud operativa de mercadería en espera.</p>
                 </div>
            ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     {solicitudes.map((sol: any) => (
                         <div key={sol.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex justify-between flex-col transition hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700">
                             <div className="flex justify-between mb-4">
                                <div>
                                   <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-1">Sector Solicitante / Usuario</p>
                                   <h4 className="font-black text-lg text-slate-800 dark:text-white leading-tight">{sol.sector_nombre || 'N/A'}</h4>
                                   <p className="font-bold text-slate-500 text-xs mt-1"><User className="w-3 h-3 inline pb-0.5"/> {sol.operario_nombre}</p>
                                </div>
                                <div className="text-right">
                                   <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-black uppercase shadow-sm border border-emerald-100">{sol.numeracion}</span>
                                </div>
                             </div>
                             <p className="font-bold text-slate-400 text-xs mb-6">Fecha Pedido: {new Date(sol.fecha_creacion).toLocaleString()}</p>
                             
                             <button onClick={() => handleOpenSolicitud(sol)} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black py-4 rounded-xl flex items-center justify-center gap-2 w-full hover:scale-[1.02] transition">
                                EVALUAR Y ASIGNAR STOCK
                             </button>
                         </div>
                     ))}
                 </div>
            )}
         </div>
      )}

      {/* MODAL: ÓRDENES SOLICITADAS Y COBERTURAS */}
      <Modal isOpen={!!selectedModalSol && !isViewingFullscreenPDF} onClose={() => { setSelectedModalSol(null); setRemitoPDFInfo(null); }} title={\`Asignar Stock para Orden: \${selectedModalSol?.numeracion || ''}\`}>
         {selectedModalSol && (
            <div className="space-y-6">
               <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-500">
                       Orígenes de Extracción
                    </span>
                 </div>
                 <button
                    onClick={openOriginSubModal}
                    className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:border-amber-500 text-xs font-bold text-slate-700 dark:text-slate-200 py-1.5 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2"
                 >
                    {solicitudOrigenSel[selectedModalSol.id]?.length > 0
                        ? \`\${solicitudOrigenSel[selectedModalSol.id].length} Almacén(es) Elegido(s) - Cambiar\`
                        : 'Elegir Origen...'}
                 </button>
               </div>

               <div className="flex bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 items-center justify-between mt-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Destino Físico</p>
                    <p className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-500" /> {selectedModalSol.sector_nombre}
                    </p>
                  </div>
               </div>

               <div>
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">Artículos Solicitados</h4>
                 {!solicitudItems[selectedModalSol.id] ? (
                    <div className="py-8 text-center text-slate-400 text-sm animate-pulse">Cargando...</div>
                 ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Artículo</th>
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Req.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {solicitudItems[selectedModalSol.id].map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3">
                                 <p className="font-bold text-slate-800">{item.producto_nombre}</p>
                                 <p className="text-[10px] uppercase font-bold text-slate-500">{item.nombre_variante}</p>
                              </td>
                              <td className="px-5 py-3 text-center font-black text-lg text-indigo-600">{item.cantidad_solicitada}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 )}
               </div>

               <button disabled={enviandoSolicitud === selectedModalSol.id || !solicitudOrigenSel[selectedModalSol.id]?.length} onClick={() => handleEnviarSolicitud(selectedModalSol)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 mt-4">
                  {enviandoSolicitud === selectedModalSol.id ? 'PROCESANDO FIFO...' : 'APROBAR Y DESPACHAR REMITO'}
               </button>
            </div>
         )}
      </Modal>

      {/* MODAL CREADO */}
      <Modal isOpen={remitoPDFInfo !== null && !isViewingFullscreenPDF && !selectedModalSol} onClose={()=>setRemitoPDFInfo(null)} title="Remito Generado">
          {remitoPDFInfo && (
              <div className="text-center p-4 space-y-6">
                  <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto" />
                  <div>
                    <h3 className="text-2xl font-black mb-1 text-slate-800 dark:text-white">¡Despacho Registrado!</h3>
                    <p className="text-sm text-slate-500 font-medium">La mercadería ya entró en tránsito logística y el remito fue creado con éxito.</p>
                  </div>
                  <button onClick={() => setIsViewingFullscreenPDF(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/30">
                      <ClipboardList className="w-6 h-6"/> VER HOJA REMITO A4
                  </button>
                  <button onClick={() => setRemitoPDFInfo(null)} className="w-full py-4 uppercase font-bold tracking-widest text-xs border-2 border-slate-200 rounded-2xl hover:bg-slate-50">Cerrar</button>
              </div>
          )}
      </Modal>

      {/* SUB-MODAL ORÍGENES */}
      {isSubModalOriginOpen && selectedModalSol && (
        <Modal isOpen={true} onClose={() => setIsSubModalOriginOpen(false)} title="Elegir Almacén Físico">
          <div className="space-y-6">
             <p className="text-sm font-medium text-slate-500">Selecciona desde qué almacenes saldrá la mercadería. Si el primero no alcanza, selecciona más en secuencia.</p>
             {isLoadingCoverage ? ( <div className="py-8 text-center">Calculando cobertura...</div> ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
               {depositos.filter((d:any) => String(d.id) !== String(selectedModalSol.deposito_solicitante_id)).map((d:any) => {
                  const sels = solicitudOrigenSel[selectedModalSol.id] || [];
                  const idx = sels.indexOf(String(d.id));
                  const isSelected = idx !== -1;
                  const coverage = stockCoverage[d.id];
                  
                  let isLockedOut = false;
                  for (let i = 0; i < sels.length; i++) {
                     if (String(sels[i]) !== String(d.id) && stockCoverage[Number(sels[i])]?.status === "FULL" && i <= idx) break; 
                     if (String(sels[i]) !== String(d.id) && stockCoverage[Number(sels[i])]?.status === "FULL" && !isSelected) isLockedOut = true;
                  }

                  return (
                    <button key={d.id} disabled={isLockedOut || (!isSelected && coverage?.status === "NONE")}
                      onClick={() => setSolicitudOrigenSel(prev => {
                            const cur = prev[selectedModalSol.id] || [];
                            return isSelected ? { ...prev, [selectedModalSol.id]: cur.filter(x => x !== String(d.id)) } : { ...prev, [selectedModalSol.id]: [...cur, String(d.id)] };
                      })}
                      className={"relative flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all " + (isSelected ? "bg-indigo-50 border-indigo-500 text-indigo-700" : isLockedOut || coverage?.status === "NONE" ? "bg-slate-50 border-slate-100 text-slate-300 opacity-60 cursor-not-allowed" : "bg-white border-slate-200 hover:border-indigo-300")}
                    >
                       <MapPin className={"w-8 h-8 mb-2 " + (isSelected ? "text-indigo-500" : coverage?.status === "NONE" ? "text-slate-300" : "text-amber-500")} />
                       <span className="font-black text-[10px] tracking-widest text-center uppercase leading-tight mb-2 h-6">{d.nombre}</span>
                       <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase mt-auto " + (coverage?.status==="FULL" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : coverage?.status==="PARTIAL" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-400 border-slate-200")}>
                          {coverage?.status==="FULL" ? "COMPLETA 100%" : coverage?.status==="PARTIAL" ? "INCOMPLETA STOCK" : "SIN STOCK"}
                       </span>
                       {isSelected && (<div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center border-2 border-white">{idx + 1}</div>)}
                    </button>
                  )
               })}
             </div>
             )}
             <button onClick={() => setIsSubModalOriginOpen(false)} className="w-full bg-slate-900 text-white font-black py-4 uppercase text-sm rounded-xl">Hecho</button>
          </div>
        </Modal>
      )}

      {/* HISTORIAL GLOBAL */}
      {activeTab === 'historial' && (
         <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-2xl flex items-center gap-2"><History className="w-8 h-8 text-indigo-500" /> Historial Global de Remitos</h3>
                <button onClick={fetchGlobalHistorial} className="font-bold border border-slate-200 px-4 py-2 rounded-xl text-indigo-600 bg-white">Refrescar</button>
            </div>
            <div className="flex gap-4 mb-8">
                <input type="text" placeholder="Buscar por remito, origen o destino..." value={historialSearch} onChange={e=>setHistorialSearch(e.target.value)} className="w-full px-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500" />
                <input type="date" value={historialDate} onChange={e=>setHistorialDate(e.target.value)} className="w-64 px-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {globalHistorial.filter(r => (!historialDate || r.fecha_creacion.startsWith(historialDate)) && (!historialSearch || r.numeracion?.toLowerCase().includes(historialSearch.toLowerCase()) || r.origen_nombre?.toLowerCase().includes(historialSearch.toLowerCase()) || r.destino_nombre?.toLowerCase().includes(historialSearch.toLowerCase()))).map((rem:any) => (
                       <div key={rem.id} onClick={() => { handleVerHistorialDetalles(rem); setIsViewingFullscreenPDF(true); }} className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col gap-6 cursor-pointer hover:border-indigo-400 group">
                           <div className="flex items-start gap-4">
                               <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600"><PackageCheck className="w-6 h-6" /></div>
                               <div>
                                   <div className="flex flex-wrap gap-2 mb-2">
                                       <span className="bg-slate-900 text-white text-xs font-black uppercase px-2 rounded-md">{rem.numeracion}</span>
                                       <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 rounded-md">{new Date(rem.fecha_creacion).toLocaleDateString()}</span>
                                   </div>
                                   <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-rose-400"/> {rem.origen_nombre}</p>
                                   <p className="text-xs font-bold text-slate-400 flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-indigo-400"/> {rem.destino_nombre}</p>
                               </div>
                           </div>
                           <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                               <p className="text-xs font-black text-slate-500">{rem.total_items} Items</p>
                               <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-full font-black uppercase">{rem.estado}</span>
                           </div>
                       </div>
                ))}
            </div>
         </div>
      )}

      {/* FULLSCREEN PDF VISOR HISTORIAL */}
      {isViewingFullscreenPDF && selectedHistorialRemito && (
        <div id="print-root" className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 flex flex-col items-center">
            <div className="hide-on-print fixed top-6 right-6 flex gap-4 z-[110]">
              <button onClick={() => { setTimeout(() => window.print(), 100); }} className="bg-indigo-600 text-white p-4 rounded-full hover:bg-indigo-700 flex items-center shadow-lg"><span className="font-black text-xs uppercase">Imprimir A4</span></button>
              <button onClick={() => { setIsViewingFullscreenPDF(false); setSelectedHistorialRemito(null); }} className="bg-white text-slate-900 p-4 rounded-full hover:bg-slate-200"><span className="font-black text-xs uppercase">Cerrar</span></button>
            </div>
            {(selectedHistorialRemito.cart.length > 0 ? selectedHistorialRemito.cart.reduce((acc:any, curr:any, i:number) => { if (i % 30 === 0) acc.push([]); acc[acc.length - 1].push(curr); return acc; }, []) : [[]]).map((pageItems:any, pageIndex:number) => (
                    <div key={pageIndex} className="w-[794px] min-h-[1123px] bg-white text-slate-800 font-sans p-10 mb-4 shrink-0 shadow-xl" style={{ pageBreakAfter: 'always' }}>
                        <div className="flex justify-between border-b pb-5 mb-5 align-top">
                            <div>
                                <h1 className="text-3xl font-black mb-1">REMITO DE MOVIMIENTO</h1>
                            </div>
                            <div className="text-right">
                                <span className="font-mono font-black border border-slate-200 px-3 py-1 rounded-md">{selectedHistorialRemito.codigo}</span>
                                <p className="font-bold text-xs mt-2">{selectedHistorialRemito.fecha}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="border border-slate-200 p-4 rounded-xl"><p className="text-[10px] font-bold text-slate-400">Origen</p><p className="font-black">{selectedHistorialRemito.origen}</p></div>
                            <div className="border border-slate-200 p-4 rounded-xl"><p className="text-[10px] font-bold text-slate-400">Destino</p><p className="font-black">{selectedHistorialRemito.destino}</p></div>
                        </div>
                        <table className="w-full text-left bg-slate-50 border rounded-xl border-collapse">
                            <thead><tr className="border-b"><th className="py-2 px-3 text-[10px] bg-white border-r">Cant.</th><th className="py-2 px-3 text-[10px] bg-white">Artículo</th></tr></thead>
                            <tbody className="divide-y">
                                {pageItems.map((c:any, idx:number)=>(
                                   <tr key={idx} className="bg-white"><td className="py-2 px-3 border-r font-black text-center">{c.cantidad_a_extraer || c.cantidad_enviada}</td><td className="py-2 px-3 font-bold">{c.producto_nombre} <span className="text-[10px] bg-slate-100 font-normal px-2 ml-2 rounded">{c.nombre_variante}</span></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
            ))}
        </div>
      )}

      {/* FULLSCREEN PDF PARA NUEVO REMITO */}
      {isViewingFullscreenPDF && remitoPDFInfo && !selectedHistorialRemito && (
        <div id="print-root" className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 flex flex-col items-center">
            <div className="hide-on-print fixed top-6 right-6 flex gap-4 z-[110]">
              <button onClick={() => { setTimeout(() => window.print(), 100); }} className="bg-indigo-600 text-white p-4 rounded-full flex items-center shadow-lg"><span className="font-black text-xs">Imprimir A4</span></button>
              <button onClick={() => { setIsViewingFullscreenPDF(false); setRemitoPDFInfo(null); setSelectedModalSol(null); }} className="bg-white p-4 rounded-full"><span className="font-black text-xs">Cerrar</span></button>
            </div>
            
            {(remitoPDFInfo.cart.length > 0 ? remitoPDFInfo.cart.reduce((acc:any, curr:any, i:number) => { if (i % 30 === 0) acc.push([]); acc[acc.length - 1].push(curr); return acc; }, []) : [[]]).map((pageItems:any, pageIndex:number) => (
                    <div key={pageIndex} className="w-[794px] min-h-[1123px] bg-white text-slate-800 font-sans p-10 mb-4 shrink-0 shadow-xl" style={{ pageBreakAfter: 'always' }}>
                        <div className="flex justify-between border-b pb-5 mb-5 align-top">
                            <div><h1 className="text-3xl font-black mb-1">REMITO DESPACHO (NUEVO)</h1></div>
                            <div className="text-right">
                                <span className="font-mono font-black border border-slate-200 px-3 py-1 rounded-md">{remitoPDFInfo.codigo}</span>
                                <p className="font-bold text-xs mt-2">{remitoPDFInfo.fecha}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="border border-slate-200 p-4 rounded-xl"><p className="text-[10px] font-bold text-slate-400">Origen Consolidado</p><p className="font-black">{remitoPDFInfo.origen}</p></div>
                            <div className="border border-slate-200 p-4 rounded-xl"><p className="text-[10px] font-bold text-slate-400">Destino</p><p className="font-black">{remitoPDFInfo.destino}</p></div>
                        </div>
                        <table className="w-full text-left border rounded-xl border-collapse">
                            <thead><tr className="border-b"><th className="py-2 px-3 text-[10px] border-r">Cantidad</th><th className="py-2 px-3 text-[10px] border-r">Lotes (Multi-Secuencia)</th><th className="py-2 px-3 text-[10px]">Artículo</th></tr></thead>
                            <tbody className="divide-y">
                                {pageItems.map((c:any, idx:number)=>(
                                   <tr key={idx} className="bg-white"><td className="py-2 px-3 border-r font-black text-center">{c.cantidad_a_extraer}</td><td className="py-2 px-3 border-r font-mono text-xs">{c.codigo_barras}</td><td className="py-2 px-3 font-bold">{c.producto_nombre} <span className="text-[10px] font-normal px-2 ml-2 rounded bg-slate-100">{c.nombre_variante}</span></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
            ))}
        </div>
      )}
`;

if (!code.includes('PANEL SOLICITUDES')) {
    code = code.replace('{/* MODALES CLAVE */}', solicitudesViewAndModals + '\n      {/* MODALES CLAVE */}');
}

fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
console.log('Restoration Master Script Finished');

} catch(e) { console.error(e); }
