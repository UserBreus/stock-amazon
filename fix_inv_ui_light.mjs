import fs from 'fs';

let content = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Remove Catálogo & Compras from tabs list
content = content.replace(/'catalogo' \| 'compras'/g, ''); // from activeTab typescript type
content = content.replace(/{ id: 'catalogo', label: 'Catálogo', icon: Tags },\s*{ id: 'compras', label: 'Compras', icon: Receipt },/g, '');

// 2. Remove isProductModalOpen and isCatProductModalOpen entirely
content = content.replace(/const \[isProductModalOpen[\s\S]*?NewCategory[^;]+;/g, '');

// 3. Remove handleAddProduct and handleAddCategory
content = content.replace(/const handleAddProduct = async \([\s\S]*?handleAddCategory = async \([\s\S]*?catch \(e\) {\s*console\.error\(e\);\s*}\s*};/g, '');

// 4. Remove the block {activeTab === 'catalogo' ...} completely
content = content.replace(/{activeTab === 'catalogo'[\s\S]*?<\/AnimatePresence>\s*)}/g, '');

// 5. Remove the block {activeTab === 'compras' ...} completely
content = content.replace(/{activeTab === 'compras'[\s\S]*?<\/AnimatePresence>\s*)}/g, '');

// 6. Refactor the active tab wrapper to apply CRM styling and hide navigation logic when inside a subpanel
content = content.replace(/<div className="p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">/, '<div className="p-4 md:p-6 pb-32 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 dark:bg-slate-950 min-h-screen">');
content = content.replace(/<div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm mb-10 w-full md:w-auto items-center justify-between">/g, 
  '      {(activeTab !== \'panel\' || panelView === \'hub\') && (\n      <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 shadow-sm mb-8 w-full items-center justify-between sticky top-0 z-40">');
content = content.replace(/<\/button>\n            }\)\}\n          <\/div>\n      <\/div>/g, '</button>\n            }))}\n          </div>\n      </div>\n      )}');

// 7. Inject the Etiqueta Generation variables
content = content.replace(/const \[loading, setLoading\] = useState\(true\);/, `const [loading, setLoading] = useState(true);

  // Generador Rápido de Etiquetas Físicas
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState({ variante_id: '', cantidad_por_etiqueta: 1, numero_etiquetas: 1, deposito_id: '' });
  const [variantesFlat, setVariantesFlat] = useState<any[]>([]);`);

// 8. Grab the variantes flat array inside fetchData
content = content.replace(/setComprasPendientes\(compRes \|\| \[\]\);/, `
      // build flat table of variantes for dropdowns
      if (stockRes) {
        const flatten = stockRes.map((s:any) => ({
           id: s.variante_id,
           nombre: s.producto_nombre + ' (' + s.nombre_variante + ')',
           sku: s.sku
        }));
        setVariantesFlat(flatten);
      }`);

// 9. Inject handleGenerateLabels
content = content.replace(/const openLabelDrillDown = async/, `
  const handleGenerateLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const varSelected = variantesFlat.find(v => v.id.toString() === newLabel.variante_id.toString());
      if(!varSelected) return;

      const prefix = varSelected.sku || 'SKU';
      const values = Array.from({ length: newLabel.numero_etiquetas }).map((_, i) => 
        \`('\${prefix}-\${Date.now().toString().slice(-4)}-\${i+1}', \${varSelected.id}, \${newLabel.deposito_id}, \${newLabel.cantidad_por_etiqueta}, 'activo')\`
      ).join(',');

      const q = \`INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_actual, estado) OUTPUT INSERTED.id VALUES \${values}\`;
      const inserted = await executeAWSQuery(q);
      
      if (inserted && inserted.length > 0) {
        const movValues = inserted.map((row:any) => 
          \`(\${row.id}, 'ingreso', \${newLabel.cantidad_por_etiqueta}, \${newLabel.deposito_id}, '\${user?.id || 1}')\`
        ).join(',');
        await executeAWSQuery(\`INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad, deposito_destino_id, usuario_id) VALUES \${movValues}\`);
      }
      setIsLabelModalOpen(false);
      fetchData();
      alert(\`\${newLabel.numero_etiquetas} etiqueta(s) generadas con éxito.\`);
    } catch(err) {
      console.error(err);
      alert("Error al generar las etiquetas. Revise la consola.");
    }
  };

  const openLabelDrillDown = async`);

