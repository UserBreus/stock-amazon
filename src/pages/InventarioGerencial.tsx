import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Scan, ScanBarcode, PackagePlus, AlertCircle, History, Package, CreditCard, Box, ArchiveRestore } from 'lucide-react';
import { supabase, handleSupabaseError } from '../supabase';
import { Deposito, Producto, Etiqueta } from '../types';
import { cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { BarcodeScanner } from '../components/ui/BarcodeScanner';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';

export function InventarioGerencial() {
  const { user } = useAuth();
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stock' | 'escaner' | 'catalogo'>('stock');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  // Forms state
  const [newProduct, setNewProduct] = useState({ sku: '', nombre: '', categoria: 'General', unidad: 'ud', es_agrupable: false, costo: 0 });
  const [newLabel, setNewLabel] = useState({ producto_id: '', cantidad_por_etiqueta: 1, numero_etiquetas: 1, deposito_id: '' });
  const [scanInput, setScanInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Escaner State
  const [scannedEtiqueta, setScannedEtiqueta] = useState<Etiqueta | null>(null);
  const [extractAmount, setExtractAmount] = useState(1);

  useEffect(() => {
    fetchData();
    const sub1 = supabase.channel('wms_productos').on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, fetchData).subscribe();
    const sub2 = supabase.channel('wms_etiquetas').on('postgres_changes', { event: '*', schema: 'public', table: 'etiquetas' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub1); supabase.removeChannel(sub2); };
  }, []);

  const fetchData = async () => {
    try {
      const [depRes, prodRes, etiqRes] = await Promise.all([
        supabase.from('depositos').select('*').eq('tipo', 'general'),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('etiquetas').select('*, productos(*), depositos(*)').eq('estado', 'activo')
      ]);
      if (depRes.data) setDepositos(depRes.data as Deposito[]);
      if (prodRes.data) setProductos(prodRes.data as Producto[]);
      if (etiqRes.data) {
        // Filter out etiquetas that don't belong to general deposits
        const actEtiquetas = (etiqRes.data as any[]).filter(e => e.depositos?.tipo === 'general');
        setEtiquetas(actEtiquetas);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('productos').insert([newProduct]);
      if (error) throw error;
      setIsProductModalOpen(false);
      setNewProduct({ sku: '', nombre: '', categoria: 'General', unidad: 'ud', es_agrupable: false, costo: 0 });
    } catch (error) {
      handleSupabaseError(error, 'Agregar Producto');
    }
  };

  const handleGenerateLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prod = productos.find(p => p.id === newLabel.producto_id);
      if(!prod) return;

      const prefix = prod.sku;
      const etiquetasToInsert = Array.from({ length: newLabel.numero_etiquetas }).map((_, i) => ({
        codigo_barras: `${prefix}-${Date.now().toString().slice(-6)}-${i+1}`,
        producto_id: prod.id,
        deposito_id: newLabel.deposito_id,
        cantidad_actual: newLabel.cantidad_por_etiqueta,
        estado: 'activo'
      }));

      const { data, error } = await supabase.from('etiquetas').insert(etiquetasToInsert).select();
      if (error) throw error;
      
      // Log movimientos
      if (data) {
        const movs = data.map(d => ({
          etiqueta_id: d.id,
          tipo: 'ingreso',
          cantidad: d.cantidad_actual,
          deposito_destino_id: d.deposito_id,
          usuario_id: user?.id
        }));
        await supabase.from('movimientos').insert(movs);
      }

      setIsLabelModalOpen(false);
      alert(`${newLabel.numero_etiquetas} etiqueta(s) generadas con éxito para ${prod.nombre}`);
    } catch (error) {
      handleSupabaseError(error, 'Generar Etiquetas');
    }
  };

  const processScan = (codigo: string) => {
    const found = etiquetas.find(et => et.codigo_barras.toUpperCase() === codigo.toUpperCase());
    if (found) {
      setScannedEtiqueta(found);
      setExtractAmount(1); // Default
    } else {
      alert("Etiqueta no encontrada en Almacén General o ya está agotada.");
      setScannedEtiqueta(null);
    }
    setScanInput('');
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    processScan(scanInput);
  };


  const handleExtract = async () => {
    if (!scannedEtiqueta) return;
    if (extractAmount <= 0 || extractAmount > scannedEtiqueta.cantidad_actual) {
      alert("Cantidad inválida a extraer.");
      return;
    }

    try {
      const newAmount = scannedEtiqueta.cantidad_actual - extractAmount;
      const newState = newAmount <= 0 ? 'agotado' : 'activo';

      const { error } = await supabase.from('etiquetas').update({
        cantidad_actual: newAmount,
        estado: newState
      }).eq('id', scannedEtiqueta.id);

      if (error) throw error;

      await supabase.from('movimientos').insert([{
        etiqueta_id: scannedEtiqueta.id,
        tipo: 'egreso',
        cantidad: extractAmount,
        deposito_origen_id: scannedEtiqueta.deposito_id,
        usuario_id: user?.id
      }]);

      setScannedEtiqueta(null);
      alert(`Extracción de ${extractAmount} exitosa.`);
    } catch (error) {
      handleSupabaseError(error, 'Extraer Stock');
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  // Computed data for Stock Consolidado
  const stockConsolidado = productos.map(prod => {
    const etqs = etiquetas.filter(e => e.producto_id === prod.id);
    const totalCant = etqs.reduce((acc, e) => acc + Number(e.cantidad_actual), 0);
    return { ...prod, total_cantidad: totalCant, total_valor: totalCant * prod.costo };
  });

  const totalCapital = stockConsolidado.reduce((acc, p) => acc + p.total_valor, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-blue-950 dark:text-white tracking-tighter">Inventario General</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Gestión WMS: Recepción y trazabilidad por etiquetas.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsProductModalOpen(true)} className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
            <PackagePlus className="w-4 h-4" /> Nuevo Catálogo
          </button>
          <button 
            onClick={() => setIsLabelModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <ScanBarcode className="w-4 h-4" /> Ingreso / Generar Etiqueta
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'stock', label: 'Stock Consolidado' },
          { id: 'escaner', label: 'Terminal de Escáner' },
          { id: 'catalogo', label: 'Catálogo Maestro' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'stock' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-nexus p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital Inmovilizado</p>
              </div>
              <h3 className="text-2xl font-black text-blue-950 dark:text-white tracking-tighter truncate">{formatCurrency(totalCapital)}</h3>
            </div>
            <div className="card-nexus p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600">
                  <ArchiveRestore className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Etiquetas Activas</p>
              </div>
              <h3 className="text-2xl font-black text-blue-950 dark:text-white tracking-tighter">{etiquetas.length} Lotes/Unidades</h3>
            </div>
          </div>

          <div className="card-nexus overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-900">
                    <th className="px-8 py-5">Producto / SKU</th>
                    <th className="px-8 py-5 text-right">Cantidad Física</th>
                    <th className="px-8 py-5 text-right">Lotes (Etiquetas)</th>
                    <th className="px-8 py-5 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                  {stockConsolidado.map((prod) => {
                    const countEtiquetas = etiquetas.filter(e => e.producto_id === prod.id).length;
                    return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-900 dark:text-blue-400 border border-slate-100 dark:border-slate-700">
                            <Box className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-blue-950 dark:text-white tracking-tight">{prod.nombre}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{prod.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-sm text-slate-700 dark:text-slate-300">
                        {prod.total_cantidad} <span className="text-[10px] uppercase text-slate-400 ml-1">{prod.unidad}</span>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-sm text-slate-500">{countEtiquetas} activas</td>
                      <td className="px-8 py-6 text-right font-black text-sm text-blue-600 dark:text-blue-400">{formatCurrency(prod.total_valor)}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'escaner' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto space-y-8">
          <div className="card-nexus p-8 bg-blue-950 text-white border-blue-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10 text-center space-y-6">
              <ScanBarcode className="w-20 h-20 text-blue-400 mx-auto opacity-80" />
              <div>
                <h3 className="text-2xl font-black tracking-tight">Escáner de Salida</h3>
                <p className="text-blue-300/60 font-medium text-sm mt-2">Escanea el código de barras de cualquier etiqueta para extraer inventario general.</p>
              </div>
              <form onSubmit={handleScan} className="flex flex-col gap-4 max-w-sm mx-auto">
                <input 
                  autoFocus
                  className="w-full px-6 py-4 bg-white/10 border-2 border-blue-500/30 rounded-2xl text-center font-mono text-xl text-white outline-none focus:border-blue-400 focus:bg-white/20 transition-all placeholder:text-white/30"
                  placeholder="CAJA-0001"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                />
                <button type="submit" className="hidden">Escanear</button>
                <button 
                  type="button" 
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors uppercase text-xs tracking-widest"
                >
                  <Scan className="w-4 h-4" /> Abrir Cámara del Teléfono
                </button>
              </form>
            </div>
          </div>
          
          {isCameraOpen && (
            <BarcodeScanner 
              onScan={(code) => {
                setIsCameraOpen(false);
                processScan(code);
              }}
              onClose={() => setIsCameraOpen(false)}
            />
          )}

          <AnimatePresence>
            {scannedEtiqueta && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="card-nexus p-8 border-emerald-500/30 shadow-emerald-900/5">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg">Etiqueta Encontrada</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-4">{scannedEtiqueta.codigo_barras}</h4>
                    <p className="text-slate-500 mt-1 font-medium">{scannedEtiqueta.productos?.nombre} ({scannedEtiqueta.productos?.sku})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock en Etiqueta</p>
                    <p className="text-4xl font-black text-blue-600 mt-1">{scannedEtiqueta.cantidad_actual}</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Confirmar Extracción de esta etiqueta</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      min="1" 
                      max={scannedEtiqueta.cantidad_actual} 
                      className="input-nexus text-xl font-bold w-32"
                      value={extractAmount}
                      onChange={e => setExtractAmount(Number(e.target.value))}
                    />
                    <button onClick={handleExtract} className="btn-primary flex-1 py-4 text-sm">Ejecutar Salida Física</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {activeTab === 'catalogo' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card-nexus p-6">
            <h3 className="font-black text-xl text-blue-950 dark:text-white tracking-tight mb-6">Maestro de Productos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productos.map(p => (
                <div key={p.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{p.nombre}</h4>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-bold">{p.sku} • {p.unidad}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-slate-600 dark:text-slate-300">{formatCurrency(p.costo)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Nuevo Producto Maestro">
        <form className="space-y-6" onSubmit={handleAddProduct}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">SKU Base</label>
              <input className="input-nexus uppercase" required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value.toUpperCase()})} placeholder="TELA-ALG"/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nombre Descriptivo</label>
              <input className="input-nexus" required value={newProduct.nombre} onChange={e => setNewProduct({...newProduct, nombre: e.target.value})} placeholder="Ej. Rollo Algodón"/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Unidad de Medida</label>
              <input className="input-nexus" required value={newProduct.unidad} onChange={e => setNewProduct({...newProduct, unidad: e.target.value})} placeholder="ud, lts, caja"/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Costo Referencial</label>
              <input className="input-nexus" type="number" required value={newProduct.costo} onChange={e => setNewProduct({...newProduct, costo: Number(e.target.value)})}/>
            </div>
          </div>
          <button type="submit" className="w-full btn-primary py-4">Guardar Producto en Catálogo</button>
        </form>
      </Modal>

      <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Generar e Ingresar Etiquetas">
        <form className="space-y-6" onSubmit={handleGenerateLabels}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Producto a Etiquetar</label>
              <Select 
                options={productos.map(p => ({ value: p.id, label: `${p.nombre} (${p.sku})` }))}
                onChange={(option) => setNewLabel({...newLabel, producto_id: option?.value || ''})}
                placeholder="Busca un insumo..."
                className="my-react-select"
                classNamePrefix="select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '0.75rem',
                    borderColor: '#e2e8f0',
                    padding: '0.25rem',
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#cbd5e1' }
                  })
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Depósito Destino</label>
              <Select 
                options={depositos.map(d => ({ value: d.id, label: d.nombre }))}
                onChange={(option) => setNewLabel({...newLabel, deposito_id: option?.value || ''})}
                placeholder="Escoge el almacén destino..."
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '0.75rem',
                    borderColor: '#e2e8f0',
                    padding: '0.25rem',
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#cbd5e1' }
                  })
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nº Etiquetas a Generar</label>
              <input className="input-nexus text-xl font-bold" type="number" min="1" required value={newLabel.numero_etiquetas} onChange={e => setNewLabel({...newLabel, numero_etiquetas: Number(e.target.value)})}/>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">Cuántos códigos de barras físicos vas a imprimir. Ej: 5 rollos = 5 etiquetas.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cantidad x Etiqueta</label>
              <input className="input-nexus text-xl pr-4 font-bold" type="number" min="1" required value={newLabel.cantidad_por_etiqueta} onChange={e => setNewLabel({...newLabel, cantidad_por_etiqueta: Number(e.target.value)})}/>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">Stock interno de cada etiqueta. Ej: 1 rollo, o 1 caja con 12 botellas.</p>
            </div>
          </div>
          <button type="submit" className="w-full btn-primary py-4 mt-6">Imprimir y Asentar Ingreso</button>
        </form>
      </Modal>
    </div>
  );
}
