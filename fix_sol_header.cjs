const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// Find the old solicitudes header section
const OLD_HEADER = `      {/* ═══════════════════════════════════════════════════
          ÓRDENES SOLICITADAS
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'solicitudes' && (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <Bell className="w-6 h-6 text-amber-500" />
                Órdenes de Insumos Pendientes
              </h2>
              <p className="text-sm text-slate-500 mt-1">Solicitudes enviadas desde los sectores operativos. Asignale el almacén origen y despachá.</p>
            </div>
            <button onClick={fetchData} className="btn-secondary text-xs px-4 py-2 shrink-0">↻ Actualizar</button>
          </div>`;

const NEW_HEADER = `      {/* ╔ VISTA: ÓRDENES SOLICITADAS */}
      {activeTab === 'solicitudes' && (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
          {/* Back header */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('panel')}
                className="p-2.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2 leading-tight">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Órdenes de Insumos
                  {solicitudes.length > 0 && (
                    <span className="bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full">{solicitudes.length} pendiente{solicitudes.length > 1 ? 's' : ''}</span>
                  )}
                </h2>
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mt-0.5">Solicitudes de los sectores operativos</p>
              </div>
            </div>
            <button onClick={fetchData} className="btn-secondary text-xs px-4 py-2 shrink-0">↻ Actualizar</button>
          </div>`;

if (code.includes(OLD_HEADER)) {
  code = code.replace(OLD_HEADER, NEW_HEADER);
  fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
  console.log('SUCCESS: Back header added to solicitudes view!');
} else {
  // Try finding fragments
  const i1 = code.indexOf('ÓRDENES SOLICITADAS');
  const i2 = code.indexOf('activeTab === \'solicitudes\'');
  console.log('ÓRDENES SOLICITADAS marker at:', i1);
  console.log('activeTab solicitudes at:', i2);
  if (i2 !== -1) {
    console.log('Context around activeTab === solicitudes:');
    console.log(JSON.stringify(code.substring(i2 - 60, i2 + 200)));
  }
}
