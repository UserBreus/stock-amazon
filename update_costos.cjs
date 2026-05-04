const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

if (!c.includes('GestionCostosCero')) {
    c = c.replace(
        "import { GestionAlertasStock } from '../components/gestion/GestionAlertasStock';",
        "import { GestionAlertasStock } from '../components/gestion/GestionAlertasStock';\nimport { GestionCostosCero } from '../components/gestion/GestionCostosCero';"
    );

    const btnHTML = '        <button \n' +
'             draggable={isEditMode}\n' +
'             onDragStart={(e) => handleDragStart(e, \'btn_sys_costos_cero\')}\n' +
'             onDragOver={handleDragOver}\n' +
'             onDrop={(e) => handleDrop(e, \'btn_sys_costos_cero\')}\n' +
'             onClick={(e) => {\n' +
'                 if (isEditMode) { e.preventDefault(); setEditingComponentId(\'btn_sys_costos_cero\'); }\n' +
'                 else { setActiveTab(\'costos_cero\'); }\n' +
'             }} \n' +
'             style={{ order: uiConfigs[\'btn_sys_costos_cero\']?.order_index || 12 }}\n' +
'             className={`${isEditMode ? \'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]\' : \'\'} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}\n' +
'          >\n' +
'              <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">\n' +
'                 <DynamicUIIcon id="btn_sys_costos_cero" fallback={DollarSign} className={`w-6 h-6 ${uiConfigs[\'btn_sys_costos_cero\']?.icon_color || \'\'}`} />\n' +
'              </div>\n' +
'              <div className="flex-1 flex flex-col items-center">\n' +
'                 <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs[\'btn_sys_costos_cero\']?.label || \'Costos Cero\'}</h3>\n' +
'                 <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs[\'btn_sys_costos_cero\']?.sub_label || \'Asignar costos.\'}</p>\n' +
'              </div>\n' +
'        </button>';

    c = c.replace(
        /onDragStart={(e) => handleDragStart(e, 'btn_sys_alertas_stock')}[\s\S]*?<\/button>/,
        match => match + '\n' + btnHTML
    );

    const tabHTML = '        {activeTab === \'costos_cero\' && (\n' +
'          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">\n' +
'              <GestionCostosCero />\n' +
'          </motion.div>\n' +
'        )}';
        
    c = c.replace(
        /{activeTab === 'alertas_stock' && \([\s\S]*?<\/motion\.div>\s*\n\s*\)}/,
        match => match + '\n' + tabHTML
    );

    if(!c.includes('DollarSign')) {
        c = c.replace(/import {([^}]*)} from 'lucide-react';/, (m, p1) => {
            if (p1.includes('DollarSign')) return m;
            return 'import {' + p1 + ', DollarSign} from \'lucide-react\';';
        });
    }

    fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
    console.log("Integrado GestionCostosCero");
} else {
    console.log("Ya está integrado");
}
