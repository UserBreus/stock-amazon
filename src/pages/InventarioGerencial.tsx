import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Scan, AlertCircle, ArchiveRestore, Printer, Search, CreditCard, Activity, 
  Box, ArrowUpRight, ChevronDown, ChevronRight, Layers, Receipt, Network, X, 
  Package, ShoppingCart, ListChecks, Tags, Camera, ArrowDownToLine, 
  ArrowRightLeft, ArrowUpFromLine, LayoutDashboard, History, ScanBarcode, ArrowLeft 
} from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { BarcodeScanner } from '../components/ui/BarcodeScanner';
import { useAuth } from '../context/AuthContext';
import { DespachoEgresos } from '../components/DespachoEgresos';
import { RecepcionAuditoria } from '../components/RecepcionAuditoria';

export function InventarioGerencial() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Tabs Visuales Originales
  const [activeTab, setActiveTab] = useState<'panel' | 'inventario' | 'historial' | 'catalogo' | 'compras'>('panel');
  const [panelView, setPanelView] = useState<'hub' | 'ingreso' | 'traslado' | 'retiro' | 'etiquetas'>('hub');

  // Stock and Filters
  const [stockConsolidado, setStockConsolidado] = useState<any[]>([]);
  const [capitalActivo, setCapitalActivo] = useState<any[]>([]);
  const [depositos, setDepositos] = useState<any[]>([]);
  const [tiposProducto, setTiposProducto] = useState<any[]>([]);
  const [comprasPendientes, setComprasPendientes] = useState<any[]>([]);

  const [warehouseFilterId, setWarehouseFilterId] = useState<string | null>(null);
  const filterRef = useRef<string | null>(null);

  const [filterMode, setFilterMode] = useState<'all' | 'activos' | 'inactivos'>('activos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});

    // Generador de Etiquetas / Cajas
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState({ variante_id: '', cantidad_por_etiqueta: 1, numero_etiquetas: 1, deposito_id: '' });

  // Hub States
  const [manualCart, setManualCart] = useState<any[]>([]);

  // Modals
  const [isLabelDrillDownOpen, setIsLabelDrillDownOpen] = useState(false);
  const [labelCatalog, setLabelCatalog] = useState<any[]>([]);
  const [variationChartProduct, setVariationChartProduct] = useState<any | null>(null);

  const [isLabelCompraModalOpen, setIsLabelCompraModalOpen] = useState(false);
  const [selectedCompraId, setSelectedCompraId] = useState<string | null>(null);

  // Egreso auto
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [egresoProduct, setEgresoProduct] = useState<any | null>(null);
  const [egresoAutoMonto, setEgresoAutoMonto] = useState(0);
  const [egresoEtiquetas, setEgresoEtiquetas] = useState<any[]>([]);
  const [egresoAmounts, setEgresoAmounts] = useState<{ [key: string]: number }>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchData = async () => {
    try {
      const advancedQuery = `
           SELECT 
               pm.id as maestro_id,
               pm.nombre as producto_nombre,
               cat.nombre as categoria_nombre,
               pm.unidad_base,
               v.id as variante_id,
               v.nombre_variante,
               v.codigo_variante as sku,
               ISNULL(v.costo, 0) as costo,
               v.moneda,
               COUNT(e.id) as variaciones_etiquetas,
               SUM(e.cantidad_actual) as cantidad_total,
               MAX(ProvData.proveedor_nombre) as proveedor_nombre
           FROM Stock_Productos_Maestros pm
           LEFT JOIN Stock_Categorias cat ON pm.categoria_id = cat.id
           INNER JOIN Stock_Variantes v ON pm.id = v.producto_maestro_id
           LEFT JOIN Stock_Etiquetas e ON v.id = e.variante_id AND e.estado = 'activo' ${filterRef.current ? `AND e.deposito_id = ${filterRef.current}` : ''}
           OUTER APPLY (
               SELECT TOP 1 prov_inner.nombre as proveedor_nombre
               FROM Stock_Movimientos m_inner
               LEFT JOIN Stock_Compras c_inner ON m_inner.referencia_compra_id = c_inner.id
               LEFT JOIN Stock_Proveedores prov_inner ON c_inner.proveedor_id = prov_inner.id
               WHERE m_inner.etiqueta_id = e.id AND m_inner.tipo_movimiento LIKE '%ingreso%'
           ) ProvData
           GROUP BY 
               pm.id, pm.nombre, cat.nombre, pm.unidad_base,
               v.id, v.nombre_variante, v.codigo_variante, v.costo, v.moneda
           ORDER BY pm.nombre ASC
      `;
      const [stockRes, capRes, depRes, catRes, compRes] = await Promise.all([
        executeAWSQuery(advancedQuery),
        executeAWSQuery("SELECT * FROM Vista_Capital_Activo"),
        executeAWSQuery("SELECT * FROM Stock_Depositos"),
        executeAWSQuery("SELECT * FROM Stock_Categorias ORDER BY nombre"),
        executeAWSQuery("SELECT c.*, p.nombre as proveedor_nombre FROM Stock_Compras c LEFT JOIN Stock_Proveedores p ON c.proveedor_id = p.id WHERE c.estado = 'pendiente' ORDER BY c.fecha_creacion DESC")
      ]);
      
      setStockConsolidado(stockRes || []);
      setCapitalActivo(capRes || []);
      setDepositos(depRes || []);
      setTiposProducto(catRes || []);
      setComprasPendientes(compRes || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const openLabelDrillDown = async (prod: any) => {
    setVariationChartProduct(prod);
    try {
      const q = `SELECT id, codigo_barras, cantidad_actual, deposito_id, fecha_creacion FROM Stock_Etiquetas WHERE variante_id = '${prod.variante_id}' AND estado = 'activo' AND cantidad_actual > 0 ${filterRef.current ? `AND deposito_id = ${filterRef.current}` : ''} ORDER BY fecha_creacion ASC`;
      const res = await executeAWSQuery(q);
      setLabelCatalog(res || []);
      setIsLabelDrillDownOpen(true);
    } catch(e) {
      console.error(e);
    }
  };

    const handleGenerateLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newLabel.variante_id || !newLabel.deposito_id) return alert("Complete todos los campos.");
    try {
      const vResult = await executeAWSQuery(`SELECT * FROM Stock_Variantes WHERE id = ${newLabel.variante_id}`);
      const vObj = vResult?.[0];
      if(!vObj) return alert("Variante no existe");

      const prefix = vObj.codigo_variante || 'SKU';
      const values = Array.from({ length: newLabel.numero_etiquetas }).map((_, i) => 
        `('${prefix}-${Date.now().toString().slice(-4)}-${i+1}', ${vObj.id}, ${newLabel.deposito_id}, ${newLabel.cantidad_por_etiqueta}, 'activo')`
      ).join(',');

      const inserted = await executeAWSQuery(`INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_actual, estado) OUTPUT INSERTED.id VALUES ${values}`);
      
      if (inserted && inserted.length > 0) {
        const movValues = inserted.map((row:any) => 
          `(${row.id}, 'ingreso', ${newLabel.cantidad_por_etiqueta}, '${user?.id || 1}')`
        ).join(',');
        await executeAWSQuery(`INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad, usuario_id) VALUES ${movValues}`);
      }
      setIsLabelModalOpen(false);
      fetchData();
      alert(`${newLabel.numero_etiquetas} etiqueta(s) generadas con éxito.`);
    } catch(err) {
      console.error(err);
      alert("Error al generar las etiquetas. Revise la consola.");
    }
  };

  const openEgresoAuto = async (prod: any) => {
    setEgresoProduct(prod);
    setEgresoAutoMonto(1);
    try {
      const etqs = await executeAWSQuery(`SELECT * FROM Stock_Etiquetas WHERE variante_id = '${prod.variante_id}' AND estado = 'activo' AND cantidad_actual > 0 ORDER BY fecha_creacion ASC`);
      setEgresoEtiquetas(etqs || []);
      
      const amounts: {[key:string]:number} = {};
      (etqs || []).forEach((e:any) => amounts[e.id] = 0);
      setEgresoAmounts(amounts);
      setIsEgresoModalOpen(true);
    } catch(e) {
      console.error(e);
    }
  };

  const applyAutoFIFO = () => {
    const amounts: {[key:string]:number} = {};
    let rem = egresoAutoMonto;
    egresoEtiquetas.forEach(e => {
       if (rem > 0) {
          if (e.cantidad_actual >= rem) { amounts[e.id] = rem; rem = 0; }
          else { amounts[e.id] = e.cantidad_actual; rem -= e.cantidad_actual; }
       } else {
          amounts[e.id] = 0;
       }
    });
    setEgresoAmounts(amounts);
    if (rem > 0) alert("No hay suficiente stock físico para completar la cantidad automática.");
  };

  const confirmarEgreso = async () => {
    const ids = Object.keys(egresoAmounts).filter(k => egresoAmounts[k] > 0);
    if(ids.length === 0) return;
    try {
      for (const id of ids) {
         const am = egresoAmounts[id];
         const eq = egresoEtiquetas.find(e => e.id.toString() === id);
         const n = eq.cantidad_actual - am;
         await executeAWSQuery(`UPDATE Stock_Etiquetas SET cantidad_actual = ${n}, estado = '${n===0?'agotado':'activo'}' WHERE id = ${id}`);
         await executeAWSQuery(`INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad, usuario_id) VALUES (${id}, 'egreso_auto', ${am}, '${user?.id || 1}')`);
      }
      setIsEgresoModalOpen(false);
      fetchData();
      alert("Egreso exitoso mediante AutoFIFO distribuido.");
    } catch(e){
      console.error(e);
    }
  };

  const formatCurrency = (val: number, currency: 'USD' | 'UYU' = 'USD') => {
    if(!val) val = 0;
    if (currency === 'UYU') return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(val).replace('UYU', '$');
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  let filteredStock = stockConsolidado;
  if (filterMode === 'activos') filteredStock = filteredStock.filter(p => p.cantidad_total > 0);
  if (filterMode === 'inactivos') filteredStock = filteredStock.filter(p => !p.cantidad_total || p.cantidad_total === 0);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredStock = filteredStock.filter(p => p.producto_nombre.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)) || p.nombre_variante?.toLowerCase().includes(q));
  }

  const groupedStock = Object.values(filteredStock.reduce((acc, curr) => {
      if(!acc[curr.maestro_id]) {
          acc[curr.maestro_id] = {
              maestro_id: curr.maestro_id,
              producto_nombre: curr.producto_nombre,
              categoria_nombre: curr.categoria_nombre,
              variaciones_etiquetas: 0,
              capital_total: 0,
              variantes: []
          };
      }
      acc[curr.maestro_id].variaciones_etiquetas += curr.variaciones_etiquetas;
      acc[curr.maestro_id].capital_total += (curr.cantidad_total * curr.costo);
      acc[curr.maestro_id].variantes.push(curr);
      return acc;
  }, {} as any));

  const qtyActivos = groupedStock.filter((p:any) => p.variantes.some((v:any) => v.cantidad_total > 0)).length;
  const qtyInactivos = stockConsolidado.filter(p => !p.cantidad_total || p.cantidad_total === 0).length;

  const totalUSD = capitalActivo.find(c => c.moneda === 'USD')?.capital_total || 0;
  const totalUYU = capitalActivo.find(c => c.moneda === 'UYU')?.capital_total || 0;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-32 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* HEADER VISUAL CON BOTONERA INCLUIDA (Restaurado a la versión "Tarjetas") */}
            {(activeTab !== 'panel' || panelView === 'hub') && (
      <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 shadow-sm mb-8 w-full items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3 px-4 py-2">
             <div className="bg-slate-900 text-white p-2 rounded-xl"><Package className="w-5 h-5"/></div>
             <h1 className="text-xl font-black tracking-tighter">StockControl</h1>
          </div>
          <div className="flex flex-wrap bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {[
              { id: 'panel', label: 'Panel', icon: LayoutDashboard },
              { id: 'inventario', label: 'Inventario', icon: Box },
              { id: 'historial', label: 'Historial', icon: History },
              
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
      )}

      {/* PANEL HUB CON TARJETAS GIGANTES */}
      {activeTab === 'panel' && panelView === 'hub' && (
         <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 py-4">
            
            <button onClick={() => setPanelView('ingreso')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <ArrowDownToLine className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ingresar Stock</h3>
                   <p className="text-slate-500 font-medium text-sm">Registrar nueva mercadería al sistema WMS mediante escaneo o compra.</p>
                </div>
            </button>
            
            <button onClick={() => setPanelView('traslado')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-purple-200 dark:border-slate-800 dark:hover:border-purple-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-purple-500/5">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <ArrowRightLeft className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Trasladar</h3>
                   <p className="text-slate-500 font-medium text-sm">Mover artículos entre diferentes sectores y almacenes físicos.</p>
                </div>
            </button>

            <button onClick={() => setPanelView('retiro')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-orange-200 dark:border-slate-800 dark:hover:border-orange-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-orange-500/5">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <ArrowUpFromLine className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Retirar Stock</h3>
                   <p className="text-slate-500 font-medium text-sm">Registrar ventas, consumos libres, mermas o salidas definitivas del patrimonio.</p>
                </div>
            </button>

            <button onClick={() => setIsLabelModalOpen(true)} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-indigo-500/5">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl group-hover:scale-110 transition-transform">
                   <ScanBarcode className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Generar Etiqueta</h3>
                   <p className="text-slate-500 font-medium text-sm">Generador súper rápido de códigos de barras con lotes físicos (cajas, bidones, paletas).</p>
                </div>
            </button>

         </motion.div>
      )}

      
      {/* HEADER DINÁMICO DE RETORNO A OPERACIONES PARA SUB-MÓDULOS */}
      {activeTab === 'panel' && panelView !== 'hub' && (
         <div className="mb-6 flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-4">
                 <button onClick={()=>setPanelView('hub')} className="p-2.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-all shadow-sm">
                     <ArrowLeft className="w-5 h-5" />
                 </button>
                 <div>
                    <h2 className="font-black text-xl text-slate-800 dark:text-white leading-tight">
                        {panelView === 'ingreso' && "Ingreso de Mercadería"}
                        {panelView === 'traslado' && "Traslado Interno"}
                        {panelView === 'retiro' && "Retiro o Consumo Libre"}
                    </h2>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mt-0.5">Operación en proceso</p>
                 </div>
             </div>
         </div>
      )}

      {activeTab === 'panel' && panelView === 'ingreso' && (
         <div className="mt-4"><RecepcionAuditoria onRecargaRequerida={fetchData} onCartChange={setManualCart} /></div>
      )}

      {activeTab === 'panel' && panelView === 'traslado' && (
         <div className="mt-4"><DespachoEgresos initialOperationType="traslado" initialMode="lote" /></div>
      )}
      {activeTab === 'panel' && panelView === 'retiro' && (
         <div className="mt-4"><DespachoEgresos initialOperationType="venta_consumo" initialMode="lote" /></div>
      )}

      {/* HISTORIAL TAB */}
      {activeTab === 'historial' && (
         <div className="mt-8 w-full"><DespachoEgresos initialMode="historial" initialOperationType="traslado" /></div>
      )}

      {/* PESTAÑA INVENTARIO (TABLA QUE EL USUARIO PIDIÓ CON FILTRO GEOGRÁFICO) */}
      {activeTab === 'inventario' && (
      <AnimatePresence>
      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-nexus p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital Inmovilizado</p>
          </div>
          <div className="space-y-1">
             <h3 className="text-xl font-black text-blue-950 dark:text-white tracking-tighter truncate">{formatCurrency(totalUSD, 'USD')}</h3>
             {totalUYU > 0 && <h3 className="text-md font-bold text-slate-500 dark:text-slate-400 truncate tracking-tight">{formatCurrency(totalUYU, 'UYU')}</h3>}
          </div>
        </div>
        <div className="card-nexus p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600">
              <ArchiveRestore className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Familias en Stock Real</p>
          </div>
          <h3 className="text-2xl font-black text-blue-950 dark:text-white tracking-tighter">{qtyActivos} Familias</h3>
        </div>
        <div className="card-nexus p-6">
           <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agotados Críticos</p>
          </div>
          <h3 className="text-2xl font-black text-blue-950 dark:text-white tracking-tighter">{qtyInactivos} Atributos</h3>
        </div>
      </div>

      {/* FILTROS GEOGRÁFICOS AQUÍ */}
      <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">Filtrar por Locación (Almacenes)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <button 
            onClick={() => { filterRef.current = null; setWarehouseFilterId(null); fetchData(); }}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-2 ${warehouseFilterId === null ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg dark:bg-indigo-900/40 dark:border-indigo-500 dark:text-indigo-300" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"}`}
          >
             <Network className="w-8 h-8 opacity-90" />
             <span className="font-black tracking-widest uppercase text-xs">Uso Global</span>
          </button>
          {depositos.map(dep => (
            <button 
              key={dep.id}
              onClick={() => { filterRef.current = dep.id.toString(); setWarehouseFilterId(dep.id.toString()); fetchData(); }}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-2 ${warehouseFilterId === dep.id.toString() ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg dark:bg-indigo-900/40 dark:border-indigo-500 dark:text-indigo-300" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"}`}
            >
               <Box className="w-8 h-8 opacity-90" />
               <span className="font-black uppercase tracking-widest text-xs text-center">{dep.nombre}</span>
            </button>
          ))}
      </div>

      <div className="card-nexus overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-2">
           <div className="relative max-w-md flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
             <input type="text" placeholder="Buscar por Nombre o SKU..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-nexus pl-10 w-full" />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-900">
                <th className="px-8 py-5">Familia Maestro</th>
                <th className="px-8 py-5 text-right">Cantidad Física</th>
                <th className="px-8 py-5 text-center">Gestiones Lotes</th>
                <th className="px-8 py-5 text-right">Patrimonio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
              {groupedStock.map((maestro: any, index: number) => {
                const isExpanded = !!expandedRows[maestro.maestro_id];
                return (
                <React.Fragment key={maestro.maestro_id+"_"+index}>
                <tr onClick={() => toggleRow(maestro.maestro_id)} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <button className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">{isExpanded ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}</button>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-950 dark:text-white uppercase">{maestro.producto_nombre}</p>
                        <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">
                           <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">{maestro.categoria_nombre}</span>
                           <span className="text-indigo-500 font-medium ml-2">{maestro.variantes.length} Variantes Inferiores</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-xl text-blue-950 dark:text-white tracking-tighter">
                      {maestro.variantes.reduce((sum: number, v: any) => sum + (v.cantidad_total || 0), 0)} <span className="text-xs font-medium text-slate-400 uppercase">{maestro.unidad_base}</span>
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                      <Layers className="w-3 h-3" /> {maestro.variaciones_etiquetas} Lotes Internos
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      {formatCurrency(maestro.capital_total)}
                    </span>
                  </td>
                </tr>
                {isExpanded && maestro.variantes.map((v: any, vIdx: number) => (
                  <tr key={v.variante_id + "_" + vIdx} className="bg-slate-50/50 dark:bg-slate-900/50">
                    <td className="px-8 py-4 pl-24">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> {v.nombre_variante || 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-widest mt-1 uppercase">{v.sku}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                       <span className={cn("font-bold", v.cantidad_total > 0 ? "text-emerald-600" : "text-rose-500")}>
                          {v.cantidad_total || 0}
                       </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                       <div className="flex justify-center gap-2">
                         {v.cantidad_total > 0 && (
                          <button onClick={() => openLabelDrillDown(v)} className="btn-secondary text-[10px] py-1.5 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50">Explorar Cajas</button>
                         )}
                         <button onClick={() => openEgresoAuto(v)} className="btn-secondary text-[10px] py-1.5 px-3">Extraer AutoFIFO</button>
                       </div>
                    </td>
                     <td className="px-8 py-4 text-right">
                       <span className="text-xs font-medium text-slate-500">{formatCurrency(v.costo, v.moneda)} <span className="text-[9px] uppercase tracking-widest opacity-60 ml-1">UNID</span></span>
                    </td>
                  </tr>
                ))}
                </React.Fragment>
              )})}
            </tbody>
          </table>
        </div>
      </div>
      </motion.div>
      </AnimatePresence>
      )}

      


      {/* MODALES CLAVE */}
      
      {/* MODAL ETIQUETAS */}
      <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Generador de Rótulos / Cajas Físicas">
         <form onSubmit={handleGenerateLabels} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variante a Imprimir (Seleccione de Base Existente)</label>
               <select required value={newLabel.variante_id} onChange={e => setNewLabel({...newLabel, variante_id: e.target.value})} className="input-nexus w-full bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200">
                  <option value="" disabled>Seleccione una variante mapeada...</option>
                  {stockConsolidado.flatMap(c => c.variantes || []).filter(Boolean).map(v => <option key={v.variante_id} value={v.variante_id}>{v.nombre_variante} ({v.sku})</option>)}
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volumen por Unidad/Caja</label>
                 <input type="number" min="0.01" step="0.01" required value={newLabel.cantidad_por_etiqueta} onChange={e => setNewLabel({...newLabel, cantidad_por_etiqueta: Number(e.target.value)})} className="input-nexus w-full bg-transparent" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número de Códigos a Generar</label>
                 <input type="number" min="1" required value={newLabel.numero_etiquetas} onChange={e => setNewLabel({...newLabel, numero_etiquetas: Number(e.target.value)})} className="input-nexus w-full font-black text-indigo-600 bg-transparent" />
              </div>
            </div>
            <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asignar a Almacén Local</label>
                 <select required value={newLabel.deposito_id} onChange={e => setNewLabel({...newLabel, deposito_id: e.target.value})} className="input-nexus w-full bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200">
                    <option value="" disabled>Seleccione almacén de destino...</option>
                    {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                 </select>
            </div>
            <button type="submit" className="w-full btn-primary py-4 uppercase tracking-widest font-black shadow-lg shadow-indigo-500/20">Imprimir Lotes y Agregar a Base de Datos</button>
         </form>
      </Modal>

      {/* MODAL DE EXPLORACION DE CAJAS (Lotes) */}
      <Modal isOpen={isLabelDrillDownOpen} onClose={() => setIsLabelDrillDownOpen(false)} title={`Cajas en Bodega: ${variationChartProduct?.nombre_variante}`}>
         <div className="space-y-4">
             {labelCatalog.length === 0 ? (
               <p className="text-slate-500 text-sm text-center py-6">No hay cajas activas para este atributo bajo este filtro geográfico.</p>
             ) : (
               labelCatalog.map((etq, i) => (
                  <div key={etq.id} className="flex flex-col bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                     <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-xs text-slate-500 font-black">{etq.codigo_barras}</span>
                        <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs">{etq.cantidad_actual} físicas</span>
                     </div>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-2">
                        <ArrowUpRight className="w-3 h-3"/> Referencia Lote interno de Sistema: [{etq.id}]
                     </span>
                  </div>
               ))
             )}
         </div>
      </Modal>

      {/* MODAL DE EXTRACCION AUTOFIFO */}
      <Modal isOpen={isEgresoModalOpen} onClose={() => setIsEgresoModalOpen(false)} title={`Extracción FIFO Automática: ${egresoProduct?.nombre_variante}`}>
         <div className="space-y-6">
             <div className="flex items-end gap-4 p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30">
                 <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Ingrese la cantidad necesaria</label>
                    <input type="number" min="1" value={egresoAutoMonto} onChange={e => setEgresoAutoMonto(Number(e.target.value))} className="w-full text-center text-3xl font-black bg-transparent border-b-2 border-emerald-300 dark:border-emerald-700 outline-none text-emerald-900" />
                 </div>
                 <button onClick={applyAutoFIFO} className="px-6 py-4 rounded-xl font-bold uppercase tracking-widest bg-emerald-600 shadow-lg text-white hover:bg-emerald-700">Trazar Algoritmo FIFO</button>
             </div>

             <div className="space-y-3">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trazabilidad Predictiva</p>
                 {Object.keys(egresoAmounts).filter(k => egresoAmounts[k] > 0).map(id => {
                     const etq = egresoEtiquetas.find(e => e.id.toString() === id);
                     return (
                         <div key={id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                             <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">{etq?.codigo_barras}</span>
                                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-2 rounded-full font-medium">Lote Físico: {etq?.cantidad_actual}</span>
                             </div>
                             <span className="font-black text-sm text-rose-500">
                                - {egresoAmounts[id]} uds
                             </span>
                         </div>
                     );
                 })}
             </div>

             <button onClick={confirmarEgreso} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 uppercase tracking-widest rounded-xl shadow-lg transition-all" disabled={Object.keys(egresoAmounts).filter(k => egresoAmounts[k] > 0).length === 0}>
                Descontar Mercadería Definitivamente
             </button>
         </div>
      </Modal>

    </div>
  );
}
