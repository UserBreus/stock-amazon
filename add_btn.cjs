const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const btn = `</button>
        <button 
             draggable={isEditMode}
             onDragStart={(e) => handleDragStart(e, 'btn_sys_historicos')}
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, 'btn_sys_historicos')}
             onClick={(e) => {
                 if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_historicos'); }
                 else { setActiveTab('historicos'); }
             }} 
             style={{ order: uiConfigs['btn_sys_historicos']?.order_index || 10 }}
             className={\`\${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5\`}
          >
              <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
                 <DynamicUIIcon id="btn_sys_historicos" fallback={History} className={\`w-6 h-6 \${uiConfigs['btn_sys_historicos']?.icon_color || ''}\`} />
              </div>
              <div className="flex-1 flex flex-col items-center">
                 <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_historicos']?.label || 'Históricos'}</h3>
                 <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_historicos']?.sub_label || 'Egresos manuales.'}</p>
              </div>
        </button>
    </motion.div>`;

c = c.replace(/<\/button>\s*<\/motion\.div>/, btn);

const render = `        {activeTab === 'usuarios' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionUsuarios />
          </motion.div>
        )}

        {activeTab === 'historicos' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionHistoricos />
          </motion.div>
        )}`;

c = c.replace(/\{activeTab === 'usuarios' && \([\s\S]*?<\/motion\.div>\s*\)\}/, render);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
