import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const modalStart = txt.indexOf('<Modal isOpen={isLabelModalOpen}');
const modalEnd = txt.indexOf('</Modal>', modalStart) + 8;

const newModal = `<Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Imprimir Etiquetas">
        <div className="space-y-0">
          
          {/* OPTION SELECTOR */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setLabelTab('catalogo')}
              className={\`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-wider transition-all \${labelTab === 'catalogo' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-lg shadow-indigo-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}\`}
            >
              <div className={\`w-9 h-9 rounded-xl flex items-center justify-center \${labelTab === 'catalogo' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}\`}>
                <Search className="w-4 h-4" />
              </div>
              <span>Catálogo</span>
            </button>
            <button
              onClick={() => setLabelTab('recientes')}
              className={\`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-wider transition-all \${labelTab === 'recientes' ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shadow-lg shadow-amber-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-amber-300'}\`}
            >
              <div className={\`w-9 h-9 rounded-xl flex items-center justify-center \${labelTab === 'recientes' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}\`}>
                <Zap className="w-4 h-4" />
              </div>
              <span>Recientes</span>
            </button>
            <button
              onClick={() => setLabelTab('compras')}
              className={\`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-wider transition-all \${labelTab === 'compras' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-lg shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-300'}\`}
            >
              <div className={\`w-9 h-9 rounded-xl flex items-center justify-center \${labelTab === 'compras' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}\`}>
                <Receipt className="w-4 h-4" />
              </div>
              <span>Orden Compra</span>
            </button>
          </div>

          {/* PANEL CATÁLOGO */}
          {labelTab === 'catalogo' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o SKU..."
                  value={labelSearchTerm}
                  onChange={e => setLabelSearchTerm(e.target.value)}
                  className="input-nexus w-full pl-10"
                  autoFocus
                />
              </div>
              <div className="max-h-[35vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {labelSearchTerm.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-6 font-medium">Escribe para buscar en el catálogo completo</p>
                )}
                {stockConsolidado.filter(p => (p.nombre_completo || '').toLowerCase().includes(labelSearchTerm.toLowerCase())).slice(0, 12).map(p => (
                  <div key={p.variante_id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3 group hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{p.nombre_completo}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">Stock: {p.cantidad_total ?? 0} u.</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number" min="1" defaultValue={1}
                        id={\`qty-cat-\${p.variante_id}\`}
                        className="input-nexus w-16 text-center py-1 font-bold text-sm"
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const qty = parseInt((document.getElementById(\`qty-cat-\${p.variante_id}\`) as HTMLInputElement)?.value || '1');
                          addToPrintCart({ ...p, numero_etiquetas: qty });
                        }}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {labelSearchTerm.length > 0 && stockConsolidado.filter(p => (p.nombre_completo || '').toLowerCase().includes(labelSearchTerm.toLowerCase())).length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-4">Sin resultados para "{labelSearchTerm}"</p>
                )}
              </div>
            </div>
          )}

          {/* PANEL INGRESOS RECIENTES */}
          {labelTab === 'recientes' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Últimos productos ingresados manualmente al depósito</p>
              <div className="max-h-[38vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {recentMovements.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Zap className="w-10 h-10 mb-3 opacity-30" />
                    <p className="font-bold text-sm">No hay ingresos manuales recientes</p>
                  </div>
                )}
                {recentMovements.map(rec => (
                  <div key={rec.id} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex items-center gap-3 hover:border-amber-400 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-amber-900 dark:text-amber-100 truncate">{rec.producto_nombre}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{rec.nombre_variante} · +{rec.cantidad_afectada} u. — {new Date(rec.fecha).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number" min="1" defaultValue={1}
                        id={\`qty-rec-\${rec.id}\`}
                        className="input-nexus w-16 text-center py-1 font-bold text-sm"
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const qty = parseInt((document.getElementById(\`qty-rec-\${rec.id}\`) as HTMLInputElement)?.value || '1');
                          addToPrintCart({ variante_id: rec.variante_id, nombre_completo: rec.nombre_variante, producto_nombre: rec.producto_nombre, sku: rec.sku, numero_etiquetas: qty });
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PANEL ÓRDENES DE COMPRA */}
          {labelTab === 'compras' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Seleccioná una orden — se agregarán todos sus productos</p>
              <div className="max-h-[38vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {comprasPendientes.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Receipt className="w-10 h-10 mb-3 opacity-30" />
                    <p className="font-bold text-sm">No hay órdenes de compra</p>
                  </div>
                )}
                {comprasPendientes.map(c => {
                  const shortId = 'OC-' + c.id.split('-')[0].toUpperCase();
                  const dateObj = new Date(c.fecha || c.fecha_creacion || Date.now());
                  const dateStr = isNaN(dateObj.getTime()) ? 'Reciente' : dateObj.toLocaleDateString();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={async () => {
                        try {
                          toast.loading('Cargando productos de la orden...', { id: 'load_compra' });
                          const details = await executeAWSQuery(\`SELECT d.*, v.codigo_variante as sku, pm.nombre + ' ' + v.nombre_variante as full_nombre, v.id as variante_id FROM Stock_Compras_Detalle d INNER JOIN Stock_Variantes v ON d.variante_id = v.id INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id WHERE d.compra_id = '\${c.id}'\`);
                          toast.dismiss('load_compra');
                          if (details && details.length > 0) {
                            details.forEach((item: any) => addToPrintCart({ variante_id: item.variante_id, nombre_completo: item.full_nombre, producto_nombre: item.full_nombre, sku: item.sku || 'PROD', numero_etiquetas: item.cantidad || 1 }));
                            toast.success(\`\${details.length} productos de \${shortId} agregados\`);
                          } else {
                            toast.error('La orden no tiene productos.');
                          }
                        } catch(e) { toast.dismiss('load_compra'); toast.error('Error al cargar la orden'); }
                      }}
                      className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 dark:text-white">{shortId}</p>
                        <p className="text-xs text-slate-500 capitalize">{c.estado} · {dateStr}</p>
                      </div>
                      <div className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* LISTA DE SELECCIONADOS + FORM */}
          {printCart.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Etiquetas a imprimir ({printCart.reduce((a, c) => a + (c.numero_etiquetas || 1), 0)} pegatinas)
                </h4>
                <button type="button" onClick={() => setPrintCart([])} className="text-xs text-rose-500 hover:text-rose-700 font-bold">Limpiar todo</button>
              </div>
              <div className="max-h-[22vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {printCart.map((item, index) => (
                  <div key={item.cart_id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.nombre_completo}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] text-slate-400 font-black uppercase">Etiq.</label>
                      <input
                        type="number" min="1"
                        value={item.numero_etiquetas}
                        onChange={e => { const nc = [...printCart]; nc[index].numero_etiquetas = e.target.valueAsNumber || 1; setPrintCart(nc); }}
                        className="input-nexus w-16 text-center py-1 font-bold text-sm"
                      />
                      <button type="button" onClick={() => removeFromPrintCart(item.cart_id)} className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleGenerateLabels} className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 block mb-1.5">Depósito Destino</label>
                  <select required value={printCartDepositoId} onChange={e => setPrintCartDepositoId(e.target.value)} className="input-nexus w-full">
                    <option value="" disabled>Selecciona el almacén...</option>
                    {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 font-bold">
                  <Printer className="w-5 h-5" /> Confirmar y Pasar a Imprimir
                </button>
              </form>
            </div>
          )}

        </div>
      </Modal>`;

txt = txt.substring(0, modalStart) + newModal + txt.substring(modalEnd);
fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log('Modal redesigned successfully');
