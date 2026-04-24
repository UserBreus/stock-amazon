const fs = require('fs');
let s = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// Add states
const statesSearch = "  // Proveedores";
const statesReplace = `  // Monedas
  const [monedas, setMonedas] = useState<any[]>([]);
  const [monNombre, setMonNombre] = useState('');
  const [monCodigo, setMonCodigo] = useState('');
  const [monSimbolo, setMonSimbolo] = useState('');
  
  // Proveedores`;
s = s.replace(statesSearch, statesReplace);

// Add fetch inside useEffect
const effectSearch = "if(activeTab === 'almacenes') {";
const effectReplace = `if(activeTab === 'monedas') {
         executeAWSQuery("SELECT * FROM Stock_Monedas ORDER BY id ASC")
            .then((m) => { if (m) setMonedas(m); })
            .catch(console.error);
     }
     if(activeTab === 'almacenes') {`;
s = s.replace(effectSearch, effectReplace);

// Add Hub Card and Form code 
// We are looking for the exact placement in `ConfiguracionMaestros.tsx` at the end of the `hub` tab definition which switches to `proveedores`.
// The match targets:
//        </motion.div>
//      </div>
//      ) : activeTab === 'proveedores' ? (

const hubSearch = `      </motion.div>
      </div>
      ) : activeTab === 'proveedores' ? (`;

const hubReplace = `      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_monedas')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_monedas')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_monedas'); }
               else { setActiveTab('monedas'); }
           }} 
           style={{ order: uiConfigs['btn_sys_monedas']?.order_index || 10 }}
           className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-emerald-300 dark:border-slate-800 p-8 rounded-3xl text-left transition-all h-full group flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1"
        >
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_monedas" fallback={Settings} className="w-8 h-8" />
            </div>
            <div className="flex-1 flex flex-col">
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Divisas y Monedas</h3>
               <p className="text-slate-500 font-medium text-xs leading-relaxed">Administra las monedas aceptadas (USD, $) para compras e ingresos.</p>
            </div>
      </button>

      </motion.div>
      </div>
      ) : activeTab === 'monedas' ? (
      <div className="space-y-6">
            <button onClick={() => setActiveTab('hub')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl transition w-fit">
               <ArrowLeft className="w-5 h-5"/> Volver al Hub
            </button>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
               <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6">Administrar Divisas Operativas</h2>
               <form onSubmit={async (e)=>{
                   e.preventDefault();
                   if(!monNombre || !monCodigo || !monSimbolo) return;
                   try {
                       await executeAWSQuery(\`INSERT INTO Stock_Monedas (codigo, simbolo, nombre) VALUES ('\${monCodigo}', '\${monSimbolo}', '\${monNombre}')\`);
                       setMonNombre(''); setMonCodigo(''); setMonSimbolo('');
                       const d = await executeAWSQuery("SELECT * FROM Stock_Monedas ORDER BY id ASC");
                       setMonedas(d || []);
                       toast.success("Moneda añadida correctamente");
                   } catch(e){
                       toast.error("Error al adherir moneda");
                   }
               }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nombre de la Divisa</label>
                     <input placeholder="ej: Dólares Estadounidense" required value={monNombre} onChange={e=>setMonNombre(e.target.value)} className="input-nexus w-full bg-slate-50 border-none ring-1 ring-slate-200" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Código ISO</label>
                     <input placeholder="ej: USD" required value={monCodigo} onChange={e=>setMonCodigo(e.target.value.toUpperCase())} className="input-nexus w-full bg-slate-50 border-none ring-1 ring-slate-200 uppercase" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Símbolo</label>
                     <input placeholder="ej: U$S" required value={monSimbolo} onChange={e=>setMonSimbolo(e.target.value)} className="input-nexus w-full bg-slate-50 border-none ring-1 ring-slate-200" />
                  </div>
                  <button type="submit" className="button-nexus button-nexus-primary">ADHERIR</button>
               </form>
               
               <div className="mt-10 grid grid-cols-1 lg:grid-cols-4 gap-4">
                   {monedas.map(m => (
                       <div key={m.id} className="p-5 flex items-center justify-between border-2 border-slate-100 hover:border-slate-200 rounded-2xl bg-slate-50">
                           <div className="flex gap-4 items-center">
                               <div className="bg-white border border-slate-200 shadow-sm w-12 h-12 flex items-center justify-center font-black text-xl text-slate-800 rounded-xl">{m.simbolo}</div>
                               <div>
                                   <p className="font-black text-slate-800 uppercase">{m.codigo}</p>
                                   <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400">{m.nombre}</p>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
            </div>
      </div>
      ) : activeTab === 'proveedores' ? (`;

s = s.replace(hubSearch, hubReplace);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', s);
console.log('Patched');
