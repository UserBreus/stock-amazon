import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. ADD NEW STATE VARIABLES
if (!txt.includes('labelCatalog')) {
    txt = txt.replace(
        "const [activeTab, setActiveTab] = useState<'stock' | 'escaner' | 'catalogo' | 'recepcion'>('stock');",
        "const [labelCatalog, setLabelCatalog] = useState<any[]>([]);\n  const [expandedLabelCategory, setExpandedLabelCategory] = useState<string|null>(null);\n  const [activeTab, setActiveTab] = useState<'stock' | 'escaner' | 'catalogo' | 'recepcion'>('stock');"
    );
}

// 2. OVERWRITE openLabelModal
const openLabelStart = txt.indexOf('const openLabelModal = async () => {');
const openLabelEndQuote = txt.indexOf('};', openLabelStart) + 2;

const newOpenLabelModal = `const openLabelModal = async () => {
    setIsLabelModalOpen(true);
    setPrintCart([]);
    if(depositos.length > 0) setPrintCartDepositoId(depositos[0].id.toString());
    
    // Fetch newly created variants for RECIENTES, and the full catalog for families
    try {
      const dbres = await Promise.all([
          executeAWSQuery(\`
            SELECT TOP 20 v.id as variante_id, pm.nombre + ' ' + ISNULL(v.nombre_variante,'') as nombre_completo, pm.nombre as producto_nombre, v.codigo_variante as sku
            FROM Stock_Variantes v INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
            ORDER BY v.id DESC
          \`),
          executeAWSQuery(\`
            SELECT v.id as variante_id, pm.nombre + ' ' + ISNULL(v.nombre_variante,'') as nombre_completo, pm.nombre as producto_nombre, v.codigo_variante as sku, pm.categoria_id
            FROM Stock_Variantes v INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
          \`)
      ]);
      setRecentMovements(dbres[0] || []);
      setLabelCatalog(dbres[1] || []);
    } catch(e) {}
  };`;

txt = txt.substring(0, openLabelStart) + newOpenLabelModal + txt.substring(openLabelEndQuote);

// 3. OVERWRITE THE PANELS (from PANEL CATÁLOGO up to PANEL ÓRDENES DE COMPRA)
const panelCatStart = txt.indexOf('{/* PANEL CATÁLOGO */}');
const panelOrdStart = txt.indexOf('{/* PANEL ÓRDENES DE COMPRA */}');

const newPanels = `{/* PANEL CATÁLOGO */}
          {labelTab === 'catalogo' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={labelSearchTerm}
                  onChange={e => { setLabelSearchTerm(e.target.value); if(e.target.value) setExpandedLabelCategory(null); }}
                  className="input-nexus w-full pl-10"
                  autoFocus
                />
              </div>
              <div className="max-h-[40vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {labelSearchTerm.length > 0 ? (
                  // SEARCH MODE: Flatten list
                  labelCatalog.filter(p => (p.nombre_completo || '').toLowerCase().includes(labelSearchTerm.toLowerCase()) || (p.sku || '').toLowerCase().includes(labelSearchTerm.toLowerCase())).slice(0, 15).map(p => (
                    <div key={p.variante_id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3 group hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{p.nombre_completo}</p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">SKU: {p.sku}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input type="number" min="1" defaultValue={1} id={\`qty-cat-\${p.variante_id}\`} className="input-nexus w-16 text-center py-1 font-bold text-sm" onClick={e => e.stopPropagation()} />
                        <button type="button" onClick={() => addToPrintCart({ ...p, numero_etiquetas: parseInt((document.getElementById(\`qty-cat-\${p.variante_id}\`) as HTMLInputElement)?.value || '1') })} className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  // CATEGORY ACCORDION MODE
                  <div className="space-y-3">
                     {tiposProducto.map(cat => {
                        const itemsInCat = labelCatalog.filter(p => p.categoria_id == cat.id);
                        if(itemsInCat.length === 0) return null;
                        const isExpanded = expandedLabelCategory === cat.id.toString();
                        
                        return (
                          <div key={cat.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                             <button
                               onClick={() => setExpandedLabelCategory(isExpanded ? null : cat.id.toString())}
                               className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                             >
                                <div className="flex items-center gap-3">
                                   <Layers className="w-5 h-5 text-indigo-500" />
                                   <span className="font-black text-slate-800 dark:text-slate-200 tracking-tight">{cat.nombre}</span>
                                   <span className="text-xs font-bold text-slate-400 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">{itemsInCat.length} arts.</span>
                                </div>
                                <ChevronDown className={\`w-5 h-5 text-slate-400 transition-transform \${isExpanded ? 'rotate-180' : ''}\`} />
                             </button>
                             
                             {isExpanded && (
                               <div className="p-2 space-y-2 bg-white dark:bg-slate-950">
                                 {itemsInCat.map(p => (
                                    <div key={p.variante_id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-3">
                                      <div className="flex-1 min-w-0 px-2">
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{p.nombre_completo}</p>
                                        <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">SKU: {p.sku}</p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <input type="number" min="1" defaultValue={1} id={\`qty-cat-\${p.variante_id}\`} className="input-nexus w-16 text-center py-1 font-bold text-sm border-slate-200" onClick={e => e.stopPropagation()} />
                                        <button type="button" onClick={() => addToPrintCart({ ...p, numero_etiquetas: parseInt((document.getElementById(\`qty-cat-\${p.variante_id}\`) as HTMLInputElement)?.value || '1') })} className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                                      </div>
                                    </div>
                                 ))}
                               </div>
                             )}
                          </div>
                        );
                     })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL INGRESOS RECIENTES */}
          {labelTab === 'recientes' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center">Últimos artículos creados en el sistema</p>
              <div className="max-h-[40vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {recentMovements.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Zap className="w-10 h-10 mb-3 opacity-30" />
                    <p className="font-bold text-sm">No hay ingresos manuales recientes</p>
                  </div>
                )}
                {recentMovements.map(rec => (
                  <div key={rec.variante_id} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex items-center gap-3 hover:border-amber-400 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-amber-900 dark:text-amber-100 truncate">{rec.nombre_completo}</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">SKU: {rec.sku}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number" min="1" defaultValue={1}
                        id={\`qty-rec-\${rec.variante_id}\`}
                        className="input-nexus w-16 text-center py-1 font-bold text-sm border-amber-200"
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={() => addToPrintCart({ ...rec, numero_etiquetas: parseInt((document.getElementById(\`qty-rec-\${rec.variante_id}\`) as HTMLInputElement)?.value || '1') })}
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

          `;

txt = txt.substring(0, panelCatStart) + newPanels + txt.substring(panelOrdStart);
fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log('Done!');
