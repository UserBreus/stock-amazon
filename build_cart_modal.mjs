import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. STATE REPLACEMENT
const stateReplacement = `
  const [printCart, setPrintCart] = useState<any[]>([]);
  const [printCartDepositoId, setPrintCartDepositoId] = useState<string>('');
  const [labelSearchTerm, setLabelSearchTerm] = useState('');
  const [labelTab, setLabelTab] = useState<'catalogo'|'recientes'>('catalogo');
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  // We will intercept opening the modal to fetch recent movements
`;

txt = txt.replace(/const \[newLabel, setNewLabel\] = useState[^;]+;/, stateReplacement);

// We need an exact replacement for handleGenerateLabels.
const handleGenerateLabelsStart = txt.indexOf('const handleGenerateLabels = async');
const handleGenerateLabelsEnd = txt.indexOf('};', handleGenerateLabelsStart) + 2;

const replaceFunc = `
  const openLabelModal = async () => {
    setIsLabelModalOpen(true);
    setPrintCart([]);
    if(depositos.length > 0) setPrintCartDepositoId(depositos[0].id.toString());
    
    // Fetch recent manual ingressions just in case they want Option B
    try {
      const rec = await executeAWSQuery(\`
        SELECT TOP 20 m.id, m.cantidad_afectada, v.nombre_variante, pm.nombre as producto_nombre, v.codigo_variante as sku, v.id as variante_id, m.fecha
        FROM Stock_Movimientos m
        INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
        INNER JOIN Stock_Variantes v ON e.variante_id = v.id
        INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
        WHERE m.tipo_movimiento IN ('ingreso_manual', 'creacion')
        ORDER BY m.fecha DESC
      \`);
      setRecentMovements(rec || []);
    } catch(e) {}
  };

  const addToPrintCart = (prod: any) => {
      setPrintCart([...printCart, {
          cart_id: Math.random().toString(36).substring(7),
          variante_id: prod.variante_id,
          nombre_completo: prod.nombre_completo || prod.nombre_variante,
          producto_nombre: prod.producto_nombre,
          sku: prod.sku || 'PROD',
          cantidad_por_etiqueta: 1,
          numero_etiquetas: 1
      }]);
      toast.success('Añadido al carrito de impresión');
  };

  const removeFromPrintCart = (cartId: string) => {
      setPrintCart(printCart.filter(item => item.cart_id !== cartId));
  };

  const handleGenerateLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    if (printCart.length === 0) return toast.error("El carrito está vacío");
    if (!printCartDepositoId) return toast.error("Selecciona un depósito destino");

    try {
      toast.loading('Generando lote de impresión múltiple...', { id: 'l_m_l' });
      let insertEtiquetas = '';
      let newEtqs = [];
      
      for(const item of printCart) {
          const prefix = item.sku;
          for(let i=0; i<item.numero_etiquetas; i++) {
            const codigo_barras = \`\${prefix}-\${Date.now().toString().slice(-6)}-\${Math.floor(Math.random()*1000)}\`; // Unique
            newEtqs.push({
               id: \`temp-\${item.cart_id}-\${i}\`,
               codigo_barras,
               variante_id: item.variante_id
            });
            insertEtiquetas += \`
              DECLARE @new_etq_\${item.cart_id.replace(/-/g,'_')}_\${i} INT;
              INSERT INTO Stock_Etiquetas (variante_id, deposito_id, codigo_barras, cantidad_inicial, cantidad_actual, estado)
              VALUES ('\${item.variante_id}', \${printCartDepositoId}, '\${codigo_barras}', \${item.cantidad_por_etiqueta}, \${item.cantidad_por_etiqueta}, 'activo');
              SET @new_etq_\${item.cart_id.replace(/-/g,'_')}_\${i} = SCOPE_IDENTITY();
              
              INSERT INTO Stock_Movimientos (etiqueta_id, deposito_destino_id, cantidad_afectada, tipo_movimiento, usuario_id)
              VALUES (@new_etq_\${item.cart_id.replace(/-/g,'_')}_\${i}, \${printCartDepositoId}, \${item.cantidad_por_etiqueta}, 'creacion', '\${user?.id}');
            \`;
          }
      }

      await executeAWSQuery(insertEtiquetas);
      toast.dismiss('l_m_l');
      toast.success('Lote generado con éxito');
      
      setPrintProduct({ producto_nombre: 'LOTE MÚLTIPLE', nombre_completo: 'Varios Productos' }); // Fallback
      setPrintEtiquetas(newEtqs);
      setIsLabelModalOpen(false);
      
      setIsPrintConfigModalOpen(true);
      fetchData();
    } catch (error: any) {
      toast.dismiss('l_m_l');
      toast.error("Error: " + error.message);
    }
  };
`;

