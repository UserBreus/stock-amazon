import fs from 'fs';

let content = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. Add rendimientos tab to type
content = content.replace("useState<'categorias' | 'titulos_base' | 'diccionario' | 'modelos' | 'proveedores'>",
                          "useState<'categorias' | 'titulos_base' | 'diccionario' | 'modelos' | 'proveedores' | 'rendimientos'>");

// 2. Add Button to tabs
const buttonCode = `
        <button onClick={() => setActiveTab('modelos')} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2", activeTab === 'modelos' ? "bg-white dark:bg-fuchsia-900/20 text-blue-900 dark:text-fuchsia-400 shadow-sm border border-transparent dark:border-fuchsia-800/50" : "text-slate-500 hover:text-slate-700")}>
            <Box className="w-4 h-4" /> 3. Modelos
        </button>
        <button onClick={() => setActiveTab('rendimientos')} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2", activeTab === 'rendimientos' ? "bg-white dark:bg-green-900/20 text-green-900 dark:text-green-400 shadow-sm border border-transparent dark:border-green-800/50" : "text-slate-500 hover:text-slate-700")}>
            <Settings className="w-4 h-4" /> Rendimientos (Kg -> Mts)
        </button>
`;
content = content.replace(/<button onClick=\{\(\) => setActiveTab\('modelos'\).*?<\/button>/s, buttonCode.trim());

// 3. Add states for Rendimientos
const statesCode = `
  // Rendimientos
  const [rendProdId, setRendProdId] = useState('');
  const [rendGramos, setRendGramos] = useState('');
  const [equivalencias, setEquivalencias] = useState<any[]>([]);

  const fetchRendimientos = async () => {
      try {
          const res = await executeAWSQuery(\`
            SELECT e.id, e.producto_maestro_id, e.gramos_por_metro_lineal, p.nombre as producto_nombre
            FROM wms_equivalencias_metricas e
            JOIN Stock_Productos_Maestros p ON e.producto_maestro_id = p.id
          \`);
          if (res) setEquivalencias(res);
      } catch (e) { console.error('Error fetching rendimientos', e); }
  };

  const saveRendimiento = async (e: any) => {
      e.preventDefault();
      if(!rendProdId || !rendGramos) return;
      try {
          // INSERT or UPDATE
          await executeAWSQuery(\`
              IF EXISTS (SELECT 1 FROM wms_equivalencias_metricas WHERE producto_maestro_id = '\${rendProdId}')
              BEGIN
                 UPDATE wms_equivalencias_metricas SET gramos_por_metro_lineal = \${rendGramos} WHERE producto_maestro_id = '\${rendProdId}'
              END
              ELSE
              BEGIN
                 INSERT INTO wms_equivalencias_metricas (producto_maestro_id, gramos_por_metro_lineal) VALUES ('\${rendProdId}', \${rendGramos})
              END
          \`);
          toast.success("Rendimiento guardado correctamente");
          setRendGramos('');
          setRendProdId('');
          fetchRendimientos();
      } catch(err) {
          toast.error("Error al guardar rendimiento");
      }
  };

  useEffect(() => {
     if(activeTab === 'rendimientos') {
         fetchRendimientos();
     }
  }, [activeTab]);

  // Modals state
`;
content = content.replace('// Modals state', statesCode.trim());

// 4. Add UI section
const uiSection = `
      {activeTab === 'rendimientos' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-green-500"/> Conversor Kg a Metros</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">Asigna cuántos gramos pesa 1 metro lineal de cada producto base.</p>
                
                <form className="space-y-5" onSubmit={saveRendimiento}>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Producto Maestro (Rollo/Tela)</label>
                        <select className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold h-[46px]" required value={rendProdId} onChange={e=>setRendProdId(e.target.value)}>
                            <option value="">Selecciona un producto matriz...</option>
                            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Peso Bruto (Gramos x Metro Lineal)</label>
                        <input type="number" step="0.01" className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold" required value={rendGramos} onChange={e=>setRendGramos(e.target.value)} placeholder="Ej: 150" />
                    </div>
                    <button type="submit" className="btn-primary w-full py-3.5 mt-2 font-black !bg-green-600 hover:!bg-green-700">Guardar Rendimiento</button>
                </form>
            </div>
            
            <div className="lg:col-span-7 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Equivalencias de Rinde Registradas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {equivalencias.map((e, idx) => (
                        <div key={idx} className="p-4 border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 rounded-xl flex flex-col hover:border-green-200 dark:hover:border-green-900/50 transition-colors">
                            <span className="font-black text-sm text-slate-900 dark:text-slate-200 mb-2">{e.producto_nombre}</span>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-xs text-green-600 dark:text-green-400 font-black tracking-widest">≈ {e.gramos_por_metro_lineal} g / Mts</span>
                            </div>
                        </div>
                    ))}
                    {equivalencias.length === 0 && (
                        <div className="col-span-2 p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-bold">
                            No hay rendimientos configurados.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
      )}

      {activeTab === 'diccionario' && (
`;
content = content.replace("{activeTab === 'diccionario' && (", uiSection);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', content);
console.log("ConfiguracionMaestros.tsx patched!");
