import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const target = `<div className="relative group">
              <button 
                className="btn-primary flex items-center gap-2"
              >
                <ScanBarcode className="w-4 h-4" /> Imprimir Etiquetas
              </button>
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button onClick={() => setIsLabelCompraModalOpen(true)} className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 text-left">
                     <Receipt className="w-4 h-4 text-emerald-500" /> De Orden de Compra
                  </button>
                  <button onClick={() => setIsLabelModalOpen(true)} className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-2 text-left">
                     <Package className="w-4 h-4 text-indigo-500" /> Sueltas a Mano
                  </button>
              </div>
          </div>`;

const replacement = `              <button 
                onClick={() => setIsLabelCompraModalOpen(true)}
                className="btn-nexus bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
              >
                <Receipt className="w-4 h-4" /> Imprimir de Orden
              </button>
              <button 
                onClick={() => setIsLabelModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <ScanBarcode className="w-4 h-4" /> Etiquetas A Mano
              </button>`;

txt = txt.replace(target, replacement);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial.tsx buttons replaced!");
