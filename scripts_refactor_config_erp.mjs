import fs from 'fs';

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

c = c.replace(
    "import { Settings, Box, Network, Truck, Search, Folder, ArrowLeft } from 'lucide-react';",
    "import { Settings, Box, Network, Truck, Search, Folder, ArrowLeft, Palette, LayoutDashboard, Tag, Layers } from 'lucide-react';\nimport { IconManager } from '../components/IconManager';"
);

c = c.replace(
    "const [activeTab, setActiveTab] = useState<'categorias' | 'titulos_base' | 'diccionario' | 'modelos' | 'proveedores' | 'rendimientos'>('titulos_base');",
    "const [activeTab, setActiveTab] = useState<'hub' | 'categorias' | 'titulos_base' | 'diccionario' | 'modelos' | 'proveedores' | 'rendimientos' | 'iconos'>('hub');"
);

const headerSearchStr = `<div className="text-center w-full flex flex-col items-center justify-center">`;
const headerEndStr = `{activeTab === 'proveedores' && (`;

const newHeader = `
      {activeTab === 'hub' ? (
      <div className="space-y-10">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm mb-10 w-full md:w-auto items-center justify-between">
              <div className="flex items-center gap-3 px-4 py-2">
                 <div className="bg-slate-900 text-white p-2 rounded-xl"><Settings className="w-5 h-5"/></div>
                 <h1 className="text-xl font-black tracking-tighter">Gestión de Sistema</h1>
              </div>
          </div>
          
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                <button onClick={() => setActiveTab('titulos_base')} className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform"><Network className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Artículos Maestros</h3><p className="text-slate-500 font-medium text-xs leading-relaxed">Crea las matrices principales de cada producto de tu catálogo.</p></div>
                </button>
                
                <button onClick={() => setActiveTab('modelos')} className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-purple-300 dark:border-slate-800 dark:hover:border-purple-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform"><Box className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Variantes (SKU)</h3><p className="text-slate-500 font-medium text-xs leading-relaxed">Generador de matrices. Multiplica artículos por Talle/Color/etc.</p></div>
                </button>

                <button onClick={() => setActiveTab('diccionario')} className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform"><Tag className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Rasgos y Atributos</h3><p className="text-slate-500 font-medium text-xs leading-relaxed">Diccionario de combinaciones usadas para armar Variantes.</p></div>
                </button>

                <button onClick={() => setActiveTab('categorias')} className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform"><Layers className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Familias</h3><p className="text-slate-500 font-medium text-xs leading-relaxed">Categorías o agrupadores globales para estadística y orden.</p></div>
                </button>

                <button onClick={() => setActiveTab('proveedores')} className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform"><Truck className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Proveedores</h3><p className="text-slate-500 font-medium text-xs leading-relaxed">Directorio de importadores y fabricantes.</p></div>
                </button>

                <button onClick={() => setActiveTab('rendimientos')} className="bg-white dark:bg-slate-900 border border-slate-200 hover:border-teal-300 dark:border-slate-800 dark:hover:border-teal-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl">
                    <div className="p-4 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-2xl group-hover:scale-110 transition-transform"><Network className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Rendimientos WMS</h3><p className="text-slate-500 font-medium text-xs leading-relaxed">Matemática de equivalencias (Kilos a Metros Lineales).</p></div>
                </button>

                <button onClick={() => setActiveTab('iconos')} className="bg-slate-950 text-white border border-slate-800 hover:border-slate-600 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl xl:col-span-2">
                    <div className="p-4 bg-slate-800 text-slate-300 rounded-2xl group-hover:scale-110 transition-transform"><Palette className="w-8 h-8" /></div>
                    <div><h3 className="text-xl font-black text-white mb-2">Gestor de Interfaz & Iconos</h3><p className="text-slate-400 font-medium text-xs leading-relaxed">Alteración dinámica del motor visual WMS. Elije avatares SVG propios o extrae de la librería nativa de +1000 elementos.</p></div>
                </button>
          </motion.div>
      </div>
      ) : (
          <div className="mb-6">
              <button onClick={()=>setActiveTab('hub')} className="text-sm font-black text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2">← VOLVER AL PANEL DE SISTEMA</button>
          </div>
      )}

      {activeTab === 'iconos' && <IconManager />}

      `;

c = c.replace(c.substring(c.indexOf(headerSearchStr), c.indexOf(headerEndStr)), newHeader);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log("Refactored ConfiguracionMaestros.tsx");
