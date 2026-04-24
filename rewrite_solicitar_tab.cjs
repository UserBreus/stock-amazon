const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

// Find and replace the entire solicitar tab block
const START_MARKER = "      {/* TAB PEDIR INSUMOS */}";
const END_MARKER = "      {/* MODAL DE CONSUMO */}";

const startIdx = code.indexOf(START_MARKER);
const endIdx = code.indexOf(END_MARKER);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found! start:', startIdx, 'end:', endIdx);
  process.exit(1);
}

const before = code.substring(0, startIdx);
const after = code.substring(endIdx);

const newBlock = `      {/* TAB PEDIR INSUMOS */}
      {activeTab === 'solicitar' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Sub-navegación estilo ERP */}
          <div className="flex gap-3">
            <button
              onClick={() => setSolicitudSubTab('nueva')}
              className={\`flex-1 flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all font-black \${
                solicitudSubTab === 'nueva'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
              }\`}
            >
              <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \${solicitudSubTab === 'nueva' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}\`}>
                <PlusCircle className="w-5 h-5" />
              </div>
              <span className="text-sm uppercase tracking-widest">Nueva Solicitud</span>
              {solicitudCart.length > 0 && (
                <span className={\`text-xs px-2 py-0.5 rounded-full font-black \${solicitudSubTab === 'nueva' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}\`}>
                  {solicitudCart.length} en carrito
                </span>
              )}
            </button>

            <button
              onClick={() => setSolicitudSubTab('historial')}
              className={\`flex-1 flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all font-black \${
                solicitudSubTab === 'historial'
                  ? 'bg-slate-800 border-slate-800 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-xl shadow-slate-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
              }\`}
            >
              <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \${solicitudSubTab === 'historial' ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-slate-100 dark:bg-slate-800'}\`}>
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="text-sm uppercase tracking-widest">Mis Solicitudes</span>
              {solicitudesEnviadas.length > 0 && (
                <span className={\`text-xs px-2 py-0.5 rounded-full font-black \${solicitudSubTab === 'historial' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-100 text-slate-600'}\`}>
                  {solicitudesEnviadas.length} enviadas
                </span>
              )}
            </button>
          </div>

          {/* PANEL: Nueva Solicitud */}
          {solicitudSubTab === 'nueva' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white text-lg">Nueva Solicitud de Insumos</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Seleccioná los artículos que necesitás y enviá la solicitud a Logística Central.</p>
                </div>
                <button
                  onClick={openCatalog}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" /> Agregar Artículo
                </button>
              </div>

              <div className="p-6">
                {solicitudCart.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <PlusCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="font-bold text-slate-500">El carrito está vacío.</p>
                    <p className="text-sm text-slate-400 mt-1">Hacé clic en "Agregar Artículo" para buscar insumos del catálogo.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {solicitudCart.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 dark:text-white text-sm leading-tight truncate">{item.prod_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{item.var_name}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Cant.</label>
                          <input
                            type="number" min="1" step="1"
                            value={item.cantidad}
                            onChange={e => setSolicitudCart(solicitudCart.map((c, i) => i === idx ? {...c, cantidad: Number(e.target.value)} : c))}
                            className="w-20 text-center font-black text-lg bg-white dark:bg-slate-900 border border-indigo-300 rounded-lg p-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <button onClick={() => setSolicitudCart(solicitudCart.filter((_, i) => i !== idx))} className="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={enviarSolicitud}
                      disabled={isRequesting || solicitudCart.length === 0}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl disabled:opacity-40 transition-all shadow-lg shadow-emerald-600/20 mt-4 uppercase tracking-widest text-sm"
                    >
                      <Send className="w-4 h-4" />
                      {isRequesting ? 'Enviando solicitud...' : \`Enviar Solicitud a Logística (\${solicitudCart.length} ítem\${solicitudCart.length > 1 ? 's' : ''})\`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL: Mis Solicitudes Enviadas */}
          {solicitudSubTab === 'historial' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <h3 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-slate-500" />
                  Mis Solicitudes Enviadas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Seguí el estado de tus solicitudes enviadas a Logística Central.</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {solicitudesEnviadas.length === 0 ? (
                  <div className="py-16 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold">No has enviado solicitudes todavía.</p>
                    <button onClick={() => setSolicitudSubTab('nueva')} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">
                      Crear primera solicitud →
                    </button>
                  </div>
                ) : (
                  solicitudesEnviadas.map(sol => (
                    <div key={sol.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                          sol.estado === 'PENDIENTE' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                          sol.estado === 'APROBADA'  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        )}>
                          {sol.estado === 'APROBADA' ? <CheckCircle className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-white text-sm">{sol.numeracion}</p>
                          <p className="text-xs text-slate-500">{new Date(sol.fecha_creacion).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                        </div>
                      </div>
                      <span className={cn("px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest",
                        sol.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        sol.estado === 'APROBADA'  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800'
                      )}>{sol.estado}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      `;

code = before + newBlock + after;
fs.writeFileSync('src/pages/InventarioOperativo.tsx', code);
console.log('Tab rewritten successfully. File size:', code.length);
