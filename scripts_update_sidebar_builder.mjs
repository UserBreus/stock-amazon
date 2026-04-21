import fs from 'fs';

let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

c = c.replace(
    "import { useAuth } from '../../context/AuthContext';",
    "import { useAuth } from '../../context/AuthContext';\nimport { useUIConfig } from '../../context/UIContext';\nimport { DraggableUIBlock } from '../ui/DraggableUIBlock';"
);

// We need to inject the context usage
c = c.replace(
    "const [isCollapsed, setIsCollapsed] = useState(false);",
    "const [isCollapsed, setIsCollapsed] = useState(false);\n  const { isEditMode, setIsEditMode, uiConfigs, updateConfigLocal } = useUIConfig();"
);

// We need to sort menuItems based on uiConfigs order
const sortingLogic = `
  const sortedMenuItems = [...menuItems].sort((a, b) => {
      const orderA = uiConfigs[a.id]?.order_index ?? 99;
      const orderB = uiConfigs[b.id]?.order_index ?? 99;
      return orderA - orderB;
  });

  const handleDropReorder = (draggedId: string, droppedId: string) => {
      const draggedObj = uiConfigs[draggedId];
      const droppedObj = uiConfigs[droppedId];
      if (!draggedObj || !droppedObj) return;

      const draggedOrder = draggedObj.order_index;
      const droppedOrder = droppedObj.order_index;
      
      updateConfigLocal(draggedId, { order_index: droppedOrder });
      updateConfigLocal(droppedId, { order_index: draggedOrder });
  };
`;

c = c.replace(
    "const handleCreateReport =",
    sortingLogic + "\n  const handleCreateReport ="
);

// Replacing the map mapping
const mapSrch = "{menuItems.filter(item => !item.roles || (profile && item.roles.includes(profile.rol))).map((item) => (";

c = c.replace(
    mapSrch,
    "{sortedMenuItems.filter(item => !item.roles || (profile && item.roles.includes(profile.rol))).map((item) => ("
);

// Replacing the return inside the map
const btnStart = `<button`;
const btnEnd = `            </button>`;
// We will replace the whole `<button ... </button>` block with UIBlock
const regexButton = /<button[\s\S]*?key=\{item\.path\}[\s\S]*?<\/button>/m;

const replacementBlock = `
            <DraggableUIBlock
              key={item.path}
              componentId={item.id}
              fallbackIcon={item.icon}
              fallbackLabel={item.name}
              renderType="sidebar_item"
              onDropReorder={handleDropReorder}
              onClick={() => {
                navigate(item.path);
                if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3.5 flex items-center gap-4 transition-all duration-300 rounded-2xl group relative",
                location.pathname === item.path 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-blue-900 dark:hover:text-blue-300",
                isCollapsed && "justify-center px-0 w-12 mx-auto"
              )}
            />
`;
c = c.replace(regexButton, replacementBlock.trim());

// We need to add the Edit Mode Toggle for Admin at the bottom of the sidebar
const logOutBtn = `<button \n              onClick={() => {\n                logout();`;
const toggleHTML = `
            {profile?.rol === 'admin' && (
               <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={cn("w-full text-left px-4 py-3 flex items-center gap-4 transition-colors font-bold rounded-xl mb-4 text-[10px] uppercase tracking-widest", isEditMode ? "bg-indigo-600 text-white" : "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100")}
               >
                 <Settings className={cn("w-4 h-4", isEditMode && "animate-spin")} />
                 {!isCollapsed && <span>{isEditMode ? 'Guardar Cambios Visuales' : 'Activar Modo Construcción'}</span>}
               </button>
            )}
`;
c = c.replace(logOutBtn, toggleHTML + "\n            " + logOutBtn);

// Need to remove `<DynamicIcon>` import if it was added manually earlier
c = c.replace(
    "import { DynamicIcon } from '../../context/IconContext';",
    ""
);


fs.writeFileSync('src/components/layout/Sidebar.tsx', c);
console.log("Sidebar updated for Drag & Drop Building");
