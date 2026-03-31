import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Box, Send, Clock, Scan, QrCode } from 'lucide-react';
import { supabase, handleSupabaseError } from '../supabase';
import { Deposito, Producto, Etiqueta, Solicitud } from '../types';
import { cn } from '../lib/utils';
import { BarcodeScanner } from '../components/ui/BarcodeScanner';
import Select from 'react-select';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export function InventarioOperativo() {
  const { user } = useAuth();
  
  const [depositosOperativos, setDepositosOperativos] = useState<Deposito[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string>('');
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [etiquetasLocales, setEtiquetasLocales] = useState<Etiqueta[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Consumption Scan
  const [scanInput, setScanInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'solicitudes' | 'escaner'>('stock');

  // Request Form
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ producto_id: '', cantidad: 1 });

  useEffect(() => {
    fetchBaseData();
    const sub1 = supabase.channel('wms_op_et').on('postgres_changes', { event: '*', schema: 'public', table: 'etiquetas' }, fetchDataRelacional).subscribe();
    const sub2 = supabase.channel('wms_op_sol').on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes' }, fetchDataRelacional).subscribe();
    return () => { supabase.removeChannel(sub1); supabase.removeChannel(sub2); };
  }, []);

  useEffect(() => {
    if (sectorSeleccionado) {
      fetchDataRelacional();
    }
  }, [sectorSeleccionado]);

  const fetchBaseData = async () => {
    try {
      const [depRes, prodRes] = await Promise.all([
        supabase.from('depositos').select('*').eq('tipo', 'operativo').order('nombre'),
        supabase.from('productos').select('*').order('nombre')
      ]);
      
      if (depRes.data && depRes.data.length > 0) {
        setDepositosOperativos(depRes.data as Deposito[]);
        setSectorSeleccionado(depRes.data[0].id);
      }
      if (prodRes.data) setProductos(prodRes.data as Producto[]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDataRelacional = async () => {
    if (!sectorSeleccionado) return;
    try {
      const [etiqRes, solRes] = await Promise.all([
        supabase.from('etiquetas').select('*, productos(*)').eq('deposito_id', sectorSeleccionado).eq('estado', 'activo'),
        supabase.from('solicitudes').select('*, productos(*)').eq('deposito_id', sectorSeleccionado).order('fecha_creacion', { ascending: false }).limit(20)
      ]);
      if (etiqRes.data) setEtiquetasLocales(etiqRes.data as Etiqueta[]);
      if (solRes.data) setSolicitudes(solRes.data as Solicitud[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!sectorSeleccionado || !newRequest.producto_id) return;
    
    try {
      const { error } = await supabase.from('solicitudes').insert([{
        deposito_id: sectorSeleccionado,
        producto_id: newRequest.producto_id,
        cantidad_solicitada: newRequest.cantidad,
        estado: 'pendiente',
        usuario_id: user?.id
      }]);
      if (error) throw error;
      
      setIsRequestModalOpen(false);
      setNewRequest({ producto_id: '', cantidad: 1 });
      alert('Solicitud enviada al Almacén General.');
    } catch (error) {
      handleSupabaseError(error, 'Solicitar Insumo');
    }
  };

  const processScan = async (codigo: string) => {
    const found = etiquetasLocales.find(et => et.codigo_barras.toUpperCase() === codigo.toUpperCase());
    
    if (found) {
      const extractStr = window.prompt(`Has escaneado la etiqueta ${found.codigo_barras} de ${found.productos?.nombre}.\nStock disponible: ${found.cantidad_actual}.\n¿Cuánto vas a utilizar/consumir?`, '1');
      if (extractStr) {
        const extractAmnt = Number(extractStr);
        if(!isNaN(extractAmnt) && extractAmnt > 0 && extractAmnt <= found.cantidad_actual) {
          try {
            const newAmount = found.cantidad_actual - extractAmnt;
            const newState = newAmount <= 0 ? 'agotado' : 'activo';

            await supabase.from('etiquetas').update({ cantidad_actual: newAmount, estado: newState }).eq('id', found.id);
            await supabase.from('movimientos').insert([{
              etiqueta_id: found.id,
              tipo: 'consumo',
              cantidad: extractAmnt,
              deposito_origen_id: sectorSeleccionado,
              usuario_id: user?.id
            }]);
            alert('Consumo registrado exitosamente.');
          } catch(e) {
            handleSupabaseError(e, 'Registrar Consumo');
          }
        } else {
          alert('Cantidad inválida.');
        }
      }
    } else {
      alert("Etiqueta no encontrada en este sector operativo, o el código es inválido.");
    }
    setScanInput('');
  };

  const handleScanConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    await processScan(scanInput);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-blue-950 dark:text-white tracking-tighter">Sala Operacional</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Consumo local directo y solicitudes logísticas.</p>
        </div>
        <div className="w-64">
          <Select 
            options={depositosOperativos.map(d => ({ value: d.id, label: d.nombre }))}
            value={{ value: sectorSeleccionado, label: depositosOperativos.find(d => d.id === sectorSeleccionado)?.nombre || '' }}
            onChange={opt => setSectorSeleccionado(opt?.value || '')}
            className="text-sm font-bold"
          />
        </div>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'stock', label: 'Stock en mi Sector' },
          { id: 'escaner', label: 'Consumir Insumo' },
          { id: 'solicitudes', label: 'Mis Solicitudes' }
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-nexus p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-900 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/30">
            <h3 className="font-black text-blue-950 dark:text-white tracking-tight">Etiquetas en Ubicación Local</h3>
            <button onClick={() => setIsRequestModalOpen(true)} className="btn-primary text-xs py-2 h-auto flex gap-2"><Send className="w-3.5 h-3.5"/> Pedir Insumos</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-900">
                <th className="px-8 py-5">Etiqueta ID</th>
                <th className="px-8 py-5">Producto / Mención</th>
                <th className="px-8 py-5 text-right">Saldo Físico</th>
                <th className="px-8 py-5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
              {etiquetasLocales.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-slate-500 font-bold">No hay stock asignado a este sector. Puedes solicitar a planta general.</td>
                </tr>
              )}
              {etiquetasLocales.map((et) => (
                <tr key={et.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white font-mono font-bold">
                      <QrCode className="w-5 h-5 text-slate-400" />
                      {et.codigo_barras}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-sm text-blue-950 dark:text-white">{et.productos?.nombre}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{et.productos?.sku}</p>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-xl text-blue-600 dark:text-blue-400">
                    {et.cantidad_actual}
                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{et.productos?.unidad}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">Apto Uso</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {activeTab === 'escaner' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto card-nexus p-10 bg-slate-950 text-white relative overflow-hidden flex flex-col items-center border-[6px] border-slate-900">
          <Scan className="w-24 h-24 text-emerald-500/50 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <h3 className="text-xl font-black mb-2 text-center">Consumo Operativo</h3>
          <p className="text-xs font-bold text-slate-400 mb-8 text-center px-4 leading-relaxed">Escanea la etiqueta del insumo de este sector que vayas a utilizar para descontarlo de tu repisa local y dar seguimiento de producción.</p>
          <form onSubmit={handleScanConsumption} className="w-full relative">
            <input 
              autoFocus
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-5 text-center font-mono text-xl tracking-widest text-emerald-400 uppercase focus:border-emerald-500/50 transition-colors placeholder:text-slate-800 outline-none"
              placeholder="CÓDIGO ETIQUETA"
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
            />
          </form>
          <button onClick={() => setIsCameraOpen(true)} className="mt-4 w-full py-3 bg-emerald-600/20 text-emerald-500 font-bold rounded-xl border border-emerald-500/30">Escanear con Cámara</button>
          {isCameraOpen && <BarcodeScanner onScan={(c) => { setIsCameraOpen(false); processScan(c); }} onClose={() => setIsCameraOpen(false)} />}
        </motion.div>
      )}

      {activeTab === 'solicitudes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-nexus p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-900 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/30">
            <h3 className="font-black text-blue-950 dark:text-white tracking-tight flex items-center gap-2"><Clock className="w-5 h-5"/> Historial de Solicitudes</h3>
          </div>
          <div className="p-8 space-y-4">
            {solicitudes.length === 0 ? (
              <p className="text-center font-bold text-slate-400 py-10">No hay solicitudes recientes en este sector.</p>
            ) : (
              solicitudes.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                      <Box className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-black text-blue-950 dark:text-white">{s.cantidad_solicitada}x {s.productos?.nombre}</p>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">Pendiente de Aprobador General</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm",
                    s.estado === 'pendiente' ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600" :
                    s.estado === 'aprobada' ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-red-100 dark:bg-red-900/40 text-red-600"
                  )}>
                    {s.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Solicitar Traslado de Stock">
        <form className="space-y-6" onSubmit={handleCreateRequest}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Insumo / Producto Maestro</label>
            <Select 
              options={productos.map(p => ({ value: p.id, label: `${p.nombre} (${p.sku})` }))}
              onChange={opt => setNewRequest({...newRequest, producto_id: opt?.value || ''})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cantidad a Solicitar (Unidades Logísticas)</label>
            <input className="input-nexus text-xl font-bold" type="number" min="1" required value={newRequest.cantidad} onChange={e => setNewRequest({...newRequest, cantidad: Number(e.target.value)})}/>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">La requisición llegará a Depósito General para surtir tu sector físicamente, trayendo consigo las etiquetas necesarias.</p>
          </div>
          <button type="submit" className="w-full btn-primary py-4 mt-6">Enviar Petición a Centro Logístico</button>
        </form>
      </Modal>
    </div>
  );
}
