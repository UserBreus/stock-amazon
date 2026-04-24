const fs = require('fs');
let s = fs.readFileSync('src/pages/Ingresos.tsx', 'utf8');

// Cabecera state
s = s.replace("const [gastosExtras, setGastosExtras] = useState<string>('');", 
              "const [gastosExtras, setGastosExtras] = useState<string>('');\n  const [monedas, setMonedas] = useState<any[]>([]);\n  const [monedaId, setMonedaId] = useState<string>('1');");

// Fetch logic
s = s.replace("const [provs, tiposF, cats, vars, deps, maestRes] = await Promise.all([", 
              "const [provs, tiposF, cats, vars, deps, maestRes, monRes] = await Promise.all([");

s = s.replace('executeAWSQuery("SELECT * FROM Stock_Productos_Maestros ORDER BY nombre")\n      ]);', 
              'executeAWSQuery("SELECT * FROM Stock_Productos_Maestros ORDER BY nombre"),\n        executeAWSQuery("SELECT * FROM Stock_Monedas ORDER BY id")\n      ]);');

s = s.replace('if(maestRes) setMaestros(maestRes);', 
              'if(maestRes) setMaestros(maestRes);\n      if(monRes) setMonedas(monRes);');

// Edit logic (loading draft)
s = s.replace("setGastosExtras(c.gastos_extras?.toString() || '');",
              "setGastosExtras(c.gastos_extras?.toString() || '');\n          setMonedaId(c.moneda_id?.toString() || '1');");

// SQL logic
s = s.replace("total_compra = ${total}, gastos_extras = ${valGastos}, estado = '${estado}' WHERE id = '${editingDraftId}';",
              "total_compra = ${total}, gastos_extras = ${valGastos}, estado = '${estado}', moneda_id = ${monedaId} WHERE id = '${editingDraftId}';");

s = s.replace("id, proveedor_id, referencia_factura, tipo_factura_id, total_compra, creado_por, estado, gastos_extras)",
              "id, proveedor_id, referencia_factura, tipo_factura_id, total_compra, creado_por, estado, gastos_extras, moneda_id)");

s = s.replace("VALUES (@CompraId, '${provId}', '${referencia}', ${tipoFacturaId}, ${total}, '${user?.id}', '${estado}', ${valGastos});",
              "VALUES (@CompraId, '${provId}', '${referencia}', ${tipoFacturaId}, ${total}, '${user?.id}', '${estado}', ${valGastos}, ${monedaId});");

// UI integration
const selectSearch = `<div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest pl-1">Monto Flete / Costos Extra ($)</label>
                            <input 
                                type="number"`;
const selectReplace = `<div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest pl-1">Moneda Base</label>
                            <select 
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-slate-800 transition-colors focus:border-indigo-400 shadow-sm outline-none cursor-pointer"
                                value={monedaId}
                                onChange={e=>setMonedaId(e.target.value)}
                            >
                                {monedas.map(m => <option key={m.id} value={m.id}>{m.codigo} ({m.simbolo})</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest pl-1">Costos Extras</label>
                            <input 
                                type="number"`;

s = s.replace(selectSearch, selectReplace);

fs.writeFileSync('src/pages/Ingresos.tsx', s);
console.log('Patched ingresos');
