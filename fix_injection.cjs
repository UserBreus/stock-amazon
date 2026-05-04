const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const btnIndex = c.indexOf(`uiConfigs['btn_sys_alertas_stock']?.sub_label`);
const btnEnd = c.indexOf('</button>', btnIndex) + 9;

const btnHTML = `

        <button 
             draggable={isEditMode}
             onDragStart={(e) => handleDragStart(e, 'btn_sys_costos_cero')}
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, 'btn_sys_costos_cero')}
             onClick={(e) => {
                 if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_costos_cero'); }
                 else { setActiveTab('costos_cero'); }
             }} 
             style={{ order: uiConfigs['btn_sys_costos_cero']?.order_index || 12 }}
             className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5\`}
          >
              <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
                 <DynamicUIIcon id="btn_sys_costos_cero" fallback={DollarSign} className={\`w-6 h-6 \${uiConfigs['btn_sys_costos_cero']?.icon_color || ''}\`} />
              </div>
              <div className="flex-1 flex flex-col items-center">
                 <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_costos_cero']?.label || 'Costos Cero'}</h3>
                 <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_costos_cero']?.sub_label || 'Asignar costos.'}</p>
              </div>
        </button>`;

c = c.substring(0, btnEnd) + btnHTML + c.substring(btnEnd);

const tabIndex = c.indexOf(`{activeTab === 'alertas_stock' && (`);
const tabEnd = c.indexOf('</motion.div>', tabIndex) + 13;
const closeBracketEnd = c.indexOf(')}', tabEnd) + 2;

const tabHTML = `

        {activeTab === 'costos_cero' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionCostosCero />
          </motion.div>
        )}`;

c = c.substring(0, closeBracketEnd) + tabHTML + c.substring(closeBracketEnd);

c = c.replace(
    "import { Settings, Box, Network, Truck, Search, Folder, ArrowLeft, Palette, LayoutDashboard, Tag, Layers, ArchiveRestore, History, Edit3, Trash2, Banknote, FileText, ChevronRight, AlertOctagon } from 'lucide-react';",
    "import { Settings, Box, Network, Truck, Search, Folder, ArrowLeft, Palette, LayoutDashboard, Tag, Layers, ArchiveRestore, History, Edit3, Trash2, Banknote, FileText, ChevronRight, AlertOctagon, DollarSign } from 'lucide-react';"
);

// Clean up duplicate imports from previous attempt
const lines = c.split('\\n');
const uniqueLines = [];
let skipNext = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import { GestionCostosCero }')) {
        if (!skipNext) {
            uniqueLines.push(lines[i]);
            skipNext = true;
        }
    } else {
        uniqueLines.push(lines[i]);
    }
}
c = uniqueLines.join('\\n');

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log("Integrado correctamente con indices.");
