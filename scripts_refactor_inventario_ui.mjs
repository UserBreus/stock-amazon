import fs from 'fs';

let c = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// Add ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine, LayoutDashboard, History, ScanBarcode
c = c.replace(
  "import { Plus, Scan, ScanBarcode, PackagePlus, AlertCircle, ArchiveRestore, Printer, Search, CreditCard, Activity, Box, ArrowUpRight, Zap, ChevronDown, ChevronRight, Layers, Receipt, Package, Network } from 'lucide-react';",
  "import { Plus, Scan, ScanBarcode, PackagePlus, AlertCircle, ArchiveRestore, Printer, Search, CreditCard, Activity, Box, ArrowUpRight, Zap, ChevronDown, ChevronRight, Layers, Receipt, Package, Network, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, LayoutDashboard, History } from 'lucide-react';"
);

// Update activeTab initial state to 'panel' instead of 'stock'
c = c.replace(
  "const [activeTab, setActiveTab] = useState<'stock' | 'escaner' | 'catalogo' | 'recepcion' | 'despacho'>('stock');",
  "const [activeTab, setActiveTab] = useState<'panel' | 'inventario' | 'historial' | 'recepcion' | 'despacho' | 'stock'>('panel');\n  const [panelView, setPanelView] = useState<'hub' | 'ingreso' | 'traslado' | 'retiro' | 'etiquetas'>('hub');"
);
// In case the string was exactly as it was:
c = c.replace(
  "const [activeTab, setActiveTab] = useState<'stock' | 'escaner' | 'catalogo' | 'recepcion'>('stock');",
  "const [activeTab, setActiveTab] = useState<'panel' | 'inventario' | 'historial' | 'recepcion' | 'despacho' | 'stock'>('panel');\n  const [panelView, setPanelView] = useState<'hub' | 'ingreso' | 'traslado' | 'retiro' | 'etiquetas'>('hub');"
);

// Replace the top header and tabs mapping
const headerSearchStr = `      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">`;
const headerEndStr = `      {activeTab === 'stock' && (`

// We'll replace everything between headerSearchStr and headerEndStr
const preHeader = c.substring(0, c.indexOf(headerSearchStr));
const postHeader = c.substring(c.indexOf(headerEndStr));

const newHeader = `
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm mb-10 w-full md:w-auto items-center justify-between">
          <div className="flex items-center gap-3 px-4 py-2">
             <div className="bg-slate-900 text-white p-2 rounded-xl"><Package className="w-5 h-5"/></div>
             <h1 className="text-xl font-black tracking-tighter">StockControl</h1>
          </div>
          <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {[
              { id: 'panel', label: 'Panel', icon: LayoutDashboard },
              { id: 'inventario', label: 'Inventario', icon: Box },
              { id: 'historial', label: 'Historial', icon: History }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setPanelView('hub'); }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                  activeTab === tab.id 
                    ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <tab.icon className="w-4 h-4"/> {tab.label}
              </button>
            ))}
          </div>
      </div>

      {activeTab === 'panel' && panelView === 'hub' && (
         <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto py-10">
            
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

         </motion.div>
      )}

      {/* RENDERIZADO CONDICIONAL DE HERRAMIENTAS SEGUN PANEL VIEW */}
      {activeTab === 'panel' && panelView === 'ingreso' && (
         <div className="mt-8 relative"><button onClick={()=>setPanelView('hub')} className="absolute -top-12 z-50 text-sm font-black text-slate-500 hover:text-indigo-600">← VOLVER AL PANEL</button><RecepcionAuditoria onRecargaRequerida={fetchData} onCartChange={setManualCart} /></div>
      )}
      {activeTab === 'panel' && panelView === 'traslado' && (
         <div className="mt-8 relative"><button onClick={()=>setPanelView('hub')} className="absolute -top-12 z-50 text-sm font-black text-slate-500 hover:text-indigo-600">← VOLVER AL PANEL</button><DespachoEgresos initialOperationType="traslado" initialMode="lote" /></div>
      )}
      {activeTab === 'panel' && panelView === 'retiro' && (
         <div className="mt-8 relative"><button onClick={()=>setPanelView('hub')} className="absolute -top-12 z-50 text-sm font-black text-slate-500 hover:text-indigo-600">← VOLVER AL PANEL</button><DespachoEgresos initialOperationType="venta_consumo" initialMode="lote" /></div>
      )}

      {/* TAB INVENTARIO (Viejo activeTab=='stock') */}
`;


const fixedContent = c.replace(c.substring(c.indexOf(headerSearchStr), c.indexOf(headerEndStr)), newHeader);

let finalC = fixedContent;

// Mapear activeTab === 'inventario' al render original de stock
finalC = finalC.replace("{activeTab === 'stock' && (", "{(activeTab === 'stock' || activeTab === 'inventario') && (");

// Y al historial, lo podemos renderizar en la pestaña activeTab === 'historial'
const markerHistorial = "{/* PANEL INGRESOS RECIENTES */}";
const renderHistorial = `
      {activeTab === 'historial' && (
         <div className="mt-8">
            <DespachoEgresos initialMode="historial" />
         </div>
      )}
`;
// Remove any older leftover block `{activeTab === 'despacho' && (` if we added it before.
finalC = finalC.replace(/\{activeTab === 'despacho' && \([\s\S]*?<\/div>[\s\S]*?\)\}/, renderHistorial);
if (!finalC.includes('activeTab === \'historial\'')) {
   finalC = finalC.replace(markerHistorial, renderHistorial + "\n          " + markerHistorial);
}

fs.writeFileSync('src/pages/InventarioGerencial.tsx', finalC);
console.log("Refactored UI globally!");
