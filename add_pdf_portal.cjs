const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const targetStr = `{/* PORTAL IMPRESIÓN WMS REMITOS */}`;
const pdfCode = `
      {/* PORTAL IMPRESIÓN WMS REMITOS NEW */}
      {isViewingFullscreenPDF && remitoPDFInfo && !selectedHistorialRemito && (
        <div id="print-root" className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 sm:p-10 flex justify-center print:static print:w-full print:bg-white print:p-0 print:block">
            <div className="hide-on-print fixed top-6 right-6 flex gap-4 z-[110]">
              <button onClick={() => { setTimeout(() => window.print(), 100); }} className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-110 flex items-center justify-center">
                 <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Printer className="w-4 h-4"/> Imprimir Hoja</span>
              </button>
              <button onClick={() => { setIsViewingFullscreenPDF(false); setRemitoPDFInfo(null); }} className="bg-white text-slate-900 p-4 rounded-full shadow-2xl hover:bg-slate-200 transition-transform hover:scale-110 flex items-center justify-center">
                 <span className="font-black text-xs uppercase tracking-widest">X Cerrar</span>
              </button>
            </div>
            <div className="w-full max-w-[900px] bg-white text-slate-800 font-sans p-12 min-h-[1056px] shadow-2xl relative border border-slate-100 rounded-3xl my-10 flex flex-col print:block print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:max-w-full print:rounded-none">
                <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8 relative">
                    <div className="w-1/2 pr-6">
                        <h1 className="text-4xl font-black mb-2 tracking-tighter text-slate-900 leading-none">REMITO DE SALIDA</h1>
                        <p className="font-bold text-sm text-slate-400 uppercase tracking-widest">SISTEMA LOGÍSTICO INTERNO · WMS</p>
                    </div>
                    <div className="w-1/2 pl-6 text-right">
                        <div className="inline-block text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 w-full">
                            <div className="flex justify-between mb-3 border-b border-slate-100 pb-3">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">N° Documento</span>
                                <span className="font-mono font-black text-slate-700">{remitoPDFInfo.codigo}</span>
                            </div>
                            <div className="flex justify-between mb-3 border-b border-slate-100 pb-3">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Fecha Operación</span>
                                <span className="font-mono font-bold text-slate-700">{remitoPDFInfo.fecha}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Operador</span>
                                <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{remitoPDFInfo.emisor || 'Sistema'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="border border-slate-100 p-6 rounded-2xl bg-white shadow-[0_0_40px_-15px_rgba(0,0,0,0.05)]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ArrowUpRight className="w-3 h-3 text-rose-400"/> Sale desde (Origen Logístico)</p>
                        <p className="font-black text-2xl text-slate-800 leading-tight">{remitoPDFInfo.origen || 'Bodega Principal'}</p>
                    </div>
                    <div className="border border-slate-100 p-6 rounded-2xl bg-white shadow-[0_0_40px_-15px_rgba(0,0,0,0.05)]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ArrowRightLeft className="w-3 h-3 text-indigo-400"/> Llega a (Destino Físico)</p>
                        <p className="font-black text-2xl text-slate-800 leading-tight">{remitoPDFInfo.destino}</p>
                    </div>
                </div>

                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden mb-16">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-slate-200">
                              <th className="py-4 px-6 print:py-1 print:px-2 print:text-[9px] w-24 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center border-r border-slate-100">CANT.</th>
                              <th className="py-4 px-6 print:py-1 print:px-2 print:text-[9px] w-32 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center border-r border-slate-100">LOTE / ID</th>
                              <th className="py-4 px-6 print:py-1 print:px-2 print:text-[9px] text-[10px] uppercase tracking-widest text-slate-400 font-bold border-r border-slate-100">ARTÍCULO / DESCRIPCIÓN</th>
                              <th className="py-4 px-6 print:py-1 print:px-2 print:text-[9px] text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center w-32">VARIACIÓN</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {remitoPDFInfo.cart.map((c:any, idx:number)=>(
                             <tr key={c.codigo_barras + '-' + idx} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="text-center py-4 px-6 print:py-1 print:text-[11px] border-r border-slate-100 font-black text-lg print:text-sm text-slate-700">{c.cantidad_actual || c.cantidad_a_extraer}</td>
                                <td className="text-center py-4 px-6 print:py-1 print:text-[11px] border-r border-slate-100 font-mono font-bold text-xs tracking-tighter text-slate-500">{c.codigo_barras}</td>
                                <td className="py-4 px-6 print:py-1 print:px-2 print:text-[11px] border-r border-slate-100 font-black tracking-tight text-slate-800">{c.producto_nombre}</td>
                                <td className="text-center py-4 px-6 print:py-1 print:text-[11px] font-bold text-[10px] uppercase bg-slate-50/50 tracking-widest text-slate-500">{c.nombre_variante}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-2 gap-24 mt-auto print:mt-10 pt-20 print:pt-6 px-10">
                    <div className="border-t border-dashed border-slate-300 text-center pt-4">
                        <p className="font-black uppercase tracking-widest text-xs text-slate-800">Firma de Entrega (Origen)</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">ACLARACIÓN Y DNI</p>
                    </div>
                    <div className="border-t border-dashed border-slate-300 text-center pt-4">
                        <p className="font-black uppercase tracking-widest text-xs text-slate-800">Firma de Recepción (Destino)</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">ACLARACIÓN Y FECHA</p>
                    </div>
                </div>
                
                <div className="mt-16 text-center pt-6 opacity-30">
                     <p className="text-[10px] uppercase font-mono text-slate-900 font-bold tracking-widest flex items-center justify-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        WMS INVENTARIO · DOCUMENTO GENERADO ELECTRÓNICAMENTE
                     </p>
                </div>
            </div>
        </div>
      )}
`;

if (code.includes(targetStr) && !code.includes('PORTAL IMPRESIÓN WMS REMITOS NEW')) {
    code = code.replace(targetStr, pdfCode);
    fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
    console.log('Added missing remitoPDFInfo Viewer.');
} else {
    // maybe encoded as PORTAL IMPRESI"N WMS REMITOS
    const backupTarget = `{/* PORTAL IMPRESI`;
    if (code.includes(backupTarget) && !code.includes('PORTAL IMPRESIÓN WMS REMITOS NEW')) {
        code = code.replace(new RegExp('\\{\\/\\* PORTAL IMPRESI.*WMS REMITOS \\*\\/\\}'), pdfCode);
        fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
        console.log('Added missing remitoPDFInfo Viewer via regex backoff.');
    } else {
        console.log('Target not found or already added.');
    }
}
