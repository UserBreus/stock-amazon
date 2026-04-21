import fs from 'fs';

// 1. Restore Sidebar.tsx
let sidebar = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

// Undo the UIContext import and DraggableUIBlock
sidebar = sidebar.replace(
    "import { useUIConfig } from '../../context/UIContext';\nimport { DraggableUIBlock } from '../ui/DraggableUIBlock';",
    "import { DynamicIcon } from '../../context/IconContext';"
);

// Remove the Edit Toggle from Sidebar
const toggleRegex = /\{profile\?\.rol === 'admin' && \([\s\S]*?Activar Modo Construcción'\}<\/span>\}[\s\S]*?<\/button>\s*\)\}/m;
// Also the modified toggle with saveAllToDB
const modToggleRegex = /\{profile\?\.rol === 'admin' && \([\s\S]*?Activar Modo Construcción'\}<\/span>\}[\s\S]*?<\/button>\s*\)\}/m;
sidebar = sidebar.replace(modToggleRegex, "");

// Replace the sortingLogic and UIContext hook
sidebar = sidebar.replace(
    "const [isCollapsed, setIsCollapsed] = useState(false);\n  const { isEditMode, setIsEditMode, uiConfigs, updateConfigLocal, saveAllToDB } = useUIConfig();",
    "const [isCollapsed, setIsCollapsed] = useState(false);\n"
);
// In case the saveAllToDB was not there (earlier variant)
sidebar = sidebar.replace(
    "const [isCollapsed, setIsCollapsed] = useState(false);\n  const { isEditMode, setIsEditMode, uiConfigs, updateConfigLocal } = useUIConfig();",
    "const [isCollapsed, setIsCollapsed] = useState(false);\n"
);

// Remove sortedMenuItems logic
const sortingLogicRegex = /const sortedMenuItems = \[\.\.\.menuItems\]\.sort\([\s\S]*?updateConfigLocal\(droppedId, \{ order_index: draggedOrder \}\);\n  \};\n/m;
sidebar = sidebar.replace(sortingLogicRegex, "");

// Restore menuItems.map
const mapSrch = "{sortedMenuItems.filter(item => !item.roles || (profile && item.roles.includes(profile.rol))).map((item) => (";
sidebar = sidebar.replace(mapSrch, "{menuItems.filter(item => !item.roles || (profile && item.roles.includes(profile.rol))).map((item) => (");

// Restore original Sidebar Button HTML
const draggableRegex = /<DraggableUIBlock[\s\S]*?renderType="sidebar_item"[\s\S]*?\/>/m;
const originalSidebarBtn = `
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3.5 flex items-center gap-4 transition-all duration-300 rounded-2xl group relative",
                location.pathname === item.path 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-blue-900 dark:hover:text-blue-300"
              )}
            >
              <DynamicIcon id={item.id} fallback={item.icon} className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                location.pathname === item.path ? "text-blue-900 dark:text-blue-400" : "text-slate-400 group-hover:text-blue-600"
              )} />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              )}
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-blue-900 dark:bg-blue-400 rounded-r-full"
                />
              )}
            </button>
`.trim();
sidebar = sidebar.replace(draggableRegex, originalSidebarBtn);

fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebar);

// 2. Restore InventarioGerencial.tsx
let inv = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');
inv = inv.replace(
    "import { useAuth } from '../context/AuthContext';\nimport { useUIConfig } from '../context/UIContext';\nimport { DraggableUIBlock } from '../components/ui/DraggableUIBlock';",
    "import { useAuth } from '../context/AuthContext';"
);
inv = inv.replace(
    "import { useAuth } from '../context/AuthContext';\nimport { useUIConfig } from '../context/UIContext';\nimport { DraggableUIBlock } from '../components/ui/DraggableUIBlock';",
    "import { useAuth } from '../context/AuthContext';"
);
inv = inv.replace(
    "const [activeTab, setActiveTab] = useState<'panel' | 'stock' | 'recepcion' | 'escaner_legacy' | 'catalogo_legacy' | 'inventario'>('panel');\n  const { uiConfigs, updateConfigLocal } = useUIConfig();",
    "const [activeTab, setActiveTab] = useState<'panel' | 'stock' | 'recepcion' | 'escaner_legacy' | 'catalogo_legacy' | 'inventario'>('panel');"
);

const invBuilderRegex = /\{\(\(\) => \{\n              const dashButtons = \[[\s\S]*?\}\)\(\)\}/m;
const originalInvCard = `
            {/* INGRESO CARD */}
            <button onClick={() => setPanelView('ingreso')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <ArrowDownToLine className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ingresar Stock</h3>
                   <p className="text-slate-500 font-medium text-sm">Registrar nueva mercadería al sistema WMS mediante escaneo o compra.</p>
                </div>
            </button>
            
            {/* TRASLADO CARD */}
            <button onClick={() => setPanelView('traslado')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-purple-200 dark:border-slate-800 dark:hover:border-purple-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-purple-500/5">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <ArrowRightLeft className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Trasladar</h3>
                   <p className="text-slate-500 font-medium text-sm">Mover artículos entre diferentes sectores y almacenes físicos.</p>
                </div>
            </button>

            {/* RETIRO CARD */}
            <button onClick={() => setPanelView('retiro')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-orange-200 dark:border-slate-800 dark:hover:border-orange-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-orange-500/5">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <ArrowUpFromLine className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Retirar Stock</h3>
                   <p className="text-slate-500 font-medium text-sm">Registrar ventas, consumos libres, mermas o salidas definitivas del patrimonio.</p>
                </div>
            </button>

            {/* IMPRESIÓN CARD */}
            <button onClick={() => { setPanelView('etiquetas'); openLabelModal(); }} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-600 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl group-hover:scale-110 transition-transform">
                   <ScanBarcode className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Etiquetas</h3>
                   <p className="text-slate-500 font-medium text-sm">Catálogo maestro para impresión o reimpresión de códigos de barras sueltos.</p>
                </div>
            </button>
`.trim();
inv = inv.replace(invBuilderRegex, originalInvCard);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', inv);

// 3. Restore App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("import { UIProvider } from './context/UIContext';", "import { IconProvider } from './context/IconContext';");
app = app.replace("import { UiEditorPanel } from './components/ui/UiEditorPanel';", "");
app = app.replace("<UIProvider>", "<IconProvider>");
app = app.replace("</UIProvider>", "</IconProvider>");
app = app.replace("<UiEditorPanel />", "");
fs.writeFileSync('src/App.tsx', app);

// 4. Transform UiEditorPanel into what the user actually wants: TopBar gear editor that uses IconContext.
// This will be done in the next step.

console.log('Restored heavily modified files back to native components');
