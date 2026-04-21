import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const target = `<button 
                  onClick={() => { setPrintScale({w: 15, h: 10}); setCustomScaleLabel(false); }}
                  className={\`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all \${!customScaleLabel && printScale.w === 15 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'border-slate-200 hover:border-emerald-300'}\`}
                >
                   <div className="w-12 h-8 rounded border-2 border-current flex items-center justify-center">15x10</div>
                   Estándar Larga (15x10 cm)
                </button>`;

const replacement = `<button 
                  onClick={() => { setPrintScale({w: 10, h: 15}); setCustomScaleLabel(false); }}
                  className={\`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all \${!customScaleLabel && printScale.w === 10 && printScale.h === 15 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'border-slate-200 hover:border-emerald-300'}\`}
                >
                   <div className="w-8 h-12 rounded border-2 border-current flex items-center justify-center">10x15</div>
                   Estándar Alta (10x15 cm)
                </button>`;

txt = txt.replace(target, replacement);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial.tsx 10x15 fix applied.");
