const fs = require('fs');

let content = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. Add state for units of measure
content = content.replace(
  "const [valoresBase, setValoresBase] = useState<{id: number, atributo_id: number, valor: string}[]>([]);",
  "const [valoresBase, setValoresBase] = useState<{id: number, atributo_id: number, valor: string}[]>([]);\n  const [unidadesMedida, setUnidadesMedida] = useState<{id: number, nombre: string}[]>([]);"
);

// 2. Fetch units of measure in fetchMemorizados
content = content.replace(
  "if(vals) setValoresBase(vals);",
  "if(vals) setValoresBase(vals);\n          const uni = await executeAWSQuery(`SELECT * FROM wms_unidades_medida ORDER BY nombre`);\n          if(uni) setUnidadesMedida(uni);"
);

// 3. fetchMemorizados called in titulos_base too!
content = content.replace(
  "if (activeTab === 'modelos' || activeTab === 'diccionario') {",
  "if (activeTab === 'modelos' || activeTab === 'diccionario' || activeTab === 'titulos_base') {"
);

// 4. Update the "Unidad de Medida" input -> select
content = content.replace(
  '<input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold" required value={pmUnidad} onChange={e=>setPmUnidad(e.target.value)} placeholder="Ej: ud, kg, lts, mt" />',
  `<select className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold h-[46px]" required value={pmUnidad} onChange={e=>setPmUnidad(e.target.value)}>
                            {unidadesMedida.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
                            {unidadesMedida.length === 0 && <option value="ud">ud</option>}
                        </select>`
);

// 5. Add the Unidades Form in Diccionario
const dictBlockToInsert = `
                <form className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6 mt-6" onSubmit={async (e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('nuevaUnidad');
                    const nm = input.value.trim().toLowerCase();
                    if(nm && !unidadesMedida.find(u => u.nombre.toLowerCase() === nm)) {
                        try {
                            const data = await executeAWSQuery(\`INSERT INTO wms_unidades_medida (nombre) OUTPUT inserted.* VALUES ('\${nm}')\`);
                            if(data && data.length > 0) {
                                setUnidadesMedida(prev => [...prev, data[0]]);
                                toast.success("Unidad registrada");
                                input.value = '';
                            }
                        } catch (err) { toast.error("Error creando unidad"); }
                    } else if (nm) {
                        toast.error("La unidad ya existe.");
                    }
                }}>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Nueva Unidad de Medida</label>
                        <input name="nuevaUnidad" className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold h-12" required placeholder="Ej: kg, litros, cajas..." />
                    </div>
                    <button type="submit" className="btn-primary w-full py-3 mt-2 font-black">Crear Unidad</button>
                </form>
                
                <div className="mt-6">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Unidades Activas</label>
                    <div className="flex flex-wrap gap-2">
                        {unidadesMedida.map(u => (
                            <span key={u.id} className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1.5 rounded flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/30">
                                {u.nombre}
                                <button onClick={async() => {
                                    try {
                                        await executeAWSQuery(\`DELETE FROM wms_unidades_medida WHERE id = \${u.id}\`);
                                        setUnidadesMedida(prev => prev.filter(x => x.id !== u.id));
                                    } catch(e) { toast.error("Error al eliminar"); }
                                }} className="text-emerald-500/50 hover:text-red-500 ml-1">&times;</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>`;

content = content.replace(
  '</form>\n            </div>',
  '</form>' + dictBlockToInsert
);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', content);
console.log('UI Patch Applied');