// 10. Replace the 4th Hub Card with the Generar Etiqueta card
content = content.replace(/<button onClick=\{\(\) => setActiveTab\('catalogo'\)\} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-600 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl">/g, 
  `<button onClick={() => setIsLabelModalOpen(true)} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-indigo-500/5">`);

content = content.replace(/<h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Catálogo<\/h3>\s*<p className="text-slate-500 font-medium text-sm">Catálogo maestro para impresión o reimpresión de códigos de barras sueltos\.<\/p>/, 
  `<h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Imprimir Etiquetas</h3>
                   <p className="text-slate-500 font-medium text-sm">Generador súper rápido de códigos de barras con lotes físicos (cajas, bidones, paletas).</p>`);


// 11. Remove the old absolute buttons and inject the robust CRM top wrapper for submodules
content = content.replace(/\{activeTab === 'panel' && panelView === 'ingreso' && \([\s\S]*?<\/div>\s*\)\}/g, `
      {/* HEADER DINÁMICO DE RETORNO A OPERACIONES PARA SUB-MÓDULOS */}
      {activeTab === 'panel' && panelView !== 'hub' && (
         <div className="mb-6 flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-4">
                 <button onClick={()=>setPanelView('hub')} className="p-2.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-all shadow-sm">
                     <ArrowLeft className="w-5 h-5" />
                 </button>
                 <div>
                    <h2 className="font-black text-xl text-slate-800 dark:text-white leading-tight">
                        {panelView === 'ingreso' && "Ingreso de Mercadería"}
                        {panelView === 'traslado' && "Traslado Interno"}
                        {panelView === 'retiro' && "Retiro o Consumo Libre"}
                    </h2>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mt-0.5">Operación en proceso</p>
                 </div>
             </div>
         </div>
      )}

      {activeTab === 'panel' && panelView === 'ingreso' && (
         <div className="mt-4"><RecepcionAuditoria onRecargaRequerida={fetchData} onCartChange={setManualCart} /></div>
      )}
      {activeTab === 'panel' && panelView === 'traslado' && (
         <div className="mt-4"><DespachoEgresos initialOperationType="traslado" initialMode="lote" /></div>
      )}
      {activeTab === 'panel' && panelView === 'retiro' && (
         <div className="mt-4"><DespachoEgresos initialOperationType="venta_consumo" initialMode="lote" /></div>
      )}`);

// 12. Add the modal for Etiquetas at the end
content = content.replace(/\{?\/\* MODALES CLAVE \*\/\}/, `
      {/* MODAL ETIQUETAS */}
      <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Generador de Rótulos / Cajas Físicas">
         <form onSubmit={handleGenerateLabels} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variante a Imprimir</label>
               <select required value={newLabel.variante_id} onChange={e => setNewLabel({...newLabel, variante_id: e.target.value})} className="input-nexus w-full bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200">
                  <option value="" disabled>Seleccione una variante...</option>
                  {variantesFlat.map(v => <option key={v.id} value={v.id}>{v.nombre} [{v.sku}]</option>)}
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad (Volumen por etiqueta)</label>
                 <input type="number" min="0.01" step="0.01" required value={newLabel.cantidad_por_etiqueta} onChange={e => setNewLabel({...newLabel, cantidad_por_etiqueta: Number(e.target.value)})} className="input-nexus w-full" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número de Rótulos a Emitir</label>
                 <input type="number" min="1" required value={newLabel.numero_etiquetas} onChange={e => setNewLabel({...newLabel, numero_etiquetas: Number(e.target.value)})} className="input-nexus w-full font-black text-indigo-600" />
              </div>
            </div>
            <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Almacén Destino Físico</label>
                 <select required value={newLabel.deposito_id} onChange={e => setNewLabel({...newLabel, deposito_id: e.target.value})} className="input-nexus w-full bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200">
                    <option value="" disabled>Seleccione almacén...</option>
                    {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                 </select>
            </div>
            <button type="submit" className="w-full btn-primary py-4 uppercase tracking-widest font-black shadow-lg shadow-indigo-500/20">Declarar Ingreso y Generar Códigos MS</button>
         </form>
      </Modal>

      {/* MODALES CLAVE */}`);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', content);
console.log("InventarioGerencial refactored completely!");
