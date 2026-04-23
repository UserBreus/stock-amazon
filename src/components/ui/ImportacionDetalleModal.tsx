import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe2, Building2, Truck, Box, Package, Factory, Anchor, Ship, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { executeAWSQuery } from '../../lib/aws-client';
import toast from 'react-hot-toast';
import { cn, formatCurrency } from '../../lib/utils';
import { Modal } from './Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  importacion: any;
  onUpdate: () => void;
}

const timelineSteps = [
    { key: 'realizada', label: 'Realizada', icon: Package },
    { key: 'en_fabricacion', label: 'En Fabricación', icon: Factory },
    { key: 'en_deposito_traslado', label: 'Depósito de Traslado', icon: Truck },
    { key: 'esperando_embarque', label: 'Esperando Embarque', icon: Anchor },
    { key: 'embarcado', label: 'Embarcado', icon: Ship },
    { key: 'puerto_intermedio', label: 'Puerto Intermedio', icon: MapPin },
    { key: 'puerto_uruguayo', label: 'Puerto Uruguayo', icon: Anchor },
    { key: 'esperando_envio', label: 'Esperando a que nos envíen', icon: Truck },
    { key: 'recibido', label: 'Recibido', icon: CheckCircle2 }
];

export function ImportacionDetalleModal({ isOpen, onClose, importacion, onUpdate }: Props) {
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && importacion) {
        fetchComprasDetalle();
    }
  }, [isOpen, importacion]);

  const fetchComprasDetalle = async () => {
     setLoading(true);
     try {
         const q = `
            SELECT 
                c.id, c.referencia_factura, c.fecha_creacion, c.total_compra,
                prov.nombre as proveedor_nombre,
                ISNULL(SUM(d.cantidad), 0) as total_unidades
            FROM Stock_Compras c
            LEFT JOIN Stock_Proveedores prov ON c.proveedor_id = prov.id
            LEFT JOIN Stock_Compras_Detalle d ON c.id = d.compra_id
            WHERE c.importacion_id = '${importacion.id}'
            GROUP BY c.id, c.referencia_factura, c.fecha_creacion, c.total_compra, prov.nombre
         `;
         const res = await executeAWSQuery(q);
         setCompras(res || []);
     } catch(e:any) {
         toast.error("Error cargando compras asociadas: " + e.message);
     } finally {
         setLoading(false);
     }
  };

  const handleUpdateProgress = async (newProgreso: string) => {
     if (isUpdating || !importacion) return;
     setIsUpdating(true);
     try {
         const q = `
            UPDATE Stock_Importaciones SET progreso = '${newProgreso}' WHERE id = '${importacion.id}';
            UPDATE Stock_Compras SET progreso = '${newProgreso}' WHERE importacion_id = '${importacion.id}';
         `;
         await executeAWSQuery(q);
         toast.success('Progreso actualizado para la Importación y todas sus compras.');
         onUpdate(); 
     } catch(e:any) {
         toast.error('Error al actualizar: ' + e.message);
     } finally {
         setIsUpdating(false);
     }
  };

  if (!isOpen || !importacion) return null;

  const currentStepIndex = timelineSteps.findIndex(s => s.key === importacion.progreso);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-6xl bg-white dark:bg-[#0a101f] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
           
           <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
             <div>
               <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Globe2 className="w-6 h-6 text-indigo-500" />
                  Expediente Logistic: {importacion.origen}
               </h2>
               <p className="text-sm font-bold text-slate-500 mt-1">Supervisa todas las entidades y compras alojadas en esta importación.</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
           </div>

           <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
              
              {/* IZQUIERDA: DATOS E INFORMACIÓN */}
              <div className="flex-[1.2] p-6 space-y-6 bg-white dark:bg-[#0a101f]">
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1 mb-2"><Building2 className="w-3 h-3"/> Importador</p>
                          <p className="font-black text-slate-800 dark:text-slate-200">{importacion.empresa_importadora || 'No definido'}</p>
                          <p className="text-xs font-bold text-indigo-600 mt-1">{importacion.contacto_importadora || 'Sin contacto'}</p>
                     </div>
                     <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-2"><Truck className="w-3 h-3"/> Transporte Flete</p>
                          <p className="font-black text-slate-800 dark:text-slate-200">{importacion.empresa_transporte_local || 'No definido'}</p>
                          <p className="text-xs font-bold text-emerald-600 mt-1">{importacion.contacto_transporte_local || 'Sin contacto'}</p>
                     </div>
                 </div>

                 <div>
                     <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Box className="w-4 h-4 text-slate-400" />
                        Compras Incluidas ({compras.length})
                     </h3>
                     
                     {loading ? (
                         <div className="flex justify-center items-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                     ) : compras.length === 0 ? (
                         <p className="text-center font-bold text-slate-400 py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">No hay compras vinculadas.</p>
                     ) : (
                         <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                             {compras.map(c => (
                                 <div key={c.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center transition-colors hover:border-indigo-200">
                                     <div>
                                         <p className="font-black text-slate-800 dark:text-slate-200">Ref: {c.referencia_factura || 'Sin Referencia'}</p>
                                         <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">{c.proveedor_nombre || 'Proveedor Desconocido'} • {c.total_unidades} Unds.</p>
                                     </div>
                                     <div className="text-right">
                                         <p className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(c.total_compra, 'USD')}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>

              </div>
              
              {/* DERECHA: SEGUIMIENTO LOGISTICO GLOBAL */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 relative">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                      <h3 className="font-black text-sm text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                         <Anchor className="w-4 h-4"/> Progreso Logístico Global
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-1">Este carril controla y actualiza todas las compras vinculadas al unísono.</p>
                  </div>
                  <div className="p-8">
                      <div className="relative">
                          <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-indigo-100 dark:bg-indigo-900/30"></div>
                          <div className="space-y-8 relative">
                              {timelineSteps.map((step, idx) => {
                                  const isCompleted = currentStepIndex >= idx;
                                  const isCurrent = currentStepIndex === idx;
                                  const Icon = step.icon;
                                  return (
                                      <div key={step.key} className="flex flex-col items-start gap-3 relative group">
                                         <div className="flex items-center gap-4 w-full">
                                            <button 
                                                disabled={isUpdating}
                                                onClick={() => handleUpdateProgress(step.key)}
                                                className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-4 transition-all relative z-10",
                                                    isCurrent ? "bg-indigo-50 border-indigo-500 text-indigo-600 scale-110 shadow-lg shadow-indigo-500/20" : 
                                                    isCompleted ? "bg-indigo-500 border-indigo-500 text-white" : 
                                                    "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-300"
                                                )}
                                            >
                                                {isUpdating && isCurrent ? <Loader2 className="w-5 h-5 animate-spin"/> : <Icon className="w-5 h-5" />}
                                            </button>
                                            <div className="flex-1">
                                                <p className={cn("font-black text-sm transition-colors", isCurrent ? "text-indigo-600" : isCompleted ? "text-slate-800 dark:text-slate-200" : "text-slate-400")}>
                                                    {step.label}
                                                </p>
                                                {isCurrent && <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Operación actual</p>}
                                            </div>
                                            {isCompleted && !isCurrent && (
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="w-4 h-4"/>
                                                </div>
                                            )}
                                         </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              </div>

           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
