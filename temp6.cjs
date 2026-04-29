const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. Change grid columns
c = c.replace(
    'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto py-8"',
    'className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-full mx-auto py-4 px-4"'
);

// 2. We need to replace all 7 buttons with a smaller, white design, and add the 8th button (Tipos de Facturas)
// I will parse out the entire block inside <motion.div ...> up to </motion.div>
const startToken = '<motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-full mx-auto py-4 px-4">';
const startIndex = c.indexOf(startToken);

if (startIndex !== -1) {
    const nextMotionDivEnd = c.indexOf('</motion.div>', startIndex);
    
    if (nextMotionDivEnd !== -1) {
        // Build the new buttons string
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
            newHtml += \`
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, '\${b.id}')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, '\${b.id}')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('\${b.id}'); }
               else { setActiveTab('\${b.tab}'); }
           }} 
           style={{ order: uiConfigs['\${b.id}']?.order_index || \${b.order} }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5\`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="\${b.id}" fallback={\${b.icon}} className={\`w-6 h-6 \${uiConfigs['\${b.id}']?.icon_color || ''}\`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1 leading-tight">\${uiConfigs['\${b.id}']?.label || '\${b.label}'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight max-w-full truncate text-center">\${uiConfigs['\${b.id}']?.sub_label || '\${b.sub}'}</p>
            </div>
      </button>
\`;
        }
        
        newHtml += '  </motion.div>';
        
        c = c.substring(0, startIndex) + newHtml + c.substring(nextMotionDivEnd + 13);
        fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
        console.log('Hub buttons successfully refactored');
    }
} else {
    console.log('Start token not found');
}
