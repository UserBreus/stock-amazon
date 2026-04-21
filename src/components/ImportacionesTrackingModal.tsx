import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Anchor, CheckCircle2, Factory, Navigation, Plus, MoreHorizontal } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { Importacion } from '../types';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  importacion: Importacion | null;
  onUpdate: () => void;
}

export function ImportacionesTrackingModal({ isOpen, onClose, importacion, onUpdate }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [nuevaAnotacion, setNuevaAnotacion] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState(importacion?.estado || '');
  const [nuevoProgreso, setNuevoProgreso] = useState(importacion?.progreso || 0);

  // Sync state if importacion changes
  React.useEffect(() => {
    if (importacion) {
      setNuevoEstado(importacion.estado);
      setNuevoProgreso(importacion.progreso);
      setNuevaUbicacion('');
      setNuevaAnotacion('');
    }
  }, [importacion]);

  if (!isOpen || !importacion) return null;

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaUbicacion || !nuevaAnotacion) return;
    setLoading(true);

    try {
      await supabase.from('importacion_eventos').insert([{
        importacion_id: importacion.id,
        ubicacion: nuevaUbicacion,
        anotacion: nuevaAnotacion,
        usuario: user?.usuario || 'Sistema'
      }]);

      onUpdate();
      setNuevaAnotacion('');
      setNuevaUbicacion('');
    } catch (err: any) {
      console.error(err);
      toast.error('Error registrando evento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatusAndDates = async (key: 'estado' | 'fecha_arribo_puerto' | 'fecha_llegada_deposito', val: string | number) => {
    try {
      if (key === 'fecha_arribo_puerto' || key === 'fecha_llegada_deposito') {
        const confirmMsg = key === 'fecha_arribo_puerto' ? '¿Confirmar arribo al puerto destino?' : '¿Confirmar llegada al depósito final?';
        if (!confirm(confirmMsg)) return;
         await supabase.from('importaciones').update({ [key]: new Date().toISOString() }).eq('id', importacion.id);
      } else {
         await supabase.from('importaciones').update({ [key]: val }).eq('id', importacion.id);
      }
      onUpdate();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  const sortedEvents = [...(importacion.importacion_eventos || [])].sort((a,b) => new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime());

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
          className="relative w-full max-w-5xl bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-blue-950 dark:text-white tracking-tight">{importacion.id}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500">{importacion.puerto_origen}</span>
                  <div className="w-10 h-0.5 bg-slate-200 dark:bg-slate-800" />
                  <span className="text-xs font-bold text-blue-950 dark:text-blue-400">{importacion.puerto_destino}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-6 p-6">
            
            {/* Columna Izquierda: Detalles estáticos y Fechas */}
            <div className="flex-1 flex flex-col gap-6 md:w-1/3">
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Hitos de Tiempo</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">Compra:</span>
                    </div>
                    <span className="text-xs font-black text-blue-950 dark:text-white">
                      {new Date(importacion.fecha_compra).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">Prometida:</span>
                    </div>
                    <span className="text-xs font-black text-blue-950 dark:text-white">
                      {new Date(importacion.fecha_prometida).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-sky-50 dark:bg-sky-900/10 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Anchor className="w-4 h-4 text-sky-500" />
                        <span className="text-xs font-bold text-sky-700">Arribo Puerto Destino:</span>
                      </div>
                      <span className="text-xs font-black text-sky-700">
                        {importacion.fecha_arribo_puerto ? new Date(importacion.fecha_arribo_puerto).toLocaleDateString() : 'Pendiente'}
                      </span>
                    </div>
                    {!importacion.fecha_arribo_puerto && (
                      <button onClick={() => handleUpdateStatusAndDates('fecha_arribo_puerto', '')} className="text-[10px] w-full py-1.5 font-bold bg-white border border-sky-100 text-sky-600 rounded-lg hover:bg-sky-50">Marcar Arribo Operativo a Puerto</button>
                    )}
                  </div>

                   <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-700">Llegada a Depósito:</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700">
                        {importacion.fecha_llegada_deposito ? new Date(importacion.fecha_llegada_deposito).toLocaleDateString() : 'Pendiente'}
                      </span>
                    </div>
                     {!importacion.fecha_llegada_deposito && (
                      <button onClick={() => handleUpdateStatusAndDates('fecha_llegada_deposito', '')} className="text-[10px] w-full py-1.5 font-bold bg-white border border-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-50">Marcar Descargado en Depósito Local</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Proveedores Consolidados</h3>
                <div className="space-y-3">
                  {importacion.importacion_proveedores?.map(prov => (
                    <div key={prov.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Factory className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{prov.nombre_proveedor}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Desde: {prov.ciudad_origen}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!importacion.importacion_proveedores || importacion.importacion_proveedores.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No hay proveedores específicos registrados.</p>
                  )}
                </div>
              </div>

               <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Estado Rápido</h3>
                 <div className="flex flex-col gap-3">
                    <select 
                      value={nuevoEstado} 
                      onChange={(e) => {
                        handleUpdateStatusAndDates('estado', e.target.value);
                      }} 
                      className="w-full text-sm font-bold bg-slate-50 border-none rounded-xl p-3 text-blue-950"
                    >
                      <option value="Planificado">Planificado</option>
                      <option value="En Tránsito">En Tránsito Internacional</option>
                      <option value="Aduana">En Aduana (Trámites)</option>
                      <option value="Liberado">Liberado / Tránsito Local</option>
                      <option value="Finalizado">Finalizado / En Depósito</option>
                    </select>

                    <div className="flex gap-2 items-center text-sm font-bold mt-2">
                       <span className="text-slate-500 text-xs w-20">Progreso</span>
                       <input 
                         type="range" min="0" max="100" 
                         value={nuevoProgreso} 
                         onChange={(e) => setNuevoProgreso(Number(e.target.value))}
                         onMouseUp={(e) => handleUpdateStatusAndDates('progreso', e.currentTarget.value)}
                         className="flex-1 cursor-pointer accent-blue-600"
                       />
                       <span className="text-blue-600 w-10 text-right">{nuevoProgreso}%</span>
                    </div>
                 </div>
               </div>

            </div>

            {/* Columna Derecha: Trazabilidad Operativa (Timeline) */}
            <div className="flex-[2] flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                 <h3 className="text-sm font-black text-blue-950 dark:text-white uppercase tracking-widest">Trazabilidad Operativa</h3>
                 <p className="text-xs text-slate-400 mt-1">Bitácora de ubicaciones, aduanas, transbordos y comentarios operativos.</p>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddEvent} className="p-5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                 <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                       <div className="relative flex-1">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input required value={nuevaUbicacion} onChange={e=>setNuevaUbicacion(e.target.value)} type="text" placeholder="Ubicación Física (Ej: Puerto Seco / Aduana)" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-blue-500 outline-none placeholder:text-slate-400" />
                       </div>
                    </div>
                    <div className="relative">
                       <MoreHorizontal className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                       <textarea required value={nuevaAnotacion} onChange={e=>setNuevaAnotacion(e.target.value)} placeholder="Anotación / Novedad / Razón de demora legislativa o despachante" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-blue-500 outline-none resize-none min-h-[60px] placeholder:text-slate-400" />
                    </div>
                    <div className="flex justify-end">
                      <button disabled={loading} type="submit" className="text-xs font-black bg-blue-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
                        <Plus className="w-3 h-3" /> Insertar Novedad ({new Date().toLocaleDateString()})
                      </button>
                    </div>
                 </div>
              </form>

              {/* Timeline Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
                 <div className="absolute top-6 bottom-6 left-[39px] w-px bg-slate-200 dark:bg-slate-800 z-0"></div>
                 
                 {sortedEvents.map((evt, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      key={evt.id} 
                      className="relative z-10 flex gap-4"
                    >
                      <div className="w-[30px] flex shrink-0 justify-center">
                        <div className={cn("w-3 h-3 mt-1.5 rounded-full border-2 border-white ring-2", idx === 0 ? "bg-blue-500 ring-blue-500/50" : "bg-slate-300 ring-slate-100")}></div>
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                         <div className="flex justify-between items-start mb-2">
                            <div>
                               <h4 className="text-sm font-black text-blue-950 dark:text-white flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-blue-500" /> {evt.ubicacion}
                               </h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">{evt.usuario} • {new Date(evt.fecha_evento).toLocaleString()}</p>
                            </div>
                         </div>
                         <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                            {evt.anotacion}
                         </p>
                      </div>
                    </motion.div>
                 ))}

                 {sortedEvents.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-10 text-slate-400 z-10 relative bg-white/50 backdrop-blur-sm rounded-xl">
                      <Navigation className="w-8 h-8 mb-3 opacity-20" />
                      <p className="text-sm font-medium">No se han registrado novedades de rastreo.</p>
                   </div>
                 )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
