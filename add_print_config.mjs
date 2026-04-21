import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Add new state for Print Config Modal
const stateDeclaration = `const [selectedCompraId, setSelectedCompraId] = useState<string>('');`;
const newStateVars = `const [selectedCompraId, setSelectedCompraId] = useState<string>('');
  
  // -- ESTADOS DE IMPRESIÓN WMS --
  const [isPrintConfigModalOpen, setIsPrintConfigModalOpen] = useState(false);
  const [printScale, setPrintScale] = useState({ w: 4, h: 4 });
  const [customScaleLabel, setCustomScaleLabel] = useState(false);`;
txt = txt.replace(stateDeclaration, newStateVars);

// 2. Add the Print Config Modal in the JSX
const printConfigModal = `
      {/* MODAL CONFIGURACIÓN IMPRESIÓN */}
      <Modal isOpen={isPrintConfigModalOpen} onClose={() => setIsPrintConfigModalOpen(false)} title="Calibrar Escala de Impresión">
         <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex gap-4 items-start">
               <Printer className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
               <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-300">Formato de Ticketera</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Selecciona el tamaño exacto del rollo de etiquetas cargado en la ticketera para asegurar que los bordes correspondan.</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setPrintScale({w: 4, h: 4}); setCustomScaleLabel(false); }}
                  className={\`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all \${!customScaleLabel && printScale.w === 4 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'border-slate-200 hover:border-emerald-300'}\`}
                >
                   <div className="w-8 h-8 rounded border-2 border-current flex items-center justify-center">4x4</div>
                   Cuadrada (4x4 cm)
                </button>
                <button 
                  onClick={() => { setPrintScale({w: 15, h: 10}); setCustomScaleLabel(false); }}
                  className={\`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all \${!customScaleLabel && printScale.w === 15 ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'border-slate-200 hover:border-emerald-300'}\`}
                >
                   <div className="w-12 h-8 rounded border-2 border-current flex items-center justify-center">15x10</div>
                   Estándar Larga (15x10 cm)
                </button>
            </div>
            
            {user?.rol === 'Administrador' && (
               <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                      <input type="checkbox" id="customScale" checked={customScaleLabel} onChange={e => setCustomScaleLabel(e.target.checked)} className="rounded" />
                      <label htmlFor="customScale" className="text-sm font-bold flex items-center gap-2">🔥 Usar Escala Paramétrica Personalizada (Modo Super Usuario)</label>
                  </div>
                  
                  {customScaleLabel && (
                     <div className="flex gap-4 items-center pl-6">
                        <div className="flex-1">
                           <label className="text-[10px] uppercase font-black text-slate-400">Ancho (cm)</label>
                           <input type="number" min="1" step="0.1" value={printScale.w} onChange={e => setPrintScale({...printScale, w: parseFloat(e.target.value)||4})} className="input-nexus w-full font-mono text-center" />
                        </div>
                        <span className="text-slate-400 font-black mt-4">X</span>
                        <div className="flex-1">
                           <label className="text-[10px] uppercase font-black text-slate-400">Alto (cm)</label>
                           <input type="number" min="1" step="0.1" value={printScale.h} onChange={e => setPrintScale({...printScale, h: parseFloat(e.target.value)||4})} className="input-nexus w-full font-mono text-center" />
                        </div>
                     </div>
                  )}
               </div>
            )}
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button onClick={() => { setIsPrintConfigModalOpen(false); setTimeout(() => window.print(), 300); }} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                   <Printer className="w-5 h-5"/> Confirmar e Imprimir
                </button>
            </div>
         </div>
      </Modal>
`;
const insertionTarget = '{/* ZONA DE IMPRESIÓN (OCULTA EN PANTALLA) */}';
txt = txt.replace(insertionTarget, printConfigModal + '\n\n    ' + insertionTarget);

// 3. Update the print zone CSS
const printZoneTarget = `<div className="hidden print:block w-full bg-white">
         {printEtiquetas.map(lbl => (
           <div key={lbl.id} className="w-[10cm] h-[15cm] border border-black flex flex-col items-center justify-center break-after-page shadow-none p-4 mx-auto mb-4">`;
           
const printZoneReplacement = `<div id="print-root" className="hidden print:block w-full bg-white">
         {printEtiquetas.map(lbl => (
           <div key={lbl.id} style={{ width: printScale.w + 'cm', height: printScale.h + 'cm' }} className="border border-black flex flex-col items-center justify-center break-after-page shadow-none p-2 mx-auto mb-4">`;
txt = txt.replace(printZoneTarget, printZoneReplacement);

// 4. Remove all direct window.print() calls and replace with setIsPrintConfigModalOpen(true)
txt = txt.replace(/setTimeout\(\(\) => \{\s*window\.print\(\);\s*\}, 500\);/g, 'setIsPrintConfigModalOpen(true);');
txt = txt.replace(/setTimeout\(\(\) => \{ window\.print\(\); \}, 500\);/g, 'setIsPrintConfigModalOpen(true);');

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial.tsx fully upgraded for custom printing scales!");
