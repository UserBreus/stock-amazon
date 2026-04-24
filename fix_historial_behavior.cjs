const fs = require('fs');

// Patch DespachoEgresos.tsx
let egresos = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

// Remove the Historial button from the tabs mapping
egresos = egresos.replace(
  `{ id: 'solicitudes', icon: Send, label: 'Integración Solicitudes' },\n              { id: 'historial', icon: Clock, label: 'Historial y Analítica' },`,
  `{ id: 'solicitudes', icon: Send, label: 'Integración Solicitudes' },`
);

// Remove the Historial UI block completely
const histStart = egresos.indexOf("{/* HISTORIAL Y ANALÍTICA */}");
const histEnd = egresos.indexOf("</div>\n      \n      {isCameraOpen && (");
if (histStart > -1 && histEnd > -1) {
    egresos = egresos.substring(0, histStart) + egresos.substring(histEnd);
}

fs.writeFileSync('src/components/DespachoEgresos.tsx', egresos);


// Patch InventarioGerencial.tsx
let gerencial = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

/* 
 The user wants to SEE the A4 preview when they click a history remito, NOT the "¡Despacho Registrado!" success modal.
 However, we still want the success modal when they actually DISPATCH a new order! 
 So, we need to introduce a new state flag `isViewingFullscreenPDFFromHistorial` or similar to just show the preview,
 OR we can just restore the full HTML portal but only trigger it for history directly, bypassing the success modal.
*/

// Let's create an independent full screen portal for the Historial viewer
const historialPortal = `
      {/* GLOBAL VIEW HISTORIAL PORTAL */}
      {selectedHistorialRemito && (
        <div className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 sm:p-10 flex flex-col items-center gap-8 print:static print:inset-auto print:h-auto print:w-auto print:overflow-visible print:block print:p-0 print:bg-white hide-scrollbar">
            <div className="hide-on-print fixed top-6 right-6 flex gap-4 z-[110]">
              <button
                onClick={() => {
                  printRemito(
                    selectedHistorialRemito.cart,
                    {
                      codigo: selectedHistorialRemito.codigo,
                      fecha: selectedHistorialRemito.fecha,
                      estado: 'EN_TRANSITO',
                      origen: selectedHistorialRemito.origen,
                      destino: selectedHistorialRemito.destino,
                    },
                    'despacho'
                  );
                }}
                className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-110 flex items-center justify-center"
              >
                 <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Printer className="w-4 h-4"/> Imprimir Hoja</span>
              </button>
              <button onClick={() => setSelectedHistorialRemito(null)} className="bg-white text-slate-900 p-4 rounded-full shadow-2xl hover:bg-slate-200 transition-transform hover:scale-110 flex items-center justify-center">
                 <span className="font-black text-xs uppercase tracking-widest">X Cerrar</span>
              </button>
            </div>
            
            <div id="print-root" className="w-full flex flex-col items-center gap-12 print:block print:static print:w-full print:h-auto print:overflow-visible">
                {(selectedHistorialRemito.cart.length > 0 ? selectedHistorialRemito.cart.reduce((acc, curr, i) => { if (i % 30 === 0) acc.push([]); acc[acc.length - 1].push(curr); return acc; }, []) : [[]]).map((pageItems, pageIndex, pagesArray) => (
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
                                        <span className="font-mono font-black text-slate-700 text-sm">{selectedHistorialRemito.codigo}</span>
                                    </div>
                                    <div className="flex justify-between mb-2 border-b border-slate-100 pb-2">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Fecha Operación</span>
                                        <span className="font-mono font-bold text-slate-700 text-xs">{selectedHistorialRemito.fecha}</span>
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
                                <p className="font-black text-lg text-slate-800 leading-tight">{selectedHistorialRemito.origen}</p>
                            </div>
                            <div className="border border-slate-100 p-4 rounded-xl bg-white shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-indigo-400"/> Llega a (Destino Físico)</p>
                                <p className="font-black text-lg text-slate-800 leading-tight">{selectedHistorialRemito.destino}</p>
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
                                  {pageItems.map((c, idx)=>(
                                     <tr key={c.id + '-' + idx} className="bg-white hover:bg-slate-50">
                                        <td className="text-center py-1.5 px-3 border-r border-slate-100 font-black text-[11px] text-slate-700">{c.cantidad_a_extraer || c.cantidad_enviada}</td>
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
      )}
`;

// Replace the handleVerHistorialDetalles logic so it populates selectedHistorialRemito instead of remitoPDFInfo
gerencial = gerencial.replace(
  /setRemitoPDFInfo\({\s*cart: detailRes/g,
  "setSelectedHistorialRemito({ cart: detailRes"
);

// Inject the new portal right before the final </div>
gerencial = gerencial.substring(0, gerencial.lastIndexOf("</div>")) + historialPortal + "\n    </div>";

fs.writeFileSync('src/pages/InventarioGerencial.tsx', gerencial);
console.log('Update done!');
