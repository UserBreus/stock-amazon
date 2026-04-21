import fs from 'fs';

let config = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

config = config.replace(
    "import { IconManager } from '../components/IconManager';",
    "import { IconManager } from '../components/IconManager';\nimport { useUIConfig, DynamicUIIcon } from '../context/UIContext';"
);

config = config.replace(
    "const [activeTab, setActiveTab] = useState<'hub' | 'categorias' | 'titulos_base' | 'diccionario' | 'modelos' | 'proveedores' | 'rendimientos' | 'iconos'>('hub');",
    "const [activeTab, setActiveTab] = useState<'hub' | 'categorias' | 'titulos_base' | 'diccionario' | 'modelos' | 'proveedores' | 'rendimientos' | 'iconos'>('hub');\n  const { isEditMode, setEditingComponentId, uiConfigs, updateConfigLocal } = useUIConfig();"
);

// Drag handlers
const dragHandlers = `
  const handleDragStart = (e: React.DragEvent, id: string) => {
      if (!isEditMode) return;
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => {
      if (!isEditMode) return;
      e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
      if (!isEditMode) return;
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== targetId) {
          const dObj = uiConfigs[draggedId] || { order_index: 99 };
          const tObj = uiConfigs[targetId] || { order_index: 99 };
          updateConfigLocal(draggedId, { order_index: tObj.order_index });
          updateConfigLocal(targetId, { order_index: dObj.order_index });
      }
  };
`;

config = config.replace(
  "return (\n    <div",
  dragHandlers + "\n  return (\n    <div"
);

const builtButtons = `
  <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto flex-col sm:flex-row flex-wrap" style={{ display: 'flex' }}>
      
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_maestros')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_maestros')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_maestros'); }
               else { setActiveTab('titulos_base'); }
           }} 
           style={{ order: uiConfigs['btn_sys_maestros']?.order_index || 1 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_maestros']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-900'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5\`}
        >
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_maestros" fallback={Network} className={\`w-8 h-8 \${uiConfigs['btn_sys_maestros']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_sys_maestros']?.label || 'Artículos Maestros'}</h3>
               <p className="text-slate-500 font-medium text-xs leading-relaxed">{uiConfigs['btn_sys_maestros']?.sub_label || 'Crea las matrices principales de cada producto de tu catálogo.'}</p>
            </div>
      </button>

      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_variantes')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_variantes')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_variantes'); }
               else { setActiveTab('modelos'); }
           }} 
           style={{ order: uiConfigs['btn_sys_variantes']?.order_index || 2 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_variantes']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-purple-300 dark:border-slate-800 dark:hover:border-purple-900'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5\`}
        >
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_variantes" fallback={Box} className={\`w-8 h-8 \${uiConfigs['btn_sys_variantes']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_sys_variantes']?.label || 'Variantes (SKU)'}</h3>
               <p className="text-slate-500 font-medium text-xs leading-relaxed">{uiConfigs['btn_sys_variantes']?.sub_label || 'Generador de matrices. Multiplica artículos por Talle/Color/etc.'}</p>
            </div>
      </button>

      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_rasgos')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_rasgos')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_rasgos'); }
               else { setActiveTab('diccionario'); }
           }} 
           style={{ order: uiConfigs['btn_sys_rasgos']?.order_index || 3 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_rasgos']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-900'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5\`}
        >
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_rasgos" fallback={Tag} className={\`w-8 h-8 \${uiConfigs['btn_sys_rasgos']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_sys_rasgos']?.label || 'Rasgos y Atributos'}</h3>
               <p className="text-slate-500 font-medium text-xs leading-relaxed">{uiConfigs['btn_sys_rasgos']?.sub_label || 'Diccionario de combinaciones usadas para armar Variantes.'}</p>
            </div>
      </button>

      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_familias')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_familias')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_familias'); }
               else { setActiveTab('categorias'); }
           }} 
           style={{ order: uiConfigs['btn_sys_familias']?.order_index || 4 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_familias']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-900'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5\`}
        >
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_familias" fallback={Layers} className={\`w-8 h-8 \${uiConfigs['btn_sys_familias']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_sys_familias']?.label || 'Familias'}</h3>
               <p className="text-slate-500 font-medium text-xs leading-relaxed">{uiConfigs['btn_sys_familias']?.sub_label || 'Categorías o agrupadores globales para estadística y orden.'}</p>
            </div>
      </button>

      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_proveedores')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_proveedores')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_proveedores'); }
               else { setActiveTab('proveedores'); }
           }} 
           style={{ order: uiConfigs['btn_sys_proveedores']?.order_index || 5 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_proveedores']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-900'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5\`}
        >
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_proveedores" fallback={Truck} className={\`w-8 h-8 \${uiConfigs['btn_sys_proveedores']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_sys_proveedores']?.label || 'Proveedores'}</h3>
               <p className="text-slate-500 font-medium text-xs leading-relaxed">{uiConfigs['btn_sys_proveedores']?.sub_label || 'Directorio de importadores y fabricantes.'}</p>
            </div>
      </button>
      
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_icons')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_icons')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_icons'); }
               else { setActiveTab('iconos'); }
           }} 
           style={{ order: uiConfigs['btn_sys_icons']?.order_index || 6 }}
           className={\`xl:col-span-2 \${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_icons']?.bg_color || 'bg-slate-950 text-white border border-slate-800 hover:border-slate-600'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5\`}
        >
            <div className="p-4 bg-slate-800 text-slate-300 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_icons" fallback={Palette} className={\`w-8 h-8 \${uiConfigs['btn_sys_icons']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-xl font-black text-white mb-2">{uiConfigs['btn_sys_icons']?.label || 'Gestor de Interfaz & Iconos'}</h3>
               <p className="text-slate-400 font-medium text-xs leading-relaxed">{uiConfigs['btn_sys_icons']?.sub_label || 'Alteración dinámica del motor visual WMS. Elije avatares SVG propios o extrae de la librería nativa de +1000 elementos.'}</p>
            </div>
      </button>

  </motion.div>
`;

const configBuilderRegex = /<motion\.div initial=\{\{opacity:0, y:20\}\} animate=\{\{opacity:1, y:0\}\} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">[\s\S]*?<\/motion\.div>/m;

config = config.replace(configBuilderRegex, builtButtons);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', config);
