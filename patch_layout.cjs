const fs = require('fs');

try {
    let desp = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

    // Make the title match
    desp = desp.replace('REMITO DE SALIDA', 'REMITO DE MOVIMIENTO');
    
    // Add the "Estado" indicator exactly as in InventarioOperativo
    const tEstado = `<div className="flex justify-between">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Autorizado por</span>
                                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">WMS DIGITAL</span>
                                    </div>`;
                                    
    const rEstado = `<div className="flex justify-between">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Estado</span>
                                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">EN_TRANSITO</span>
                                    </div>`;
    desp = desp.replace(tEstado, rEstado);
    
    // Replace table headers
    const tHead = `<tr className="border-b border-slate-200 bg-slate-50">
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100 text-center w-24">CANTIDAD</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100 text-center w-24">CÓDIGO</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100">ARTÍCULO / DESCRIPCIÓN</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black text-center w-40">VARIACIÓN</th>
                                  </tr>`;
                                  
    const rHead = `<tr className="border-b border-slate-200 bg-slate-50">
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100 text-center w-24">C. ENV</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100 text-center w-24">C. REC</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100">ARTÍCULO / DESCRIPCIÓN</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black text-center w-40">VAR / LOTE</th>
                                  </tr>`;
    desp = desp.replace(tHead, rHead);
    
    // Replace table row mapping
    const tRow = `{pageItems.map((c:any, idx:number)=>(
                                     <tr key={c.id + '-' + idx} className="bg-white hover:bg-slate-50">
                                        <td className="text-center py-1.5 px-3 border-r border-slate-100 font-black text-[11px] text-slate-700">{c.cantidad_a_extraer}</td>
                                        <td className="text-center py-1.5 px-3 border-r border-slate-100 font-mono font-bold text-[10px] tracking-tighter text-slate-500">{c.codigo_barras}</td>
                                        <td className="py-1.5 px-3 border-r border-slate-100 font-bold tracking-tight text-slate-800 text-[11px]">{c.producto_nombre}</td>
                                        <td className="text-center py-1.5 px-2 font-bold text-[9px] uppercase tracking-widest text-slate-500">{c.nombre_variante}</td>
                                     </tr>
                                  ))}`;
                                  
    const rRow = `{pageItems.map((c:any, idx:number)=>(
                                     <tr key={c.id + '-' + idx} className="bg-white hover:bg-slate-50">
                                        <td className="text-center py-1.5 px-3 border-r border-slate-100 font-black text-[11px] text-slate-700">{c.cantidad_a_extraer}</td>
                                        <td className="text-center py-1.5 px-3 border-r border-slate-100 font-black text-[11px] text-emerald-600">-</td>
                                        <td className="py-1.5 px-3 border-r border-slate-100 font-bold tracking-tight text-slate-800 text-[11px]">{c.producto_nombre}</td>
                                        <td className="text-center py-1.5 px-2 font-bold text-[9px] uppercase tracking-widest text-slate-500">{c.nombre_variante}</td>
                                     </tr>
                                  ))}`;
    desp = desp.replace(tRow, rRow);
    
    // fix remito code bug
    desp = desp.replace(
        'codigo: isTransfer && Array.isArray(executeRes) && executeRes.length>0 ? executeRes[0].rem_code : `EXT-${Date.now()}`,',
        'codigo: isTransfer ? remitoCode : `EXT-${Date.now()}`,'
    );

    fs.writeFileSync('src/components/DespachoEgresos.tsx', desp);
    console.log('Fixed DespachoEgresos Print Layout');

} catch (e) {
    console.error(e);
}
