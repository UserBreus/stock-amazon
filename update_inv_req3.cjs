const fs = require('fs');

let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Add coverage state and fetch function
const stateInjectPoint = "const [isViewingFullscreenPDF, setIsViewingFullscreenPDF] = useState(false);";
if (code.includes(stateInjectPoint) && !code.includes('stockCoverage')) {
  code = code.replace(
      stateInjectPoint,
      `const [isViewingFullscreenPDF, setIsViewingFullscreenPDF] = useState(false);\n  const [stockCoverage, setStockCoverage] = useState<Record<number, {status: "FULL"|"PARTIAL"|"NONE"}>>({});\n  const [isLoadingCoverage, setIsLoadingCoverage] = useState(false);\n`
  );
  console.log('Added coverage logic states.');
}

const openSubModalFunction = `
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
     } catch (e) {
       console.error("Coverage fetch error", e);
     } finally {
       setIsLoadingCoverage(false);
     }
  };
`;

const insertOpenLogic = "const handleEnviarSolicitud = async (sol: any) => {";
if (code.includes(insertOpenLogic) && !code.includes('const openOriginSubModal')) {
    code = code.substring(0, code.indexOf(insertOpenLogic)) + openSubModalFunction + "\n  " + code.substring(code.indexOf(insertOpenLogic));
    console.log('Added openOriginSubModal function.');
}

// Map the origin UI to use openOriginSubModal
const subModalTargetTrigger = `onClick={() => setIsSubModalOriginOpen(true)}`;
if (code.includes(subModalTargetTrigger)) {
    code = code.replace(subModalTargetTrigger, `onClick={openOriginSubModal}`);
    console.log('Modified origin trigger.');
}

// 2. Rewrite the SubModal JSX
const subModalJSXStart = `{/* SUB-MODAL ORÍGENES */}`;
const subModalJSXEnd = `{/* PORTAL IMPRESIÓN WMS REMITOS */}`;
if (code.indexOf(subModalJSXStart) !== -1 && code.indexOf(subModalJSXEnd) !== -1) {
    const oldSubModal = code.substring(code.indexOf(subModalJSXStart), code.indexOf(subModalJSXEnd));
    const newSubModal = `{/* SUB-MODAL ORÍGENES */}
      {isSubModalOriginOpen && selectedModalSol && (
        <Modal isOpen={true} onClose={() => setIsSubModalOriginOpen(false)} title="Elegir Almacén Físico">
          <div className="space-y-6">
             <p className="text-sm font-medium text-slate-500">
               Selecciona desde qué almacén (modo cajero autom.) saldrá la mercadería requerida. Si la primera no alcanza, selecciona más en secuencia.
             </p>
             
             {isLoadingCoverage ? (
                <div className="py-8 text-center text-slate-400 font-bold animate-pulse">Analizando inventarios...</div>
             ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
               {depositos.filter(d => String(d.id) !== String(selectedModalSol.deposito_solicitante_id)).map(d => {
                  const sels = solicitudOrigenSel[selectedModalSol.id] || [];
                  const idx = sels.indexOf(String(d.id));
                  const isSelected = idx !== -1;
                  
                  const coverage = stockCoverage[d.id];
                  
                  // Check if order is already completely fulfilled by previous selections
                  // Since we only do visual check, we assume if one previously selected has FULL coverage, then next are disabled.
                  let isLockedOut = false;
                  for (let i = 0; i < sels.length; i++) {
                     if (String(sels[i]) !== String(d.id) && stockCoverage[Number(sels[i])]?.status === "FULL" && i <= idx) {
                        break; 
                     }
                     if (String(sels[i]) !== String(d.id) && stockCoverage[Number(sels[i])]?.status === "FULL" && !isSelected) {
                        isLockedOut = true;
                     }
                  }

                  return (
                    <button
                      key={d.id}
                      disabled={isLockedOut || (!isSelected && coverage?.status === "NONE")}
                      onClick={() => {
                         setSolicitudOrigenSel(prev => {
                            const cur = prev[selectedModalSol.id] || [];
                            if (isSelected) {
                               return { ...prev, [selectedModalSol.id]: cur.filter(x => x !== String(d.id)) };
                            } else {
                               return { ...prev, [selectedModalSol.id]: [...cur, String(d.id)] };
                            }
                         });
                      }}
                      className={"relative flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all " + 
                         (isSelected ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md dark:bg-indigo-900/40 dark:border-indigo-400 dark:text-white" : 
                          isLockedOut || coverage?.status === "NONE" ? "bg-slate-50 border-slate-100 text-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-600 opacity-60 cursor-not-allowed" : 
                          "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300")}
                    >
                       <MapPin className={"w-8 h-8 mb-2 " + (isSelected ? "text-indigo-500" : coverage?.status === "NONE" ? "text-slate-300" : "text-amber-500")} />
                       <span className="font-black text-[10px] tracking-widest text-center uppercase leading-tight mb-2 h-6">{d.nombre}</span>
                       
                       {coverage?.status === "FULL" && (
                           <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase mt-auto">COMPLETA 100%</span>
                       )}
                       {coverage?.status === "PARTIAL" && (
                           <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase mt-auto">INCOMPLETA STOCK</span>
                       )}
                       {coverage?.status === "NONE" && (
                           <span className="text-[9px] text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-200 uppercase mt-auto">SIN STOCK</span>
                       )}

                       {isSelected && (
                          <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 pulse-animation">
                             {idx + 1}
                          </div>
                       )}
                    </button>
                  )
               })}
             </div>
             )}

             <button onClick={() => setIsSubModalOriginOpen(false)} className="w-full mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 uppercase tracking-widest text-sm rounded-xl shadow-lg transition-all">
                Cerrar y Despachar
             </button>
          </div>
        </Modal>
      )}

      `;
    code = code.replace(oldSubModal, newSubModal);
    console.log('SubModal rewritten to modern visual card layout.');
}

// 3. Insert intermediate PDF wrapper
const pdfPortalStart = `{/* PORTAL IMPRESIÓN WMS REMITOS */}`;
if (code.indexOf(pdfPortalStart) !== -1 && !code.includes('VER HOJA REMITO')) {
     const intermediateModal = `
      {/* MODAL REMITO CREADO INTERMEDIO */}
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
                  <button onClick={() => setRemitoPDFInfo(null)} className="btn-secondary w-full py-3 uppercase tracking-widest text-xs">Cerrar</button>
              </div>
          )}
      </Modal>

      {/* PORTAL IMPRESIÓN WMS REMITOS */}`;
      
     code = code.replace(pdfPortalStart, intermediateModal);
     console.log('Added intermediate Print wrapper modal.');
}

fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
