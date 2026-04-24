const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const targetModalStart = `      {/* ╔ MODAL: ÓRDENES SOLICITADAS (Remito interno) */}`;
const modalStartIndex = code.indexOf(targetModalStart);

if (modalStartIndex !== -1) {
    const endModalIndex = code.indexOf('</Modal>', modalStartIndex) + 8;
    const oldModalUI = code.substring(modalStartIndex, endModalIndex);

    const newModalUI = `      {/* ╔ MODAL: ÓRDENES SOLICITADAS (Remito interno) */}
      <Modal isOpen={!!selectedModalSol} onClose={() => setSelectedModalSol(null)} title={\`Orden Pendiente: \${selectedModalSol?.numeracion || ''}\`}>
         {selectedModalSol && (
            <div className="space-y-6">
               
               {/* NUEVO BOTON ORIGEN SUPERIOR */}
               <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-500">
                       Orígenes de Extracción
                    </span>
                 </div>
                 <button
                    onClick={() => setIsSubModalOriginOpen(true)}
                    className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:border-amber-500 text-xs font-bold text-slate-700 dark:text-slate-200 py-1.5 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2"
                 >
                    {solicitudOrigenSel[selectedModalSol.id]?.length > 0
                        ? \`\${solicitudOrigenSel[selectedModalSol.id].length} Almacén(es) Seleccionado(s) - Cambiar\`
                        : 'Elegir Origen...'}
                 </button>
               </div>

               <div className="flex bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 items-center justify-between mt-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Sector Solicitante (Destino)</p>
                    <p className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-500" />
                      {selectedModalSol.sector_nombre}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fecha</p>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(selectedModalSol.fecha_creacion).toLocaleString()}</p>
                  </div>
               </div>

               <div>
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Artículos Solicitados</h4>
                 {!solicitudItems[selectedModalSol.id] ? (
                    <div className="py-8 text-center text-slate-400 text-sm animate-pulse">Cargando ítems...</div>
                 ) : solicitudItems[selectedModalSol.id].length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">Sin ítems registrados.</div>
                 ) : (
                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Artículo</th>
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Variante</th>
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Requerido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {solicitudItems[selectedModalSol.id].map((item:any, idx:number) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white uppercase">{item.producto_nombre}</td>
                              <td className="px-5 py-3.5 text-slate-500 font-medium">{item.nombre_variante}</td>
                              <td className="px-5 py-3.5 text-center font-black text-lg text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 w-24">
                                {item.cantidad_solicitada}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 )}
               </div>

               <button
                  onClick={() => handleEnviarSolicitud(selectedModalSol)}
                  disabled={!solicitudOrigenSel[selectedModalSol.id] || solicitudOrigenSel[selectedModalSol.id].length === 0 || enviandoSolicitud === selectedModalSol.id}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
               >
                  <Truck className="w-5 h-5" />
                  {enviandoSolicitud === selectedModalSol.id ? 'Aprobando y procesando Remito...' : 'Aprobar y Despachar a Sector'}
               </button>
            </div>
         )}
      </Modal>

      {/* SUB-MODAL ORÍGENES */}
      {isSubModalOriginOpen && selectedModalSol && (
        <Modal isOpen={true} onClose={() => setIsSubModalOriginOpen(false)} title="Prioridad de Extracción Física">
          <div className="space-y-4">
             <p className="text-sm font-medium text-slate-500">
               Seleccioná los almacenes y el orden logístico en el cual deseas que el sistema persiga el stock para completar este pedido. El sistema descontará secuencialmente del [1], luego [2] y así.
             </p>
             <div className="grid grid-cols-1 gap-2 pt-2">
               {depositos.filter(d => String(d.id) !== String(selectedModalSol.deposito_solicitante_id)).map(d => {
                  const sels = solicitudOrigenSel[selectedModalSol.id] || [];
                  const idx = sels.indexOf(String(d.id));
                  const isSelected = idx !== -1;
                  return (
                    <button
                      key={d.id}
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
                      className={cn("w-full flex items-center justify-between p-4 border rounded-xl font-bold transition-all", isSelected ? "bg-amber-500 text-white border-amber-600 shadow" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:text-white")}
                    >
                       <span className="flex items-center gap-3"><MapPin className={cn("w-5 h-5", isSelected ? "text-white" : "text-slate-400")}/> {d.nombre}</span>
                       {isSelected ? (
                          <span className="w-8 h-8 rounded-full bg-white text-amber-600 font-black flex items-center justify-center shadow-sm">
                             {idx + 1}
                          </span>
                       ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                       )}
                    </button>
                  )
               })}
             </div>
             <button onClick={() => setIsSubModalOriginOpen(false)} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 uppercase tracking-widest text-sm rounded-xl shadow-lg transition-all">
                Confirmar Niveles
             </button>
          </div>
        </Modal>
      )}

      {/* PORTAL IMPRESIÓN WMS REMITOS */}
      {isViewingFullscreenPDF && remitoPDFInfo && (
        <div className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 sm:p-10 flex flex-col items-center gap-8 print:static print:inset-auto print:h-auto print:w-auto print:overflow-visible print:block print:p-0 print:bg-white hide-scrollbar">
            <div className="hide-on-print fixed top-6 right-6 flex gap-4 z-[110]">
              <button
                onClick={() => {
                  printRemito(
                    remitoPDFInfo.cart,
                    {
                      codigo: remitoPDFInfo.codigo,
                      fecha: remitoPDFInfo.fecha,
                      estado: 'EN_TRANSITO',
                      origen: remitoPDFInfo.origen,
                      destino: remitoPDFInfo.destino,
                    },
                    'despacho'
                  );
                }}
                className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-110 flex items-center justify-center"
              >
                 <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Printer className="w-4 h-4"/> Imprimir Hoja</span>
              </button>
              <button onClick={() => { setIsViewingFullscreenPDF(false); setRemitoPDFInfo(null); }} className="bg-white text-slate-900 p-4 rounded-full shadow-2xl hover:bg-slate-200 transition-transform hover:scale-110 flex items-center justify-center">
                 <span className="font-black text-xs uppercase tracking-widest">X Cerrar</span>
              </button>
            </div>
            
            <div id="print-root" className="w-full flex flex-col items-center gap-12 print:block print:static print:w-full print:h-auto print:overflow-visible">
                {(remitoPDFInfo.cart.length > 0 ? remitoPDFInfo.cart.reduce((acc:any[], curr:any, i:number) => { if (i % 30 === 0) acc.push([]); acc[acc.length - 1].push(curr); return acc; }, []) : [[]]).map((pageItems:any[], pageIndex:number, pagesArray:any[]) => (
                    <div key={pageIndex} className="w-[794px] min-h-[1123px] bg-white text-slate-800 font-sans p-10 shadow-2xl relative border border-slate-100 flex flex-col shrink-0 " style={{ pageBreakAfter: 'always' }}>
                        <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-5 relative">
                            <div className="w-1/2 pr-6">
                                <h1 className="text-3xl font-black mb-1 tracking-tighter text-slate-900 leading-none">REMITO DE MOVIMIENTO</h1>
                                <p className="font-bold text-xs text-slate-400 uppercase tracking-widest">SISTEMA LOGÍSTICO INTERNO · WMS</p>
                            </div>
                            <div className="w-1/2 pl-6 text-right">
                                <div className="inline-block text-left bg-slate-50 p-4 rounded-xl border border-slate-100 w-full">
                                    <div className="flex justify-between mb-2 border-b border-slate-100 pb-2">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">N° Documento</span>
                                        <span className="font-mono font-black text-slate-700 text-sm">{remitoPDFInfo.codigo}</span>
                                    </div>
                                    <div className="flex justify-between mb-2 border-b border-slate-100 pb-2">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Fecha Operación</span>
                                        <span className="font-mono font-bold text-slate-700 text-xs">{remitoPDFInfo.fecha}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Estado</span>
                                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">EN_TRANSITO</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="border border-slate-100 p-4 rounded-xl bg-white shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-rose-400"/> Sale desde (Origen Logístico)</p>
                                <p className="font-black text-lg text-slate-800 leading-tight">{remitoPDFInfo.origen}</p>
                            </div>
                            <div className="border border-slate-100 p-4 rounded-xl bg-white shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-indigo-400"/> Llega a (Destino Físico)</p>
                                <p className="font-black text-lg text-slate-800 leading-tight">{remitoPDFInfo.destino}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden mb-auto">
                            <table className="w-full text-left">
                               <thead>
                                  <tr className="border-b border-slate-200 bg-slate-50">
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100 text-center w-24">C. ENV</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100 text-center w-24">C. REC</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100">ARTÍCULO / DESCRIPCIÓN</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black text-center w-40">VAR / LOTE</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {pageItems.map((c:any, idx:number)=>(
                                     <tr key={c.id + '-' + idx} className="bg-white hover:bg-slate-50">
                                        <td className="text-center py-1.5 px-3 border-r border-slate-100 font-black text-[11px] text-slate-700">{c.cantidad_a_extraer}</td>
                                        <td className="text-center py-1.5 px-3 border-r border-slate-100 font-black text-[11px] text-emerald-600">-</td>
                                        <td className="py-1.5 px-3 border-r border-slate-100 font-bold tracking-tight text-slate-800 text-[11px]">{c.producto_nombre}</td>
                                        <td className="text-center py-1.5 px-2 font-bold text-[9px] uppercase tracking-widest text-slate-500">{c.nombre_variante}</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-2 gap-16 mt-6 pt-6 px-6">
                            <div className="border-t border-dashed border-slate-300 text-center pt-2">
                                <p className="font-black uppercase tracking-widest text-[10px] text-slate-800">Firma de Entrega (Origen)</p>
                                <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">ACLARACIÓN Y DNI</p>
                            </div>
                            <div className="border-t border-dashed border-slate-300 text-center pt-2">
                                <p className="font-black uppercase tracking-widest text-[10px] text-slate-800">Firma de Recepción (Destino)</p>
                                <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">ACLARACIÓN Y FECHA</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-3 flex justify-between items-center opacity-40 px-6">
                             <p className="text-[9px] uppercase font-mono text-slate-900 font-bold tracking-widest flex items-center gap-1.5">
                                <CheckCircle className="w-3 h-3" />
                                WMS · DOC. DIGITAL
                             </p>
                             <p className="text-[9px] uppercase font-mono text-slate-900 font-bold tracking-widest">
                                HOJA {pageIndex + 1} DE {pagesArray.length}
                             </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}`;
      
    code = code.replace(oldModalUI, newModalUI);
    fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
    console.log("Successfully replaced UI and injected printable PDF workflow.");
} else {
    console.log("Target modal start not found!");
}
