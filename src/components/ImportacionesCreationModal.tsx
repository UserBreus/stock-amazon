import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Ship, Plane, Truck } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

interface ProveedorInput {
  nombre_proveedor: string;
  ciudad_origen: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportacionesCreationModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [id, setId] = useState('');
  const [puertoOrigen, setPuertoOrigen] = useState('');
  const [puertoDestino, setPuertoDestino] = useState('Montevideo, UY');
  const [fechaCompra, setFechaCompra] = useState('');
  const [fechaPrometida, setFechaPrometida] = useState('');
  const [tipo, setTipo] = useState<'ocean' | 'air' | 'road'>('ocean');
  const [transportista, setTransportista] = useState('');
  const [proveedores, setProveedores] = useState<ProveedorInput[]>([{ nombre_proveedor: '', ciudad_origen: '' }]);

  if (!isOpen) return null;

  const handleAddProveedor = () => {
    setProveedores([...proveedores, { nombre_proveedor: '', ciudad_origen: '' }]);
  };

  const handleRemoveProveedor = (index: number) => {
    setProveedores(proveedores.filter((_, i) => i !== index));
  };

  const updateProveedor = (index: number, field: keyof ProveedorInput, value: string) => {
    const newProv = [...proveedores];
    newProv[index][field] = value;
    setProveedores(newProv);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!id || !puertoOrigen || !puertoDestino || !fechaCompra || !fechaPrometida || !transportista) {
        throw new Error('Por favor completa los campos principales.');
      }

      if (proveedores.some(p => !p.nombre_proveedor || !p.ciudad_origen)) {
        throw new Error('Todos los proveedores deben tener nombre y ciudad de origen.');
      }

      // 1. Insertar Importación base
      const { error: importError } = await supabase.from('importaciones').insert([{
        id: id.toUpperCase(),
        puerto_origen: puertoOrigen,
        puerto_destino: puertoDestino,
        fecha_compra: new Date(fechaCompra).toISOString(),
        fecha_prometida: new Date(fechaPrometida).toISOString(),
        tipo,
        transportista,
        estado: 'Planificado',
        progreso: 0,
        usuario_id: user?.id || null
      }]);

      if (importError) {
        if (importError.code === '23505') throw new Error('El ID de importación ya existe.');
        throw importError;
      }

      // 2. Insertar Proveedores múltiples
      if (proveedores.length > 0) {
        const proveedoresToInsert = proveedores.map(p => ({
          importacion_id: id.toUpperCase(),
          nombre_proveedor: p.nombre_proveedor,
          ciudad_origen: p.ciudad_origen
        }));

        const { error: provError } = await supabase.from('importacion_proveedores').insert(proveedoresToInsert);
        if (provError) throw provError;
      }

      // 3. Insertar Evento Inicial (Automático)
      await supabase.from('importacion_eventos').insert([{
        importacion_id: id.toUpperCase(),
        ubicacion: puertoOrigen,
        anotacion: 'Importación Creada y Planificada. Documentación en orden.',
        usuario: user?.usuario || 'Sistema'
      }]);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la importación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-black text-blue-950 dark:text-white">Nueva Importación</h2>
              <p className="text-sm text-slate-500 font-medium">Registra un nuevo envío desde el extranjero</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}

            <form id="import-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Info General */}
              <div>
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Información Principal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ID de Seguimiento (Ej: SHP-1002)</label>
                    <input required value={id} onChange={e => setId(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-500" placeholder="Código Único" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transportista / Courier</label>
                    <input required value={transportista} onChange={e => setTransportista(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-500" placeholder="Ej: Maersk, DHL, FedEx" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Medio de Transporte</label>
                    <div className="flex gap-2">
                       <button type="button" onClick={() => setTipo('ocean')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${tipo === 'ocean' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'}`}><Ship className="w-4 h-4"/> Mar</button>
                       <button type="button" onClick={() => setTipo('air')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${tipo === 'air' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'}`}><Plane className="w-4 h-4"/> Aire</button>
                       <button type="button" onClick={() => setTipo('road')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${tipo === 'road' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'}`}><Truck className="w-4 h-4"/> Tierra</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ruteo y Fechas */}
              <div>
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Ruteo y Tiempos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Puerto de Origen (Conjunto)</label>
                    <input required value={puertoOrigen} onChange={e => setPuertoOrigen(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-500" placeholder="Ej: Puerto de Shanghai" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Puerto de Destino (Local)</label>
                    <input required value={puertoDestino} onChange={e => setPuertoDestino(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-500" placeholder="Ej: Puerto de Montevideo" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha de Compra</label>
                    <input type="date" required value={fechaCompra} onChange={e => setFechaCompra(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Prometida de Llegada</label>
                    <input type="date" required value={fechaPrometida} onChange={e => setFechaPrometida(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Proveedores */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Proveedores Consolidados</h3>
                  <button type="button" onClick={handleAddProveedor} className="text-xs font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors">
                    <Plus className="w-3 h-3" /> Añadir Proveedor
                  </button>
                </div>
                
                <div className="space-y-3">
                  {proveedores.map((prov, i) => (
                    <div key={i} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl">
                      <div className="flex-1">
                        <input required value={prov.nombre_proveedor} onChange={e => updateProveedor(i, 'nombre_proveedor', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-blue-950 placeholder:text-slate-400 placeholder:font-medium" placeholder="Nombre Proveedor (Ej: Telas SA)" />
                      </div>
                      <div className="w-px h-6 bg-slate-200"></div>
                      <div className="flex-1">
                        <input required value={prov.ciudad_origen} onChange={e => updateProveedor(i, 'ciudad_origen', e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-blue-950 placeholder:text-slate-400 placeholder:font-medium" placeholder="Ciudad Origen (Ej: Guangzhou)" />
                      </div>
                      {proveedores.length > 1 && (
                        <button type="button" onClick={() => handleRemoveProveedor(i)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </form>
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0a101f] rounded-b-3xl flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button form="import-form" disabled={loading} type="submit" className="px-8 py-3 rounded-xl font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/30">
              {loading ? 'Planificando...' : 'Planificar Importación'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
