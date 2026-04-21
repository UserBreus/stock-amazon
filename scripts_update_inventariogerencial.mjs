import fs from 'fs';

let c = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

c = c.replace(
    "import { useAuth } from '../context/AuthContext';",
    "import { useAuth } from '../context/AuthContext';\nimport { useUIConfig } from '../context/UIContext';\nimport { DraggableUIBlock } from '../components/ui/DraggableUIBlock';"
);

c = c.replace(
    "const [activeTab, setActiveTab] = useState<'panel' | 'stock' | 'recepcion' | 'escaner_legacy' | 'catalogo_legacy' | 'inventario'>('panel');",
    "const [activeTab, setActiveTab] = useState<'panel' | 'stock' | 'recepcion' | 'escaner_legacy' | 'catalogo_legacy' | 'inventario'>('panel');\n  const { uiConfigs, updateConfigLocal } = useUIConfig();"
);

// Get the group of dashboard buttons
const sortingLogic = `
          {(() => {
              const dashButtons = [
                  { id: 'btn_ingreso_stock', title: 'Ingresar Stock', sub: 'Registrar nueva mercadería al sistema WMS mediante escaneo o compra.', icon: ArrowDownToLine, action: () => setPanelView('ingreso') },
                  { id: 'btn_traslado_stock', title: 'Trasladar', sub: 'Mover artículos entre diferentes sectores y almacenes físicos.', icon: ArrowRightLeft, action: () => setPanelView('traslado') },
                  { id: 'btn_retiro_stock', title: 'Retirar Stock', sub: 'Registrar ventas, consumos libres, mermas o salidas definitivas del patrimonio.', icon: ArrowUpFromLine, action: () => setPanelView('retiro') },
                  { id: 'btn_etiquetas_stock', title: 'Etiquetas', sub: 'Catálogo maestro para impresión o reimpresión de códigos de barras sueltos.', icon: ScanBarcode, action: () => { setPanelView('etiquetas'); openLabelModal(); } }
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

              return dashButtons.map(btn => (
                  <DraggableUIBlock
                      key={btn.id}
                      componentId={btn.id}
                      fallbackLabel={btn.title}
                      fallbackSubLabel={btn.sub}
                      fallbackIcon={btn.icon}
                      onClick={btn.action}
                      onDropReorder={handleDrop}
                  />
              ));
          })()}
`;

const hubRegex = /\{\/\* INGRESO CARD \*\/\}[\s\S]*?\{\/\* IMPRESIÓN CARD \*\/\}[\s\S]*?<\/button>/m;
c = c.replace(hubRegex, sortingLogic.trim());

fs.writeFileSync('src/pages/InventarioGerencial.tsx', c);
console.log("InventarioGerencial.tsx refactored to use Builder");
