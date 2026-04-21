import fs from 'fs';

let config = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. Fix the Grid container. Remove style={{display:'flex'}} and flex classes.
const regexContainer = /<motion\.div initial=\{\{opacity:0, y:20\}\} animate=\{\{opacity:1, y:0\}\} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto flex-col sm:flex-row flex-wrap" style=\{\{ display: 'flex' \}\}>/m;

config = config.replace(regexContainer, '<motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">');

// 2. We need to replace ALL buttons to have `h-full justify-start` instead of random heights.
// Also, we remove `btn_sys_icons` and add `btn_sys_almacenes`.

const newHubButtons = `
  <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto py-8">
      
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
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_maestros']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-900'} p-8 rounded-3xl text-left transition-all h-full group flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1\`}
        >
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_maestros" fallback={Network} className={\`w-8 h-8 \${uiConfigs['btn_sys_maestros']?.icon_color || ''}\`} />
            </div>
            <div className="flex-1 flex flex-col">
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
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_variantes']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-purple-300 dark:border-slate-800 dark:hover:border-purple-900'} p-8 rounded-3xl text-left transition-all h-full group flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1\`}
        >
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_variantes" fallback={Box} className={\`w-8 h-8 \${uiConfigs['btn_sys_variantes']?.icon_color || ''}\`} />
            </div>
            <div className="flex-1 flex flex-col">
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
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_rasgos']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-900'} p-8 rounded-3xl text-left transition-all h-full group flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1\`}
        >
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_rasgos" fallback={Tag} className={\`w-8 h-8 \${uiConfigs['btn_sys_rasgos']?.icon_color || ''}\`} />
            </div>
            <div className="flex-1 flex flex-col">
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
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_familias']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-900'} p-8 rounded-3xl text-left transition-all h-full group flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1\`}
        >
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_familias" fallback={Layers} className={\`w-8 h-8 \${uiConfigs['btn_sys_familias']?.icon_color || ''}\`} />
            </div>
            <div className="flex-1 flex flex-col">
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
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_proveedores']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-900'} p-8 rounded-3xl text-left transition-all h-full group flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1\`}
        >
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_proveedores" fallback={Truck} className={\`w-8 h-8 \${uiConfigs['btn_sys_proveedores']?.icon_color || ''}\`} />
            </div>
            <div className="flex-1 flex flex-col">
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_sys_proveedores']?.label || 'Proveedores'}</h3>
               <p className="text-slate-500 font-medium text-xs leading-relaxed">{uiConfigs['btn_sys_proveedores']?.sub_label || 'Directorio de importadores y fabricantes.'}</p>
            </div>
      </button>

      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_almacenes')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_almacenes')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_almacenes'); }
               else { setActiveTab('almacenes'); }
           }} 
           style={{ order: uiConfigs['btn_sys_almacenes']?.order_index || 6 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_sys_almacenes']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 hover:border-rose-300 dark:border-slate-800 dark:hover:border-rose-900'} p-8 rounded-3xl text-left transition-all h-full group flex flex-col items-start gap-6 hover:shadow-xl hover:-translate-y-1\`}
        >
            <div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl group-hover:scale-110 transition-transform">
               <DynamicUIIcon id="btn_sys_almacenes" fallback={ArchiveRestore} className={\`w-8 h-8 \${uiConfigs['btn_sys_almacenes']?.icon_color || ''}\`} />
            </div>
            <div className="flex-1 flex flex-col">
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_sys_almacenes']?.label || 'Almacenes y Sectores'}</h3>
               <p className="text-slate-500 font-medium text-xs leading-relaxed">{uiConfigs['btn_sys_almacenes']?.sub_label || 'Locaciones físicas o lógicas. Configuración de depositos de stock.'}</p>
            </div>
      </button>
  </motion.div>
`;

const replaceAllHub = /<motion\.div initial=\{\{opacity:0, y:20\}\} animate=\{\{opacity:1, y:0\}\} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto flex-col sm:flex-row flex-wrap" style=\{\{ display: 'flex' \}\}>[\s\S]*?<\/motion\.div>/m;
const oldFallbackRegex = /<motion\.div initial=\{\{opacity:0, y:20\}\} animate=\{\{opacity:1, y:0\}\} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto flex-col sm:flex-row flex-wrap" style=\{\{ display: 'flex' \}\}>[\s\S]*?<\/motion\.div>/m;


if(config.match(replaceAllHub)) {
    config = config.replace(replaceAllHub, newHubButtons);
} else {
    // If we already ran step 1 where we removed style={{display:flex}}, we need another regex:
    const regex2 = /<motion\.div initial=\{\{opacity:0, y:20\}\} animate=\{\{opacity:1, y:0\}\} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">[\s\S]*?<\/motion\.div>/m;
    config = config.replace(regex2, newHubButtons);
}


// Add a stub panel for "almacenes" Tab
const almacenesTabJSX = \`
      {activeTab === 'almacenes' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto mt-10">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3"><ArchiveRestore className="w-6 h-6 text-rose-500"/> Almacenes y Sectores</h3>
            <p className="text-slate-500 font-medium mb-10">Creación de locaciones de stock. (Módulo en Desarrollo).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950">
                  <h4 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-4">Añadir Nuevo</h4>
                  <form className="space-y-4">
                     <input placeholder="Nombre del Almacen..." className="input-nexus w-full bg-white dark:bg-slate-900" />
                     <input placeholder="Ubicación (opcional)" className="input-nexus w-full bg-white dark:bg-slate-900" />
                     <button className="btn-primary w-full py-3" type="button">Guardar Almacén</button>
                  </form>
               </div>
               
               <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl bg-white dark:bg-slate-900">
                   <h4 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-4">Directorio Actual</h4>
                   <div className="text-center py-10 text-slate-400 font-bold">BD Sincronizándose...</div>
               </div>
            </div>
        </motion.div>
      )}
\`;

config = config.replace("{activeTab === 'iconos' && <IconManager />}", "{activeTab === 'iconos' && <IconManager />}" + "\\n" + almacenesTabJSX);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', config);
