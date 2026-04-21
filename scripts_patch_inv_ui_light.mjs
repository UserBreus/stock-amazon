import fs from 'fs';

let config = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// Inject the Context
config = config.replace(
    "import { useAuth } from '../context/AuthContext';",
    "import { useAuth } from '../context/AuthContext';\nimport { useUIConfig, DynamicUIIcon } from '../context/UIContext';"
);

// Get context variables
config = config.replace(
    "const [activeTab, setActiveTab] = useState<'panel' | 'stock' | 'recepcion' | 'escaner_legacy' | 'catalogo_legacy' | 'inventario'>('panel');",
    "const [activeTab, setActiveTab] = useState<'panel' | 'stock' | 'recepcion' | 'escaner_legacy' | 'catalogo_legacy' | 'inventario'>('panel');\n  const { isEditMode, setEditingComponentId, uiConfigs, updateConfigLocal } = useUIConfig();"
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
  "return (\n    <>",
  dragHandlers + "\n  return (\n    <>"
);

const builtButtons = `
  <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto py-10 flex-col sm:flex-row flex-wrap" style={{ display: 'flex' }}>
      
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_ingreso_stock')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_ingreso_stock')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_ingreso_stock'); }
               else { setPanelView('ingreso'); }
           }} 
           style={{ order: uiConfigs['btn_ingreso_stock']?.order_index || 1 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_ingreso_stock']?.bg_color || 'bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-900'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5\`}
        >
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_ingreso_stock" fallback={ArrowDownToLine} className={\`w-8 h-8 \${uiConfigs['btn_ingreso_stock']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_ingreso_stock']?.label || 'Ingresar Stock'}</h3>
               <p className="text-slate-500 font-medium text-sm">{uiConfigs['btn_ingreso_stock']?.sub_label || 'Registrar nueva mercadería al sistema WMS mediante escaneo o compra.'}</p>
            </div>
      </button>

      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_traslado_stock')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_traslado_stock')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_traslado_stock'); }
               else { setPanelView('traslado'); }
           }} 
           style={{ order: uiConfigs['btn_traslado_stock']?.order_index || 2 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_traslado_stock']?.bg_color || 'bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-purple-200 dark:border-slate-800 dark:hover:border-purple-900'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-purple-500/5\`}
        >
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_traslado_stock" fallback={ArrowRightLeft} className={\`w-8 h-8 \${uiConfigs['btn_traslado_stock']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_traslado_stock']?.label || 'Trasladar'}</h3>
               <p className="text-slate-500 font-medium text-sm">{uiConfigs['btn_traslado_stock']?.sub_label || 'Mover artículos entre diferentes sectores y almacenes físicos.'}</p>
            </div>
      </button>

      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_retiro_stock')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_retiro_stock')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_retiro_stock'); }
               else { setPanelView('retiro'); }
           }} 
           style={{ order: uiConfigs['btn_retiro_stock']?.order_index || 3 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_retiro_stock']?.bg_color || 'bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-orange-200 dark:border-slate-800 dark:hover:border-orange-900'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-orange-500/5\`}
        >
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_retiro_stock" fallback={ArrowUpFromLine} className={\`w-8 h-8 \${uiConfigs['btn_retiro_stock']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_retiro_stock']?.label || 'Retirar Stock'}</h3>
               <p className="text-slate-500 font-medium text-sm">{uiConfigs['btn_retiro_stock']?.sub_label || 'Registrar ventas, consumos libres, mermas o salidas definitivas del patrimonio.'}</p>
            </div>
      </button>

      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_etiquetas_stock')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_etiquetas_stock')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_etiquetas_stock'); }
               else { setPanelView('etiquetas'); openLabelModal(); }
           }} 
           style={{ order: uiConfigs['btn_etiquetas_stock']?.order_index || 4 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_etiquetas_stock']?.bg_color || 'bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-600'} p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl\`}
        >
            <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_etiquetas_stock" fallback={ScanBarcode} className={\`w-8 h-8 \${uiConfigs['btn_etiquetas_stock']?.icon_color || ''}\`} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_etiquetas_stock']?.label || 'Etiquetas'}</h3>
               <p className="text-slate-500 font-medium text-sm">{uiConfigs['btn_etiquetas_stock']?.sub_label || 'Catálogo maestro para impresión o reimpresión de códigos de barras sueltos.'}</p>
            </div>
      </button>

  </motion.div>
`;

const invBuilderRegex = /<motion\.div initial=\{\{opacity:0, y:20\}\} animate=\{\{opacity:1, y:0\}\} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto py-10">[\s\S]*?<\/motion\.div>/m;

config = config.replace(invBuilderRegex, builtButtons);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', config);
