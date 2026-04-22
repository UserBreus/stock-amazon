const fs = require('fs');
let c = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

const tabInsert = `{ id: 'recepcion', label: 'Remitos Entrantes', count: remitosPendientes.length, alert: remitosPendientes.length > 0 },
          { id: 'solicitar', label: 'Pedir Insumos', count: solicitudCart.length },`;

if(!c.includes("'Pedir Insumos'")) {
    c = c.replace("{ id: 'recepcion', label: 'Remitos Entrantes', count: remitosPendientes.length, alert: remitosPendientes.length > 0 },", tabInsert);
}

const UIBlock = `
      {activeTab === 'solicitar' as any && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                <div>
                   <h3 className="font-black text-slate-800 dark:text-white text-xl flex items-center gap-2">
                       <ShoppingCart className="w-6 h-6 text-emerald-500" />
                       Carrito de Solicitudes a Central
                   </h3>
                   <p className="text-sm text-slate-500 font-bold mt-1">Busca en el catálogo maestro y pide reposición a la bodega logística.</p>
                </div>
                <button onClick={openCatalog} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition shadow-lg">
                    <PlusCircle className="w-5 h-5"/> Abrir Catálogo
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 min-h-[400px]">
                {solicitudCart.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center opacity-40 mt-20">
                        <ShoppingCart className="w-16 h-16 mb-4"/>
                        <p className="font-bold text-lg">Tu carrito de pedidos está vacío</p>
                        <p className="text-sm">Agrega variantes desde el catálogo</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {solicitudCart.map((item, idx) => (
                           <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                               <div>
                                  <h4 className="font-black text-lg">{item.prod_name}</h4>
                                  <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{item.var_name}</span>
                                  <p className="text-xs font-mono text-slate-500 mt-1">{item.var_sku}</p>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-center">
                                      <label className="text-[10px] font-black uppercase text-slate-400 mb-1">Cantidad Solicitar</label>
                                      <input type="number" min="1" step="0.01" value={item.cantidad} onChange={e=>{
                                          const v = Number(e.target.value);
                                          setSolicitudCart(solicitudCart.map(c=>c.var_id===item.var_id?{...c, cantidad: v}:c));
                                      }} className="w-24 text-center font-black text-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 shadow-inner" />
                                  </div>
                                  <button onClick={() => setSolicitudCart(solicitudCart.filter(c=>c.var_id!==item.var_id))} className="p-4 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition group relative top-3">
                                      <Trash2 className="w-5 h-5"/>
                                  </button>
                               </div>
                           </div>
                        ))}
                    </div>
                )}
            </div>

            {solicitudCart.length > 0 && (
                <button onClick={enviarSolicitud} disabled={isRequesting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-xl shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50">
                    {isRequesting ? 'ENVIANDO...' : <><Send className="w-6 h-6"/> ENVIAR SOLICITUD DE REPOSICIÓN A LOGÍSTICA</>}
                </button>
            )}
        </motion.div>
      )}

      {/* Drill-Down Catalog Component for Request Mode */}
      <AnimatePresence>
        {isCatalogOpen && (
            <CategoryDrillDownModal 
                isOpen={isCatalogOpen} 
                onClose={() => setIsCatalogOpen(false)} 
                title="Catálogo Maestro para Pedidos" 
                categorias={catalogCategorias} 
                productos={catalogProductos} 
                onSelect={handleCatalogSelection}
                closeOnSelect={true}
            />
        )}
      </AnimatePresence>
`;

if (!c.includes("{activeTab === 'solicitar' as any && (")) {
    c = c.replace(/<\/div>\s*<\/div>\s*\);\s*\}\s*$/m, UIBlock + "\n    </div>\n  );\n}");
}

fs.writeFileSync('src/pages/InventarioOperativo.tsx', c);
console.log('UI injected');
