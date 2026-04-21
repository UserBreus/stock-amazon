import fs from 'fs';

let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

c = c.replace(
    "const { isEditMode, setIsEditMode, uiConfigs, updateConfigLocal } = useUIConfig();",
    "const { isEditMode, setIsEditMode, uiConfigs, updateConfigLocal, saveAllToDB } = useUIConfig();"
);

// find the toggle
const toggleHTML = `
            {profile?.rol === 'admin' && (
               <button 
                  onClick={async () => {
                      if (isEditMode) {
                          // Apagando modo edicion -> Guardar DB
                          toast.loading("Sincronizando Arquitectura Webflow...", { id: 'save_ui' });
                          await saveAllToDB();
                          toast.success("Arquitectura Guardada", { id: 'save_ui' });
                      }
                      setIsEditMode(!isEditMode);
                  }}
                  className={cn("w-full text-left px-4 py-3 flex items-center gap-4 transition-colors font-bold rounded-xl mb-4 text-[10px] uppercase tracking-widest", isEditMode ? "bg-indigo-600 text-white" : "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100")}
               >
                 <Settings className={cn("w-4 h-4", isEditMode && "animate-spin")} />
                 {!isCollapsed && <span>{isEditMode ? 'Guardar Cambios Visuales' : 'Activar Modo Construcción'}</span>}
               </button>
            )}
`;

const oldToggleRegex = /\{profile\?\.rol === 'admin' && \([\s\S]*?Guardar Cambios Visuales[\s\S]*?<\/button>\s*\)\}/m;

c = c.replace(oldToggleRegex, toggleHTML.trim());

fs.writeFileSync('src/components/layout/Sidebar.tsx', c);
console.log("Sidebar updated toggle logic for DB sync on exit");