txt = txt.substring(0, handleGenerateLabelsStart) + replaceFunc + txt.substring(handleGenerateLabelsEnd);

// Find the onClick logic for opening manual labels and replace with openLabelModal
txt = txt.replace(/<button onClick=\{\(\) => setIsLabelModalOpen\(true\)\} className="btn-primary flex items-center justify-center gap-2"/, '<button onClick={openLabelModal} className="btn-primary flex items-center justify-center gap-2"');


// Now replace the Modal entirely!
const modalStart = txt.indexOf('<Modal isOpen={isLabelModalOpen}');
const modalEnd = txt.indexOf('</Modal>', modalStart) + 8;

const printCartTotalFisico = '{printCart.reduce((acc, curr) => acc + (curr.numero_etiquetas || 0), 0)}';
const printCartTotalStock = '{printCart.reduce((acc, curr) => acc + ((curr.numero_etiquetas || 0) * (curr.cantidad_por_etiqueta || 0)), 0)}';

const newModalUI = `
      <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Carrito de Etiquetas Manuales">
        <div className="flex flex-col md:flex-row gap-6 h-[70vh]">
           {/* LEFT PANEL: Autonomus Search Picker */}
           <div className="w-full md:w-1/2 flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="flex p-2 gap-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                   <button onClick={() => setLabelTab('catalogo')} className={\`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg \${labelTab === 'catalogo' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}>
                       Catálogo
                   </button>
                   <button onClick={() => setLabelTab('recientes')} className={\`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg \${labelTab === 'recientes' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}>
                       Ingresos Recientes
                   </button>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                   {labelTab === 'catalogo' ? (
                       <div className="space-y-4">
                           <div className="relative">
                               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                               <input type="text" placeholder="Buscar por nombre o sku..." value={labelSearchTerm} onChange={e => setLabelSearchTerm(e.target.value)} className="input-nexus w-full pl-9" />
                           </div>
                           <div className="space-y-2">
                               {stockConsolidado.filter(p => p.nombre_completo.toLowerCase().includes(labelSearchTerm.toLowerCase())).slice(0, 10).map(p => (
                                   <button key={p.variante_id} type="button" onClick={() => addToPrintCart(p)} className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 flex justify-between items-center group">
                                       <div className="min-w-0 pr-4">
                                           <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.nombre_completo}</p>
                                           <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Stk Actual: {p.cantidad_total}</p>
                                       </div>
                                       <div className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                           <Plus className="w-4 h-4 font-bold" />
                                       </div>
                                   </button>
                               ))}
                               {labelSearchTerm.length > 0 && stockConsolidado.filter(p => p.nombre_completo.toLowerCase().includes(labelSearchTerm.toLowerCase())).length === 0 && (
                                   <p className="text-center text-sm text-slate-500 py-4">No se encontraron productos.</p>
                               )}
                           </div>
                       </div>
                   ) : (
                       <div className="space-y-2">
                           <p className="text-[10px] text-center text-slate-400 font-black tracking-widest mb-4">Últimos movimientos manuales (Sugeridos para Etiquetar)</p>
                           {recentMovements.length === 0 && <p className="text-center text-sm text-slate-500 py-4">No hay ingresos manuales recientes.</p>}
                           {recentMovements.map(rec => (
                               <button key={rec.id} type="button" onClick={() => addToPrintCart({variante_id: rec.variante_id, nombre_completo: rec.nombre_variante, producto_nombre: rec.producto_nombre, sku: rec.sku})} className="w-full text-left p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 hover:border-amber-400 flex flex-col group">
                                   <div className="flex justify-between items-start mb-1">
                                       <p className="font-bold text-amber-900 dark:text-amber-100">{rec.producto_nombre} - {rec.nombre_variante}</p>
                                       <Plus className="w-4 h-4 text-amber-500 group-hover:scale-125 transition-transform" />
                                   </div>
                                   <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">Ingreso detectado: <strong className="font-black">+{rec.cantidad_afectada} u.</strong> el {new Date(rec.fecha).toLocaleDateString()}</p>
                               </button>
                           ))}
                       </div>
                   )}
               </div>
           </div>
           
           {/* RIGHT PANEL: Cart & Form */}
           <div className="w-full md:w-1/2 flex flex-col">
               <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar pr-2 space-y-3">
                   <h4 className="font-black uppercase tracking-widest text-slate-400 text-xs mb-3">Tu Carrito de Impresión</h4>
                   {printCart.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                           <Printer className="w-12 h-12 mb-4 opacity-50" />
                           <p className="font-bold text-center">No hay etiquetas pedidas.<br/><span className="text-xs font-medium">Selecciona productos a tu izquierda</span></p>
                       </div>
                   ) : (
                       printCart.map((item, index) => (
                           <div key={item.cart_id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative group">
                               <button onClick={() => removeFromPrintCart(item.cart_id)} className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                               </button>
                               <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">{item.nombre_completo}</p>
                               <div className="flex gap-3">
                                   <div className="flex-1">
                                       <label className="text-[9px] uppercase tracking-widest font-black text-slate-500 block mb-1">Cant. Unidad</label>
                                       <input type="number" min="1" value={item.cantidad_por_etiqueta} onChange={e => {
                                           const nc = [...printCart]; nc[index].cantidad_por_etiqueta = e.target.valueAsNumber || 1; setPrintCart(nc);
                                       }} className="input-nexus text-center py-1.5 font-bold" />
                                   </div>
                                   <div className="flex-1">
                                       <label className="text-[9px] uppercase tracking-widest font-black text-emerald-500 block mb-1">Pegatinas Físicas</label>
                                       <input type="number" min="1" value={item.numero_etiquetas} onChange={e => {
                                           const nc = [...printCart]; nc[index].numero_etiquetas = e.target.valueAsNumber || 1; setPrintCart(nc);
                                       }} className="input-nexus border-emerald-200 text-center py-1.5 font-bold text-emerald-700 bg-emerald-50" />
                                   </div>
                               </div>
                           </div>
                       ))
                   )}
               </div>
               
               <form onSubmit={handleGenerateLabels} className="bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 p-4 rounded-b-2xl md:rounded-2xl pt-5">
                   <div className="mb-4">
                       <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 block mb-2">Destino de Bodega Físico (Global)</label>
                       <select required value={printCartDepositoId} onChange={e => setPrintCartDepositoId(e.target.value)} className="input-nexus w-full">
                           <option value="" disabled>Selecciona el almacén...</option>
                           {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                       </select>
                   </div>
                   
                   <div className="flex justify-between items-end mb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                       <div>
                           <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Resumen Automático</p>
                           <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                               ${printCartTotalFisico} <span className="text-xs text-slate-400 font-bold">Pegatinas</span>
                           </p>
                       </div>
                       <div className="text-right">
                           <p className="text-[10px] uppercase tracking-widest font-black text-blue-500">Stock Impactado</p>
                           <p className="text-lg font-bold text-blue-700 dark:text-blue-400 mt-1">
                               +${printCartTotalStock} <span className="text-xs font-bold opacity-50">Unds.</span>
                           </p>
                       </div>
                   </div>
                   
                   <button type="submit" disabled={printCart.length === 0} className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                       <Printer className="w-5 h-5"/> Imprimir y Generar Stock
                   </button>
               </form>
           </div>
        </div>
      </Modal>
`;

txt = txt.substring(0, modalStart) + newModalUI + txt.substring(modalEnd);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("Cart System built exactly as requested");
