const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

if (!c.includes('GestionAlertasStock')) {
    c = c.replace(
        "import { GestionHistoricos } from '../components/gestion/GestionHistoricos';",
        "import { GestionHistoricos } from '../components/gestion/GestionHistoricos';\nimport { GestionAlertasStock } from '../components/gestion/GestionAlertasStock';"
    );

    const btnHTML = `
             <div 
               id="btn_sys_alertas_stock"
               draggable={isEditMode}
               onDragStart={(e) => handleDragStart(e, 'btn_sys_alertas_stock')}
               onDragOver={handleDragOver}
               onDrop={(e) => handleDrop(e, 'btn_sys_alertas_stock')}
               onClick={(e) => {
                   if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_alertas_stock'); }
                   else { setActiveTab('alertas_stock'); }
               }} 
               style={{ order: uiConfigs['btn_sys_alertas_stock']?.order_index || 11 }}
               className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5\`}
             >
                 <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl group-hover:scale-110 transition-transform">
                     <AlertOctagon className="w-6 h-6 text-rose-500 dark:text-rose-400" />
                 </div>
                 <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Alertas de Stock</span>
                 {uiConfigs['btn_sys_alertas_stock']?.descripcion && (
                     <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-auto">
                         {uiConfigs['btn_sys_alertas_stock'].descripcion}
                     </p>
                 )}
             </div>
    `;
    c = c.replace(
        /id="btn_sys_historicos"[\s\S]*?<\/div>/,
        match => match + '\n' + btnHTML
    );

    const tabHTML = `
        {activeTab === 'alertas_stock' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionAlertasStock />
          </motion.div>
        )}
    `;
    c = c.replace(
        /{activeTab === 'historicos' && \([\s\S]*?<\/motion\.div>\s*\n\s*\)}/,
        match => match + '\n' + tabHTML
    );

    // Also import AlertOctagon if needed
    if(!c.includes('AlertOctagon')) {
        c = c.replace(/import {([^}]*)} from 'lucide-react';/, "import {$1, AlertOctagon} from 'lucide-react';");
    }

    fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
    console.log("Integrado GestionAlertasStock");
} else {
    console.log("Ya está integrado");
}
