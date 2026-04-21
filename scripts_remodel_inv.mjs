import fs from 'fs';

let config = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const regexToReplace = /<motion\.div initial=\{\{opacity:0, y:20\}\} animate=\{\{opacity:1, y:0\}\} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto py-10 flex-col sm:flex-row flex-wrap" style=\{\{ display: 'flex' \}\}>[\s\S]*?<\/motion\.div>/m;

const newButtons = `
  <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto py-10">
      
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
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_ingreso_stock']?.bg_color || 'bg-gradient-to-br from-blue-900 to-indigo-900 text-white border border-indigo-700/50 hover:border-indigo-400/50'} p-8 rounded-3xl text-left transition-all duration-300 group flex items-center justify-between gap-6 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1 relative overflow-hidden\`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-700 pointer-events-none">
                <DynamicUIIcon id="btn_ingreso_stock" fallback={ArrowDownToLine} className="w-32 h-32" />
            </div>
            
            <div className="flex flex-col gap-4 z-10">
               <div className="p-4 bg-white/10 text-blue-200 rounded-2xl group-hover:bg-white/20 transition-transform w-fit backdrop-blur-md">
                  <DynamicUIIcon id="btn_ingreso_stock" fallback={ArrowDownToLine} className={\`w-8 h-8 \${uiConfigs['btn_ingreso_stock']?.icon_color || ''}\`} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white mb-2">{uiConfigs['btn_ingreso_stock']?.label || 'Ingresar Stock'}</h3>
                  <p className="text-blue-200/80 font-medium text-sm max-w-sm">{uiConfigs['btn_ingreso_stock']?.sub_label || 'Registrar nueva mercadería al sistema WMS mediante escaneo o compra.'}</p>
               </div>
            </div>
            <div className="hidden sm:flex p-4 rounded-full bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white transition-all z-10">
                <ArrowRightLeft className="w-6 h-6 rotate-45" />
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
           style={{ order: uiConfigs['btn_retiro_stock']?.order_index || 2 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_retiro_stock']?.bg_color || 'bg-gradient-to-br from-orange-400 to-rose-500 text-white border border-rose-300/50 hover:border-white/50'} p-8 rounded-3xl text-left transition-all duration-300 group flex items-center justify-between gap-6 hover:shadow-2xl hover:shadow-rose-500/20 hover:-translate-y-1 relative overflow-hidden\`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-700 pointer-events-none">
                <DynamicUIIcon id="btn_retiro_stock" fallback={ArrowUpFromLine} className="w-32 h-32" />
            </div>

            <div className="flex flex-col gap-4 z-10">
               <div className="p-4 bg-white/20 text-white rounded-2xl group-hover:bg-white/30 transition-transform w-fit backdrop-blur-md">
                  <DynamicUIIcon id="btn_retiro_stock" fallback={ArrowUpFromLine} className={\`w-8 h-8 \${uiConfigs['btn_retiro_stock']?.icon_color || ''}\`} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white mb-2">{uiConfigs['btn_retiro_stock']?.label || 'Retirar Stock'}</h3>
                  <p className="text-white/80 font-medium text-sm max-w-sm">{uiConfigs['btn_retiro_stock']?.sub_label || 'Registrar ventas, consumos libres, mermas o salidas.'}</p>
               </div>
            </div>
            <div className="hidden sm:flex p-4 rounded-full bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white transition-all z-10">
                <ArrowRightLeft className="w-6 h-6 rotate-45" />
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
           style={{ order: uiConfigs['btn_traslado_stock']?.order_index || 3 }}
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_traslado_stock']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-900'} p-8 rounded-3xl text-left transition-all duration-300 group flex items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden\`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-150 transition-all duration-700 pointer-events-none dark:opacity-10 dark:group-hover:opacity-20 text-slate-900 dark:text-white">
                <DynamicUIIcon id="btn_traslado_stock" fallback={ArrowRightLeft} className="w-32 h-32" />
            </div>

            <div className="flex flex-col gap-4 z-10">
               <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl group-hover:bg-purple-50 group-hover:text-purple-600 dark:group-hover:bg-purple-900/30 dark:group-hover:text-purple-400 transition-colors w-fit">
                  <DynamicUIIcon id="btn_traslado_stock" fallback={ArrowRightLeft} className={\`w-6 h-6 \${uiConfigs['btn_traslado_stock']?.icon_color || ''}\`} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_traslado_stock']?.label || 'Trasladar'}</h3>
                  <p className="text-slate-500 font-medium text-sm max-w-[200px]">{uiConfigs['btn_traslado_stock']?.sub_label || 'Mover artículos entre distintos sectores y almacenes.'}</p>
               </div>
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
           className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} \${uiConfigs['btn_etiquetas_stock']?.bg_color || 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'} p-8 rounded-3xl text-left transition-all duration-300 group flex items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden\`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-150 transition-all duration-700 pointer-events-none dark:opacity-10 dark:group-hover:opacity-20 text-slate-900 dark:text-white">
                <DynamicUIIcon id="btn_etiquetas_stock" fallback={ScanBarcode} className="w-32 h-32" />
            </div>

            <div className="flex flex-col gap-4 z-10">
               <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl group-hover:bg-slate-200 group-hover:text-slate-900 dark:group-hover:bg-slate-700 dark:group-hover:text-white transition-colors w-fit">
                  <DynamicUIIcon id="btn_etiquetas_stock" fallback={ScanBarcode} className={\`w-6 h-6 \${uiConfigs['btn_etiquetas_stock']?.icon_color || ''}\`} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{uiConfigs['btn_etiquetas_stock']?.label || 'Etiquetas'}</h3>
                  <p className="text-slate-500 font-medium text-sm max-w-[200px]">{uiConfigs['btn_etiquetas_stock']?.sub_label || 'Catálogo maestro para impresión o reimpresión de códigos sueltos.'}</p>
               </div>
            </div>
      </button>

  </motion.div>
`;

config = config.replace(regexToReplace, newButtons);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', config);
