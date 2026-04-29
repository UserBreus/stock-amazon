import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { executeAWSQuery } from '../../lib/aws-client';
import { Package, Truck, Anchor, CheckCircle2, Factory, Ship, MapPin, QrCode, Printer } from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { printLabel } from '../../lib/printLabel';
import { PrintLabelsModal } from './PrintLabelsModal';

export function CompraDetalleModal({ isOpen, compra, onClose, onUpdate, onEditDraft }: any) {
   const [detalles, setDetalles] = useState<any[]>([]);
   const [etiquetasPendientes, setEtiquetasPendientes] = useState<any[]>([]);
   const [costosExtra, setCostosExtra] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [nuevoCostoItem, setNuevoCostoItem] = useState({ desc: '', monto: '' });
   const [showExtraCostoForm, setShowExtraCostoForm] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);
   const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
   
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

   useEffect(() => {
      if(isOpen && compra) fetchDetalles();
   }, [isOpen, compra]);

   const fetchDetalles = async () => {
      setIsLoading(true);
      try {
           const [res, costosRes, etqRes] = await Promise.all([
               executeAWSQuery(`SELECT d.*, v.nombre_variante, p.nombre as producto_nombre FROM Stock_Compras_Detalle d INNER JOIN Stock_Variantes v ON d.variante_id = v.id INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id WHERE d.compra_id = '${compra.id}'`),
               executeAWSQuery(`IF OBJECT_ID('Stock_Compras_Costos_Extra', 'U') IS NOT NULL EXEC('SELECT * FROM Stock_Compras_Costos_Extra WHERE compra_id = ''${compra.id}'' ORDER BY fecha ASC')`).catch(() => []),
               executeAWSQuery(`
                   SELECT e.id as etiqueta_id, e.codigo_barras, e.variante_id, v.nombre_variante, p.nombre as producto_nombre, p.tipo_gestion, e.cantidad_inicial as cantidad, e.compra_id
                   FROM Stock_Etiquetas e
                   INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                   INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                   WHERE e.compra_id = '${compra.id}' AND e.estado = 'pendiente_recepcion'
                   ORDER BY e.id ASC
               `).catch(() => [])
           ]);
           if(res) setDetalles(res);
           if(costosRes) setCostosExtra(costosRes);
           if(etqRes) {
               // Agrupar por variante_id: cada variante = 1 entrada con todos sus IDs reales
               const grouped: Record<string, any> = {};
               for (const e of etqRes) {
                   const key = String(e.variante_id);
                   if (!grouped[key]) {
                       grouped[key] = {
                           ...e,
                           etiqueta_id: e.codigo_barras || e.etiqueta_id,
                           etiqueta_ids: [e.codigo_barras || e.etiqueta_id],
                           // Para granel: cantidad_inicial por bulto; para lote_individual: 1 unidad por etiqueta
                           cantidad: e.tipo_gestion === 'lote_individual' ? 1 : e.cantidad,
                           bultos_predefinidos: 1,
                       };
                   } else {
                       grouped[key].etiqueta_ids.push(e.codigo_barras || e.etiqueta_id);
                       grouped[key].bultos_predefinidos = grouped[key].etiqueta_ids.length;
                   }
               }
               setEtiquetasPendientes(Object.values(grouped));
           }
       } catch(e) { console.error(e); }
      setIsLoading(false);
   };

   const agregarCostoExtra = async () => {
       if(!nuevoCostoItem.desc || !nuevoCostoItem.monto) return toast.error('Completá la descripción y el monto.');
       setIsUpdating(true);
       try {
           const monto = parseFloat(nuevoCostoItem.monto);
           await executeAWSQuery(`
               IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'costo_puesto_local' AND Object_ID = Object_ID(N'Stock_Compras_Detalle'))
               BEGIN
                   ALTER TABLE Stock_Compras_Detalle ADD costo_puesto_local DECIMAL(18,2);
               END
           `);

           await executeAWSQuery(`
               IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Compras_Costos_Extra]'))
               BEGIN
                   CREATE TABLE Stock_Compras_Costos_Extra (
                       id INT IDENTITY(1,1) PRIMARY KEY,
                       compra_id UNIQUEIDENTIFIER NOT NULL,
                       descripcion VARCHAR(255) NOT NULL,
                       monto DECIMAL(18,2) NOT NULL,
                       fecha DATETIME DEFAULT GETDATE()
                   );
               END
           `);

           await executeAWSQuery(`
               INSERT INTO Stock_Compras_Costos_Extra (compra_id, descripcion, monto) VALUES ('${compra.id}', '${nuevoCostoItem.desc}', ${monto});
               UPDATE Stock_Compras SET gastos_extras = gastos_extras + ${monto} WHERE id = '${compra.id}';
           `);

           await executeAWSQuery(`
               DECLARE @TotalCompra DECIMAL(18,2) = (SELECT NULLIF(total_compra,0) FROM Stock_Compras WHERE id = '${compra.id}');
               DECLARE @TotalExtra DECIMAL(18,2) = (SELECT gastos_extras FROM Stock_Compras WHERE id = '${compra.id}');
               
               UPDATE Stock_Compras_Detalle 
               SET costo_puesto_local = precio_unitario + COALESCE(((precio_unitario / @TotalCompra) * @TotalExtra), 0)
               WHERE compra_id = '${compra.id}';
           `);
           toast.success('Costo extra añadido y prorrateado en local.');
           setNuevoCostoItem({ desc: '', monto: '' });
           setShowExtraCostoForm(false);
           fetchDetalles();
           onUpdate();
       } catch(e) {
           toast.error('Error al agregar el costo.');
       }
       setIsUpdating(false);
   };

   const updateProgreso = async (newProgreso: string) => {
       setIsUpdating(true);
       try {
           await executeAWSQuery(`UPDATE Stock_Compras SET progreso = '${newProgreso}' WHERE id = '${compra.id}'`);
           toast.success('Progreso actualizado');
           onUpdate();
       } catch(e) {
           toast.error('Error al actualizar');
       }
       setIsUpdating(false);
   };

   if(!compra) return null;

   const currentStepIndex = timelineSteps.findIndex(s => s.key === compra.progreso);

   return (
       <>
       <Modal isOpen={isOpen} onClose={onClose} title={`Detalle de Compra: ${compra.referencia_factura}`} maxWidth="max-w-5xl">
           <div className="space-y-6">
                {/* Print Labels Banner */}
                <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl px-5 py-3">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="font-black text-sm text-indigo-900 dark:text-indigo-200">Etiquetas Pre-impresas</p>
                      <p className="text-xs text-indigo-400 font-medium tracking-wide">
                        {etiquetasPendientes.length === 0 ? 'Generá primero la orden definitiva para crear los códigos.' : `${etiquetasPendientes.length} etiquetas listas para imprimir e ingresar.`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    disabled={isLoading || etiquetasPendientes.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir Etiquetas
                  </button>
                </div>

                <div className="card-nexus p-6 bg-slate-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50 flex justify-between items-center relative overflow-visible z-10">
                   <div>
                       <h4 className="font-black text-indigo-900 dark:text-indigo-200 text-lg mb-1">Monto Total</h4>
                       <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Gastos / Fletes Extra: {compra.moneda_simbolo || '$'}{compra.gastos_extras || 0}</p>
                   </div>
                    <div className="flex gap-4 items-center">
                       {compra.estado !== 'recibido' && (
                           <div className="relative">
                               <button 
                                   onClick={() => setShowExtraCostoForm(!showExtraCostoForm)}
                                   className="px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm"
                               >
                                   + Cargar Costo Extra
                               </button>
                               {showExtraCostoForm && (
                                   <div className="absolute top-10 right-0 w-72 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col gap-3">
                                       <div className="flex justify-between items-center mb-1">
                                           <span className="font-bold text-slate-800 dark:text-white text-sm">Nuevo Costo</span>
                                           <button onClick={() => setShowExtraCostoForm(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold">✕ Cerrar</button>
                                       </div>
                                       <input 
                                          type="text" 
                                          placeholder="Concepto (Ej: Aduana)..." 
                                          className="input-nexus w-full text-sm py-2 px-3"
                                          value={nuevoCostoItem.desc}
                                          onChange={(e) => setNuevoCostoItem({...nuevoCostoItem, desc: e.target.value})}
                                       />
                                       <div className="flex gap-2">
                                           <input 
                                              type="number" 
                                              placeholder="Monto" 
                                              className="input-nexus flex-1 text-sm py-2 px-3"
                                              value={nuevoCostoItem.monto}
                                              onChange={(e) => setNuevoCostoItem({...nuevoCostoItem, monto: e.target.value})}
                                           />
                                           <button 
                                              disabled={isUpdating}
                                              onClick={agregarCostoExtra}
                                              className="px-4 py-2 font-bold text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                           >
                                               Agregar
                                           </button>
                                       </div>
                                   </div>
                               )}
                           </div>
                       )}
                       <p className="text-4xl font-black text-indigo-600">{compra.moneda_simbolo || '$'}{compra.total_compra}</p>
                   </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-6">
                       <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                           <h4 className="font-black text-slate-800 dark:text-white text-lg p-5 border-b border-slate-100 dark:border-slate-800">Cargamento ({detalles.length} items)</h4>
                           {isLoading ? <div className="p-10 text-center text-slate-400">Cargando ítems...</div> : (
                               <div className="overflow-x-auto">
                               <table className="w-full text-left text-sm">
                                   <thead className="bg-slate-50 dark:bg-slate-950 font-black text-slate-500 uppercase tracking-widest text-[10px]">
                                      <tr>
                                         <th className="p-4 w-12 text-center">QR</th>
                                         <th className="p-4">Producto</th>
                                         <th className="p-4 text-center">Cantidad</th>
                                         <th className="p-4 text-right hidden sm:table-cell">Real ({compra.moneda_simbolo || '$'})</th>
                                         <th className="p-4 text-right text-indigo-600 hidden sm:table-cell">Local ({compra.moneda_simbolo || '$'})</th>
                                         <th className="p-4 text-right">Total</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                       {detalles.map(d => (
                                           <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                               <td className="p-4 text-center">
                                                   <button 
                                                      onClick={() => printLabel({
                                                        id: d.variante_id,
                                                        producto_padre: d.producto_nombre,
                                                        nombre_variante: d.nombre_variante,
                                                        sku: d.sku
                                                      })}
                                                      className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all px-2 py-1.5 rounded-lg flex flex-col items-center gap-1 shadow-sm uppercase mx-auto"
                                                      title="Imprimir Etiqueta"
                                                   >
                                                      <QrCode className="w-5 h-5 mx-auto" />
                                                      <span className="text-[9px] font-black">Imprimir</span>
                                                   </button>
                                               </td>
                                               <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                  {d.producto_nombre} <span className="text-slate-500 font-medium">({d.nombre_variante})</span>
                                               </td>
                                               <td className="p-4 text-center font-black">{d.cantidad}</td>
                                               <td className="p-4 text-right font-medium text-slate-400 hidden sm:table-cell">{compra.moneda_simbolo || '$'}{Number(d.precio_unitario).toFixed(2)}</td>
                                               <td className="p-4 text-right font-bold text-indigo-600 hidden sm:table-cell">{compra.moneda_simbolo || '$'}{d.costo_puesto_local ? Number(d.costo_puesto_local).toFixed(2) : Number(d.precio_unitario).toFixed(2)}</td>
                                               <td className="p-4 text-right font-black text-emerald-600">{compra.moneda_simbolo || '$'}{(d.precio_unitario * d.cantidad).toFixed(2)}</td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                               </div>
                           )}
                        </div>

                       <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                           <h4 className="font-black text-slate-800 dark:text-white text-lg mb-4">Registro de Costos Adicionales (Aduana, Transporte...)</h4>
                           <ul className="space-y-2 mb-6">
                               {costosExtra.length === 0 && <p className="text-sm font-medium text-slate-400">Sin costos adicionales cargados.</p>}
                               {costosExtra.map(c => (
                                   <li key={c.id} className="flex justify-between items-center text-sm p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-slate-800 dark:text-slate-200">{c.descripcion}</span>
                                           <span className="text-[10px] text-slate-400 font-medium">{new Date(c.fecha).toLocaleString()}</span>
                                       </div>
                                       <span className="font-black text-emerald-600">${c.monto}</span>
                                   </li>
                               ))}
                           </ul>
                       </div>
                   </div>

                   <div className="space-y-6">
                       <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <h4 className="font-black text-slate-800 dark:text-white text-lg mb-4">Progreso Logístico</h4>
                          <div className="flex flex-col gap-1 relative pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                              {timelineSteps.map((step, idx) => {
                                  const isCompleted = currentStepIndex >= idx;
                                  const isCurrent = currentStepIndex === idx;
                                  return (
                                      <div key={step.key} className="relative py-3 flex items-center justify-between group">
                                          <div className={cn("absolute -left-[25px] w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 transition-colors", isCompleted ? "border-emerald-500 bg-emerald-500" : "border-slate-300 dark:border-slate-600")} />
                                          <div className="flex items-center gap-3">
                                              <step.icon className={cn("w-5 h-5", isCompleted ? "text-emerald-600" : "text-slate-400")} />
                                              <span className={cn("font-bold", isCurrent ? "text-emerald-700 dark:text-emerald-400" : (isCompleted ? "text-slate-700 dark:text-slate-200" : "text-slate-400"))}>{step.label}</span>
                                          </div>
                                          
                                          {compra.estado !== 'pre-compra' && !isCurrent && (
                                              <button 
                                                  disabled={isUpdating}
                                                  onClick={() => updateProgreso(step.key)} 
                                                  className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-all"
                                              >
                                                  Marcar
                                              </button>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                       </div>

                       {compra.estado === 'pre-compra' && (
                           <div className="card-nexus p-6 border-amber-200 bg-amber-50">
                               <h4 className="font-black text-amber-900 text-lg mb-2">Pre-Compra / Borrador</h4>
                               <p className="text-sm font-medium text-amber-700 mb-4">Esta compra no ha sido confirmada formalmente. Puedes continuar editándola o confirmarla para iniciar el tracking logístico.</p>
                               <div className="flex flex-col gap-2">
                                   <button 
                                      onClick={() => onEditDraft(compra.id)}
                                      className="w-full py-3 bg-white text-amber-700 font-bold rounded-xl border border-amber-300 hover:bg-amber-100 transition-colors"
                                   >
                                      Continuar Editando
                                   </button>
                                   <button 
                                      onClick={async () => {
                                          setIsUpdating(true);
                                          await executeAWSQuery(`UPDATE Stock_Compras SET estado = 'pendiente', progreso = 'realizada' WHERE id = '${compra.id}'`);
                                          toast.success("Compra confirmada!");
                                          onUpdate();
                                          setIsUpdating(false);
                                      }}
                                      disabled={isUpdating}
                                      className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors"
                                   >
                                      Confirmar Compra
                                   </button>
                               </div>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       </Modal>

       <PrintLabelsModal
         isOpen={isPrintModalOpen}
         onClose={() => setIsPrintModalOpen(false)}
         detalles={etiquetasPendientes}
       />
       </>
   );
}



