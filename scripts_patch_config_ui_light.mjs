import fs from 'fs';

let config = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// Inject the Context
config = config.replace(
    "import { IconManager } from '../components/IconManager';",
    "import { IconManager } from '../components/IconManager';\nimport { useUIConfig, DynamicUIIcon } from '../context/UIContext';"
);

// Get context variables
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

// Removed the unused function

// I will write a simple array-based map for the 7 buttons to maintain their exact original class
const buttonsData = [
  { id: 'btn_sys_maestros', tab: 'titulos_base', defaultTitle: 'Artículos Maestros', defaultDesc: 'Crea las matrices principales de cada producto de tu catálogo.', iconName: 'Network', colorClass: 'blue' },
  { id: 'btn_sys_variantes', tab: 'modelos', defaultTitle: 'Variantes (SKU)', defaultDesc: 'Generador de matrices. Multiplica artículos por Talle/Color/etc.', iconName: 'Box', colorClass: 'purple' },
  { id: 'btn_sys_rasgos', tab: 'diccionario', defaultTitle: 'Rasgos y Atributos', defaultDesc: 'Diccionario de combinaciones usadas para armar Variantes.', iconName: 'Tag', colorClass: 'indigo' },
  { id: 'btn_sys_familias', tab: 'categorias', defaultTitle: 'Familias', defaultDesc: 'Categorías o agrupadores globales para estadística y orden.', iconName: 'Layers', colorClass: 'emerald' },
  { id: 'btn_sys_proveedores', tab: 'proveedores', defaultTitle: 'Proveedores', defaultDesc: 'Directorio de importadores y fabricantes.', iconName: 'Truck', colorClass: 'amber' },
  { id: 'btn_sys_rindes', tab: 'rendimientos', defaultTitle: 'Rendimientos WMS', defaultDesc: 'Matemática de equivalencias (Kilos a Metros Lineales).', iconName: 'Network', colorClass: 'teal' },
  { id: 'btn_sys_icons', tab: 'iconos', defaultTitle: 'Gestor de Interfaz & Iconos', defaultDesc: 'Alteración dinámica del motor visual WMS. Elije avatares SVG propios o extrae de la librería nativa de +1000 elementos.', iconName: 'Palette', colorClass: 'slate_special' }
];

const builtButtons = buttonsData.map(b => {
    const isSpecial = b.colorClass === 'slate_special';
    const bgOuter = isSpecial ? 'bg-slate-950 text-white border border-slate-800 hover:border-slate-600' : \`bg-white dark:bg-slate-900 border border-slate-200 hover:border-\${b.colorClass}-300 dark:border-slate-800 dark:hover:border-\${b.colorClass}-900\`;
    const innerBubble = isSpecial ? 'bg-slate-800 text-slate-300' : \`bg-\${b.colorClass}-50 dark:bg-\${b.colorClass}-900/30 text-\${b.colorClass}-600 dark:text-\${b.colorClass}-400\`;
    const colSpan = isSpecial ? ' xl:col-span-2' : '';
    const h3Classes = isSpecial ? 'text-xl font-black text-white mb-2' : 'text-xl font-black text-slate-800 dark:text-white mb-2';
    const descClasses = isSpecial ? 'text-slate-400 font-medium text-xs leading-relaxed' : 'text-slate-500 font-medium text-xs leading-relaxed';

    return \`
        <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, '\${b.id}')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, '\${b.id}')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('\${b.id}'); }
               else { setActiveTab('\${b.tab}'); }
           }} 
           style={{ order: uiConfigs['\${b.id}']?.order_index || 99 }}
           className={\`\${isEditMode ? 'ring-2 ring-transparent hover:ring-indigo-500/50 cursor-move border-dashed' : ''} \${uiConfigs['\${b.id}']?.bg_color || '\${bgOuter}'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5\${colSpan}\`}
        >
            <div className={\`p-4 \${innerBubble} rounded-2xl group-hover:scale-110 transition-transform\`}>
               <DynamicUIIcon id="\${b.id}" fallback={\${b.iconName}} className={\`w-8 h-8 \${uiConfigs['\${b.id}']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="\${h3Classes}">{uiConfigs['\${b.id}']?.label || '\${b.defaultTitle}'}</h3>
               <p className="\${descClasses}">{uiConfigs['\${b.id}']?.sub_label || '${b.defaultDesc}'}</p>
            </div>
        </button>
    \`;
}).join('\n');

const configBuilderRegex = /<motion\.div initial=\{\{opacity:0, y:20\}\} animate=\{\{opacity:1, y:0\}\} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">[\s\S]*?<\/motion\.div>/m;

config = config.replace(configBuilderRegex, \`
  <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto flex-col sm:flex-row flex-wrap" style={{ display: 'flex' }}>
     \${builtButtons}
  </motion.div>
\`);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', config);
console.log('Restaurada ConfiguracionMaestros con la UI Original + Flex Order Nativo.');
