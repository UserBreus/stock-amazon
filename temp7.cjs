const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const oldClass = 'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto py-8"';
const newClass = 'className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-4 max-w-[1400px] mx-auto py-4 px-4"';

c = c.replace(oldClass, newClass);

const startToken = '<motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} ' + newClass + '>';
const startIndex = c.indexOf(startToken);

if (startIndex !== -1) {
    const nextMotionDivEnd = c.indexOf('</motion.div>', startIndex);
    
    if (nextMotionDivEnd !== -1) {
        const buttons = [
            { id: 'btn_sys_maestros', icon: 'Network', label: 'Artículos Maestros', sub: 'Matrices principales.', order: 1, tab: 'titulos_base' },
            { id: 'btn_sys_variantes', icon: 'Box', label: 'Variantes (SKU)', sub: 'Generador de matrices.', order: 2, tab: 'modelos' },
            { id: 'btn_sys_rasgos', icon: 'Tag', label: 'Rasgos y Atributos', sub: 'Diccionario Variantes.', order: 3, tab: 'diccionario' },
            { id: 'btn_sys_familias', icon: 'Layers', label: 'Familias', sub: 'Categorías globales.', order: 4, tab: 'categorias' },
            { id: 'btn_sys_proveedores', icon: 'Truck', label: 'Proveedores', sub: 'Directorio importadores.', order: 5, tab: 'proveedores' },
            { id: 'btn_sys_almacenes', icon: 'ArchiveRestore', label: 'Almacenes', sub: 'Depositos de stock.', order: 6, tab: 'almacenes' },
            { id: 'btn_sys_monedas', icon: 'Banknote', label: 'Monedas', sub: 'Divisas en compras.', order: 7, tab: 'monedas' },
            { id: 'btn_sys_tipos_facturas', icon: 'FileText', label: 'Tipos Comprobantes', sub: 'Tipos de facturas.', order: 8, tab: 'tipos_facturas' }
        ];
        
        let newHtml = startToken + '\\n';
        for (const b of buttons) {
            newHtml += '      <button \\n' +
                '           draggable={isEditMode}\\n' +
                '           onDragStart={(e) => handleDragStart(e, \\'' + b.id + '\\')}\\n' +
                '           onDragOver={handleDragOver}\\n' +
                '           onDrop={(e) => handleDrop(e, \\'' + b.id + '\\')}\\n' +
                '           onClick={(e) => {\\n' +
                '               if (isEditMode) { e.preventDefault(); setEditingComponentId(\\'' + b.id + '\\'); }\\n' +
                '               else { setActiveTab(\\'' + b.tab + '\\'); }\\n' +
                '           }} \\n' +
                '           style={{ order: uiConfigs[\\'' + b.id + '\\']?.order_index || ' + b.order + ' }}\\n' +
                '           className={`${isEditMode ? \\'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]\\' : \\'\\'} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}\\n' +
                '        >\\n' +
                '            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">\\n' +
                '               <DynamicUIIcon id="' + b.id + '" fallback={' + b.icon + '} className={`w-6 h-6 ${uiConfigs[\\'' + b.id + '\\']?.icon_color || \\'\\'}`} />\\n' +
                '            </div>\\n' +
                '            <div className="flex-1 flex flex-col items-center">\\n' +
                '               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs[\\'' + b.id + '\\']?.label || \\'' + b.label + '\\'}</h3>\\n' +
                '               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs[\\'' + b.id + '\\']?.sub_label || \\'' + b.sub + '\\'}</p>\\n' +
                '            </div>\\n' +
                '      </button>\\n';
        }
        
        newHtml += '  </motion.div>';
        
        c = c.substring(0, startIndex) + newHtml + c.substring(nextMotionDivEnd + 13);
        
        // Also import FileText if it's missing
        if (!c.includes('FileText')) {
            c = c.replace('import { Settings, Network', 'import { Settings, Network, FileText');
        }
        
        // Ensure the activeTab condition for tipos_facturas exists
        if (!c.includes("activeTab === 'tipos_facturas'")) {
            const endMarker = '</AnimatePresence>';
            const tabContent = '\\n\\n      {activeTab === \\'tipos_facturas\\' && (\\n        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">\\n          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500"/> Tipos de Comprobantes</h3>\\n          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">Gestión de tipos de facturas y comprobantes para el sistema.</p>\\n          <div className="flex-1 min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">\\n             <p className="text-slate-400 font-bold text-xs">Módulo en construcción.</p>\\n          </div>\\n        </motion.div>\\n      )}\\n';
            c = c.replace(endMarker, tabContent + endMarker);
        }

        fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
        console.log('Hub buttons successfully refactored');
    } else {
        console.log('Could not find closing motion div');
    }
} else {
    console.log('Start token not found');
}
