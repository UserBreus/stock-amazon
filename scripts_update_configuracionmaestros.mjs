import fs from 'fs';

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

c = c.replace(
    "import { IconManager } from '../components/IconManager';",
    "import { IconManager } from '../components/IconManager';\nimport { useUIConfig } from '../context/UIContext';\nimport { DraggableUIBlock } from '../components/ui/DraggableUIBlock';"
);

c = c.replace(
    "const [activeTab, setActiveTab] = useState<'hub' | 'categorias' | 'titulos_base' | 'diccionario' | 'modelos' | 'proveedores' | 'rendimientos' | 'iconos'>('hub');",
    "const [activeTab, setActiveTab] = useState<'hub' | 'categorias' | 'titulos_base' | 'diccionario' | 'modelos' | 'proveedores' | 'rendimientos' | 'iconos'>('hub');\n  const { uiConfigs, updateConfigLocal } = useUIConfig();"
);

// We need to replace the entire <motion.div grid that maps the buttons!
const sortingLogic = `
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {(() => {
                const sysButtons = [
                    { id: 'btn_sys_maestros', title: 'Artículos Maestros', sub: 'Crea las matrices principales de cada producto de tu catálogo.', icon: Network, action: () => setActiveTab('titulos_base') },
                    { id: 'btn_sys_variantes', title: 'Variantes (SKU)', sub: 'Generador de matrices. Multiplica artículos por Talle/Color/etc.', icon: Box, action: () => setActiveTab('modelos') },
                    { id: 'btn_sys_rasgos', title: 'Rasgos y Atributos', sub: 'Diccionario de combinaciones usadas para armar Variantes.', icon: Tag, action: () => setActiveTab('diccionario') },
                    { id: 'btn_sys_familias', title: 'Familias', sub: 'Categorías o agrupadores globales para estadística y orden.', icon: Layers, action: () => setActiveTab('categorias') },
                    { id: 'btn_sys_proveedores', title: 'Proveedores', sub: 'Directorio de importadores y fabricantes.', icon: Truck, action: () => setActiveTab('proveedores') },
                    { id: 'btn_sys_rindes', title: 'Rendimientos WMS', sub: 'Matemática de equivalencias (Kilos a Metros Lineales).', icon: Network, action: () => setActiveTab('rendimientos') },
                    { id: 'btn_sys_icons', title: 'Gestor de Interfaz & Iconos', sub: 'Alteración dinámica del motor visual WMS.', icon: Palette, action: () => setActiveTab('iconos') }
                ].sort((a,b) => {
                    const oA = uiConfigs[a.id]?.order_index ?? 99;
                    const oB = uiConfigs[b.id]?.order_index ?? 99;
                    return oA - oB;
                });

                const handleDrop = (draggedId: string, droppedId: string) => {
                    const draggedObj = uiConfigs[draggedId];
                    const droppedObj = uiConfigs[droppedId];
                    if (!draggedObj || !droppedObj) return;
                    updateConfigLocal(draggedId, { order_index: droppedObj.order_index });
                    updateConfigLocal(droppedId, { order_index: draggedObj.order_index });
                };

                return sysButtons.map(btn => (
                    <DraggableUIBlock
                        key={btn.id}
                        componentId={btn.id}
                        fallbackLabel={btn.title}
                        fallbackSubLabel={btn.sub}
                        fallbackIcon={btn.icon}
                        onClick={btn.action}
                        onDropReorder={handleDrop}
                        className={btn.id === 'btn_sys_icons' ? 'xl:col-span-2' : ''}
                    />
                ));
            })()}
          </motion.div>
`;

const hubRegex = /<motion\.div initial=\{\{opacity:0, y:20\}\} animate=\{\{opacity:1, y:0\}\} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">[\s\S]*?<\/motion\.div>/m;
c = c.replace(hubRegex, sortingLogic.trim());

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log("ConfiguracionMaestros.tsx refactored to use Builder");
