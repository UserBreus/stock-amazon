import { useEffect, useState } from 'react';
import { executeAWSQuery } from '../../lib/aws-client';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CompraDetalleModal } from '../ui/CompraDetalleModal';

export function ComprasDashboard({ onCreateClick, onEditDraft }: { onCreateClick: () => void, onEditDraft: (compra: any) => void }) {
   const [compras, setCompras] = useState<any[]>([]);
   const [showRecibidas, setShowRecibidas] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [compraActiva, setCompraActiva] = useState<any>(null);
   const [templateSteps, setTemplateSteps] = useState<Record<number, any[]>>({});

   useEffect(() => { 
       fetchCompras(); 
       fetchTemplateSteps();
   }, []);

   const fetchTemplateSteps = async () => {
       try {
           const steps = await executeAWSQuery("SELECT * FROM Stock_Plantillas_Progreso_Pasos ORDER BY plantilla_id, orden");
           const grouped: Record<number, any[]> = {};
           if (steps) {
               steps.forEach((s: any) => {
                   if (!grouped[s.plantilla_id]) grouped[s.plantilla_id] = [];
                   grouped[s.plantilla_id].push(s);
               });
           }
           setTemplateSteps(grouped);
       } catch(e) {
           console.error("Error loading template steps in ComprasDashboard", e);
       }
   };

   const fetchCompras = async () => {
       setIsLoading(true);
       try {
           const data = await executeAWSQuery("SELECT c.*, p.nombre as proveedor_nombre, m.simbolo as moneda_simbolo FROM Stock_Compras c LEFT JOIN Stock_Proveedores p ON c.proveedor_id = p.id LEFT JOIN Stock_Monedas m ON c.moneda_id = m.id ORDER BY c.fecha_creacion DESC");
           if(data) { setCompras(data); setCompraActiva(prev => prev ? data.find(c => c.id === prev.id) || prev : null); }
       } catch(e) { console.error(e); } finally {
           setIsLoading(false);
       }
   };

   const mostradas = compras.filter(c => {
       const steps = templateSteps[c.plantilla_progreso_id || 1] || [];
       const lastStepKey = steps.length > 0 ? steps[steps.length - 1].clave : 'recibido';
       const isRecibida = c.progreso === lastStepKey || c.estado === 'completada';
       return showRecibidas ? isRecibida : !isRecibida;
   });

   return (
       <div className="space-y-6">
           <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
               <div className="flex gap-2">
                   <button onClick={() => setShowRecibidas(false)} className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", !showRecibidas ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50")}>Activas</button>
                   <button onClick={() => setShowRecibidas(true)} className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all", showRecibidas ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50")}>Recibidas/Historial</button>
               </div>
               <button onClick={onCreateClick} className="btn-primary flex items-center gap-2">
                   <Plus className="w-4 h-4"/> Crear Compra
               </button>
           </div>
           
           {isLoading ? (
               <div className="text-center py-20 text-slate-500 font-bold">Cargando compras...</div>
           ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {mostradas.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 font-bold">No hay compras para mostrar.</div>}
                    {mostradas.map(c => {
                        const steps = templateSteps[c.plantilla_progreso_id || 1] || [];
                        const currentStepObj = steps.find((s: any) => s.clave === c.progreso);
                        const progressLabel = currentStepObj ? currentStepObj.etiqueta : String(c.progreso).replace(/_/g, ' ');
                        return (
                            <button onClick={() => setCompraActiva(c)} key={c.id} className="card-nexus p-6 text-left hover:-translate-y-1 hover:shadow-lg transition-all group border border-slate-100 hover:border-indigo-300">
                                <div className="flex justify-between items-start mb-4">
                                   <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", c.estado === 'pre-compra' ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700")}>
                                      {c.estado === 'pre-compra' ? 'Borrador / Precompra' : 'Confirmada'}
                                   </span>
                                   <span className="text-xs font-bold text-slate-400">{new Date(c.fecha_creacion).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-black text-xl text-slate-900 truncate mb-1">{c.proveedor_nombre || 'Sin Proveedor'}</h3>
                                <p className="text-sm font-bold text-slate-500">Ref: {c.referencia_factura}</p>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                                    <div>
                                       <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Progreso</p>
                                       <p className="text-sm font-black text-slate-700 capitalize">{progressLabel}</p>
                                    </div>
                                    <p className="font-black text-lg text-emerald-600">{c.moneda_simbolo || '$'}{c.total_compra}</p>
                                </div>
                            </button>
                        );
                    })}
               </div>
           )}

           {compraActiva && (
               <CompraDetalleModal 
                  isOpen={!!compraActiva} 
                  compra={compraActiva} 
                  onClose={() => setCompraActiva(null)}
                  onUpdate={() => { fetchCompras(); }}
                 onEditDraft={() => onEditDraft(compraActiva)}
               />
           )}
       </div>
   );
}
