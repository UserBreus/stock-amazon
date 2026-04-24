const fs = require('fs');

try {
    let code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

    const t1 = '<div className="flex gap-3 pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 flex-wrap">';
    const r1 = '<div className="sticky -bottom-8 mt-6 -mx-8 -mb-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 px-8 flex gap-3 flex-wrap shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)] z-10">';
    code = code.replace(t1, r1);

    const t2 = '<button onClick={() => { setIsViewingFullscreenPDF(true); }} className="flex-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2">';
    const r2 = '<button onClick={() => { setIsViewingFullscreenPDF(true); }} className="flex-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform shadow-lg">';
    code = code.replace(t2, r2);

    const t3 = '<button onClick={() => { setRemitoDetalleItems(null); setSelectedActiveRemitoId(null); setSelectedRemitoEstado(null); }} className="flex-1 min-w-[120px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black py-4 rounded-xl">';
    const r3 = '<button onClick={() => { setRemitoDetalleItems(null); setSelectedActiveRemitoId(null); setSelectedRemitoEstado(null); }} className="flex-1 min-w-[100px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">';
    code = code.replace(t3, r3);

    const t4 = '<button onClick={handleProcesarRecepcion} disabled={isReceiving} className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl disabled:opacity-50">';
    const r4 = '<button onClick={handleProcesarRecepcion} disabled={isReceiving} className="flex-1 min-w-[160px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-2 rounded-lg disabled:opacity-50 shadow-md shadow-emerald-600/30 transition-all hover:shadow-lg hover:-translate-y-0.5">';
    code = code.replace(t4, r4);

    fs.writeFileSync('src/pages/InventarioOperativo.tsx', code);
    console.log('Successfully patched buttons');
} catch (e) {
    console.error(e);
}
