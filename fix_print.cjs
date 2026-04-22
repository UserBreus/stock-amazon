const fs = require('fs');
const file = 'src/components/DespachoEgresos.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  "setRemitoPDFInfo({ cart: [...cart], destino: depositos.find(d => d.id.toString() === destinoId)?.nombre || 'Ubicación', codigo: executeRes?.[0]?.rem_code || 'REM-0000', fecha: new Date().toLocaleString(), nuevasEtiquetas: labelsToPrint });",
  "setRemitoPDFInfo({ cart: [...cart], origen: depositos.find(d => d.id.toString() === origenId)?.nombre || 'Bodega de Origen', destino: depositos.find(d => d.id.toString() === destinoId)?.nombre || 'Ubicación', codigo: executeRes?.[0]?.rem_code || 'REM-0000', fecha: new Date().toLocaleString(), nuevasEtiquetas: labelsToPrint });"
);

const originalPrintBlockStart = '<div className="hidden @media print:block text-left p-8 absolute inset-0 bg-white z-[999] text-black h-screen">';
let startIndex = c.indexOf(originalPrintBlockStart);
if (startIndex !== -1) {
    let endIndex = c.indexOf('</div>', c.indexOf('</div>', startIndex) + Math.max(0, 100)) + 6; // To find the end of the <div>. Actually let's just find the exact text because the original one is small and predictable.
}

// Alternatively, replace the exact generic block:
const regexGenericBlock = /<div className="hidden @media print:block text-left p-8 absolute inset-0 bg-white z-\[999\] text-black h-screen">[\s\S]*?<\/table>\s*<\/div>/;

const newPrintBlock = `<div className="hidden @media print:block text-left p-10 absolute inset-0 bg-white z-[999] text-black h-auto min-h-screen font-sans">
                      <div className="flex justify-between items-start border-2 border-black rounded-xl p-4 relative mb-6">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white border-2 border-black border-t-0 p-2 font-black text-3xl">X</div>
                          
                          <div className="w-1/2 pr-6 border-r-2 border-black">
                              <h1 className="text-3xl font-black mb-1 leading-tight">DOCUMENTO NO VÁLIDO COMO FACTURA</h1>
                              <p className="font-bold text-lg leading-tight uppercase">SISTEMA INTERNO WMS</p>
                              <p className="text-sm mt-4 tracking-widest font-mono text-slate-600">COMPROBANTE DE TRASLADO FÍSICO</p>
                          </div>
                          <div className="w-1/2 pl-6 text-right">
                              <h2 className="text-3xl font-black uppercase mb-4 tracking-tight">REMITO</h2>
                              <div className="inline-block text-left">
                                  <p className="text-sm mb-1"><strong>N° Documento:</strong> <span className="font-mono text-base">{remitoPDFInfo.codigo}</span></p>
                                  <p className="text-sm mb-1"><strong>Fecha Emisión:</strong> <span className="font-mono text-base">{remitoPDFInfo.fecha}</span></p>
                                  <p className="text-sm"><strong>Operador Logístico:</strong> <span className="font-mono text-base">{(user as any)?.nombre || 'Automático'}</span></p>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="border-2 border-black p-4 rounded-xl bg-slate-50">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sale desde (Origen Logístico)</p>
                              <p className="font-black text-xl text-slate-900">{remitoPDFInfo.origen || depositos.find(d => d.id.toString() === origenId)?.nombre || 'Bodega Principal'}</p>
                          </div>
                          <div className="border-2 border-black p-4 rounded-xl bg-slate-50">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Llega a (Destino Físico)</p>
                              <p className="font-black text-xl text-slate-900">{remitoPDFInfo.destino}</p>
                          </div>
                      </div>

                      <table className="w-full mb-10 border-2 border-black">
                         <thead>
                            <tr className="bg-slate-200 border-b-2 border-black">
                                <th className="text-center py-3 border-r-2 border-black w-24 text-sm font-black">CANTIDAD</th>
                                <th className="text-center py-3 border-r-2 border-black w-48 text-sm font-black">CÓDIGO (LOTE)</th>
                                <th className="text-left py-3 px-4 border-r-2 border-black text-sm font-black">DESCRIPCIÓN DEL ARTÍCULO</th>
                                <th className="text-center py-3 text-sm font-black w-32">VARIACIÓN</th>
                            </tr>
                         </thead>
                         <tbody>
                            {remitoPDFInfo.cart.map((c:any)=>(
                               <tr key={c.codigo_barras} className="border-b border-black">
                                  <td className="text-center py-4 border-r-2 border-black font-black text-xl">{c.cantidad_a_extraer}</td>
                                  <td className="text-center py-4 border-r-2 border-black font-mono font-bold text-sm tracking-tighter">{c.codigo_barras}</td>
                                  <td className="text-left py-4 px-4 border-r-2 border-black font-bold uppercase text-slate-800">{c.producto_nombre}</td>
                                  <td className="text-center py-4 font-bold text-xs uppercase bg-slate-50">{c.nombre_variante}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>

                      <div className="grid grid-cols-2 gap-24 mt-32 px-10">
                          <div className="border-t-2 border-black text-center pt-2">
                              <p className="font-black uppercase tracking-widest text-sm">Firma de Entrega (Origen)</p>
                              <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">Aclaración y DNI</p>
                          </div>
                          <div className="border-t-2 border-black text-center pt-2">
                              <p className="font-black uppercase tracking-widest text-sm">Firma de Recepción (Destino)</p>
                              <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">Aclaración y Fecha de Ingreso</p>
                          </div>
                      </div>

                      <div className="mt-12 text-center border-t border-slate-300 pt-4">
                           <p className="text-[9px] uppercase font-mono text-slate-400 font-bold tracking-widest">Documento Remito X generado mediante Módulo Despachos WMS</p>
                      </div>
                  </div>`;

c = c.replace(regexGenericBlock, newPrintBlock);
fs.writeFileSync(file, c);
console.log('Document format injected');
