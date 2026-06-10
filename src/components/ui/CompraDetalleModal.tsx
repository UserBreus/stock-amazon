import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { executeAWSQuery } from '../../lib/aws-client';
import { Package, Truck, Anchor, CheckCircle2, Factory, Ship, MapPin, QrCode, Printer, Workflow, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
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
   const [isEditing, setIsEditing] = useState(false);
   const [editedDetalles, setEditedDetalles] = useState<any[]>([]);
   const [plantillas, setPlantillas] = useState<any[]>([]);
   const [selectedPlantillaId, setSelectedPlantillaId] = useState<number>(1);
   const [currentTemplateSteps, setCurrentTemplateSteps] = useState<any[]>([]);
   const [loadingTemplate, setLoadingTemplate] = useState(false);

   useEffect(() => {
      if(isOpen && compra) {
          fetchDetalles();
          const platId = compra.plantilla_progreso_id || 1;
          setSelectedPlantillaId(platId);
          fetchPlantillasAndSteps(platId);
      }
   }, [isOpen, compra]);

   const fetchPlantillasAndSteps = async (plantillaId: number) => {
       setLoadingTemplate(true);
       try {
           const [pList, pSteps] = await Promise.all([
               executeAWSQuery("SELECT id, nombre FROM Stock_Plantillas_Progreso ORDER BY nombre"),
               executeAWSQuery(`SELECT * FROM Stock_Plantillas_Progreso_Pasos WHERE plantilla_id = ${plantillaId} ORDER BY orden`)
           ]);
           if (pList) setPlantillas(pList);
           if (pSteps) setCurrentTemplateSteps(pSteps);
       } catch (e) {
           console.error("Error loading template details:", e);
       } finally {
           setLoadingTemplate(false);
       }
   };

   const handleReplaceTemplate = async (newPlantillaId: number) => {
       if (isUpdating || !compra) return;
       if (!window.confirm("¿Seguro que deseas cambiar la plantilla de progreso? Se restablecerá el progreso al primer paso de la nueva plantilla.")) return;
       setIsUpdating(true);
       try {
           const stepRes = await executeAWSQuery(`
               SELECT TOP 1 clave FROM Stock_Plantillas_Progreso_Pasos 
               WHERE plantilla_id = ${newPlantillaId} 
               ORDER BY orden ASC
           `);
           let firstStepKey = 'realizada';
           if (stepRes && stepRes.length > 0) {
               firstStepKey = stepRes[0].clave;
           }

           await executeAWSQuery(`
               UPDATE Stock_Compras 
               SET plantilla_progreso_id = ${newPlantillaId}, 
                   progreso = '${firstStepKey.replace(/'/g, "''")}' 
               WHERE id = '${compra.id}'
           `);
           toast.success('Plantilla de progreso actualizada y progreso restablecido.');
           setSelectedPlantillaId(newPlantillaId);
           await fetchPlantillasAndSteps(newPlantillaId);
           onUpdate();
       } catch(e:any) {
           toast.error('Error al cambiar de plantilla: ' + e.message);
       } finally {
           setIsUpdating(false);
       }
   };

   const fetchDetalles = async () => {
      setIsLoading(true);
      try {
           const [res, costosRes, etqRes] = await Promise.all([
               executeAWSQuery(`SELECT d.*, v.nombre_variante, p.nombre as producto_nombre, p.tipo_gestion FROM Stock_Compras_Detalle d INNER JOIN Stock_Variantes v ON d.variante_id = v.id INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id WHERE d.compra_id = '${compra.id}'`),
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
           if(res) {
               setDetalles(res);
               setEditedDetalles([...res]);
           }
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

   const guardarEdicionCompra = async () => {
       if (editedDetalles.length === 0) {
           return toast.error("La compra debe tener al menos un artículo. Para borrarla, usa otra opción.");
       }
       setIsUpdating(true);
       try {
           const nuevoTotal = editedDetalles.reduce((acc, current) => acc + (current.cantidad * current.precio_unitario), 0);
           
           let q = `
               BEGIN TRY
                   BEGIN TRANSACTION;
                   
                   UPDATE Stock_Compras SET total_compra = ${nuevoTotal} WHERE id = '${compra.id}';
                   
                   DELETE FROM Stock_Compras_Detalle WHERE compra_id = '${compra.id}';
                   DELETE FROM Stock_Etiquetas WHERE compra_id = '${compra.id}' AND estado = 'pendiente_recepcion';
                   
                   DECLARE @CompraSeq INT = (SELECT COALESCE(MAX(CAST(REPLACE(codigo_barras, '${compra.proveedor_id}' + REPLACE(REPLACE('${compra.referencia_factura || ''}', ' ', ''), '-', ''), '') AS INT)), 0) + 1 FROM Stock_Etiquetas WHERE codigo_barras LIKE '${compra.proveedor_id}' + REPLACE(REPLACE('${compra.referencia_factura || ''}', ' ', ''), '-', '') + '%');
                   IF @CompraSeq IS NULL SET @CompraSeq = 1;
                   
                   DECLARE @AlmacenId INT = (SELECT TOP 1 id FROM Stock_Depositos WHERE tipo='central' ORDER BY id ASC);
                   IF @AlmacenId IS NULL SET @AlmacenId = 1;
           `;
           
           const refLimpia = (compra.referencia_factura || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
           const provId = compra.proveedor_id;
           const lastStepKey = currentTemplateSteps.length > 0 ? currentTemplateSteps[currentTemplateSteps.length - 1].clave : 'recibido';
           const isRecibido = compra.progreso === lastStepKey || compra.estado === 'completada';
            
            for (const item of editedDetalles) {
                q += `
                    INSERT INTO Stock_Compras_Detalle (compra_id, variante_id, cantidad, precio_unitario)
                    VALUES ('${compra.id}', '${item.variante_id}', ${item.cantidad}, ${item.precio_unitario});
                `;
                
                if (isRecibido) {
                    q += `
                       UPDATE Stock_Etiquetas 
                       SET costo_unitario_real = ${item.precio_unitario || 0}
                       WHERE compra_id = '${compra.id}' AND variante_id = '${item.variante_id}';
                    `;
                } else {
                    const rand = Math.random().toString(36).substring(2, 9);
                    if (item.tipo_gestion === 'lote_individual') {
                        q += `
                           DECLARE @Iter_${rand} INT = 0;
                           WHILE @Iter_${rand} < ${Math.floor(item.cantidad)}
                           BEGIN
                             INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, compra_id, costo_unitario_real, estado)
                             VALUES ('${provId}${refLimpia}' + CAST(@CompraSeq AS VARCHAR), '${item.variante_id}', @AlmacenId, 1, 0, '${compra.id}', ${item.precio_unitario || 0}, 'pendiente_recepcion');
                             SET @Iter_${rand} = @Iter_${rand} + 1;
                             SET @CompraSeq = @CompraSeq + 1;
                           END
                        `;
                    } else {
                        q += `
                           INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, compra_id, costo_unitario_real, estado)
                           VALUES ('${provId}${refLimpia}' + CAST(@CompraSeq AS VARCHAR), '${item.variante_id}', @AlmacenId, ${item.cantidad}, 0, '${compra.id}', ${item.precio_unitario || 0}, 'pendiente_recepcion');
                           SET @CompraSeq = @CompraSeq + 1;
                        `;
                    }
                }
            }        
           
           q += `
               DECLARE @TotalCompra DECIMAL(18,2) = (SELECT NULLIF(total_compra,0) FROM Stock_Compras WHERE id = '${compra.id}');
               DECLARE @TotalExtra DECIMAL(18,2) = (SELECT COALESCE(gastos_extras, 0) FROM Stock_Compras WHERE id = '${compra.id}');
               
               UPDATE Stock_Compras_Detalle 
               SET costo_puesto_local = precio_unitario + COALESCE(((precio_unitario / @TotalCompra) * @TotalExtra), 0)
               WHERE compra_id = '${compra.id}';
           `;
           
           q += `
                   COMMIT TRANSACTION;
               END TRY
               BEGIN CATCH
                   ROLLBACK TRANSACTION;
                   THROW;
               END CATCH
           `;
           
           await executeAWSQuery(q);
           toast.success("Compra editada correctamente.");
           setIsEditing(false);
           fetchDetalles();
           onUpdate();
       } catch(e: any) {
           toast.error("Error al editar compra: " + e.message);
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

   const currentStepIndex = currentTemplateSteps.findIndex(s => s.clave === compra.progreso);

   return (
       <>
       <Modal isOpen={isOpen} onClose={onClose} title={`Detalle de Compra: ${compra.referencia_factura}`} maxWidth="max-w-5xl">
           <div className="space-y-6">
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
                            <div className="relative flex items-center">
                                {compra.estado !== 'recibido' && !isEditing && (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm ml-2 mr-2"
                                    >
                                        Editar Compra
                                    </button>
                                )}
                                {isEditing && (
                                    <div className="flex gap-2 mr-2">
                                        <button 
                                            onClick={guardarEdicionCompra}
                                            disabled={isUpdating}
                                            className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg border border-emerald-700 hover:bg-emerald-700 transition-colors shadow-sm"
                                        >
                                            Guardar Cambios
                                        </button>
                                        <button 
                                            onClick={() => { setIsEditing(false); setEditedDetalles([...detalles]); }}
                                            disabled={isUpdating}
                                            className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-200 transition-colors shadow-sm"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
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
                                       {(isEditing ? editedDetalles : detalles).map((d, idx) => (
                                           <tr key={d.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                               <td className="p-4 text-center">
                                                   {isEditing ? (
                                                       <button 
                                                           onClick={() => {
                                                               const newDetalles = [...editedDetalles];
                                                               newDetalles.splice(idx, 1);
                                                               setEditedDetalles(newDetalles);
                                                           }}
                                                           className="text-slate-300 hover:text-rose-500 font-black flex items-center justify-center w-8 h-8 rounded-full hover:bg-rose-50 mx-auto transition-colors"
                                                           title="Eliminar Ítem"
                                                       >
                                                           X
                                                       </button>
                                                   ) : (
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
                                                   )}
                                               </td>
                                               <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                  {d.producto_nombre} <span className="text-slate-500 font-medium">({d.nombre_variante})</span>
                                               </td>
                                               <td className="p-4 text-center font-black">
                                                   {isEditing ? (
                                                       <input 
                                                           type="number"
                                                           min="1"
                                                           step="0.01"
                                                           value={d.cantidad}
                                                           onChange={(e) => {
                                                               const newDetalles = [...editedDetalles];
                                                               newDetalles[idx].cantidad = Number(e.target.value);
                                                               setEditedDetalles(newDetalles);
                                                           }}
                                                           className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded outline-none text-center focus:border-indigo-400 dark:focus:border-indigo-500"
                                                       />
                                                   ) : d.cantidad}
                                               </td>
                                               <td className="p-4 text-right font-medium text-slate-400 hidden sm:table-cell">
                                                   {isEditing ? (
                                                       <input 
                                                           type="number"
                                                           min="0"
                                                           step="0.01"
                                                           value={d.precio_unitario}
                                                           onChange={(e) => {
                                                               const newDetalles = [...editedDetalles];
                                                               newDetalles[idx].precio_unitario = Number(e.target.value);
                                                               setEditedDetalles(newDetalles);
                                                           }}
                                                           className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded outline-none text-right focus:border-indigo-400 dark:focus:border-indigo-500"
                                                       />
                                                   ) : `${compra.moneda_simbolo || '$'}${Number(d.precio_unitario).toFixed(2)}`}
                                               </td>
                                               <td className="p-4 text-right font-bold text-indigo-600 hidden sm:table-cell">
                                                   {isEditing ? '-' : `${compra.moneda_simbolo || '$'}${d.costo_puesto_local ? Number(d.costo_puesto_local).toFixed(2) : Number(d.precio_unitario).toFixed(2)}`}
                                               </td>
                                               <td className="p-4 text-right font-black text-emerald-600">
                                                   {compra.moneda_simbolo || '$'}{(d.precio_unitario * d.cantidad).toFixed(2)}
                                               </td>
                                           </tr>
                                       ))}
                                       {isEditing && editedDetalles.length === 0 && (
                                           <tr>
                                               <td colSpan={6} className="p-4 text-center text-slate-400 font-bold py-8">La compra quedará vacía. Agrega artículos u elimina la compra desde otra vista.</td>
                                           </tr>
                                       )}
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
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                              <h4 className="font-black text-slate-800 dark:text-white text-lg">Progreso Logístico</h4>
                              <div className="flex items-center gap-1.5">
                                  <Workflow className="w-3.5 h-3.5 text-indigo-500" />
                                  <select
                                      disabled={isUpdating || compra.importacion_id !== null}
                                      value={selectedPlantillaId}
                                      onChange={e => handleReplaceTemplate(Number(e.target.value))}
                                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 dark:text-white outline-none cursor-pointer shadow-sm"
                                      title={compra.importacion_id ? "Heredado del expediente de importación" : "Cambiar plantilla"}
                                  >
                                      {plantillas.map(p => (
                                          <option key={p.id} value={p.id}>{p.nombre}</option>
                                      ))}
                                  </select>
                              </div>
                           </div>
                           
                           {loadingTemplate ? (
                               <div className="flex justify-center items-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                           ) : (
                               <div className="flex flex-col gap-1 relative pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                   {currentTemplateSteps.map((step, idx) => {
                                       const isCompleted = currentStepIndex >= idx;
                                       const isCurrent = currentStepIndex === idx;
                                       const Icon = (LucideIcons as any)[step.icono] || LucideIcons.Package;
                                       return (
                                           <div key={step.clave} className="relative py-3 flex items-center justify-between group">
                                               <div className={cn("absolute -left-[25px] w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 transition-colors", isCompleted ? "border-emerald-500 bg-emerald-500" : "border-slate-300 dark:border-slate-600")} />
                                               <div className="flex items-center gap-3">
                                                   <Icon className={cn("w-5 h-5", isCompleted ? "text-emerald-600" : "text-slate-400")} />
                                                   <span className={cn("font-bold", isCurrent ? "text-emerald-700 dark:text-emerald-400" : (isCompleted ? "text-slate-700 dark:text-slate-200" : "text-slate-400"))}>{step.etiqueta}</span>
                                               </div>
                                               
                                               {compra.estado !== 'pre-compra' && !isCurrent && (
                                                   <button 
                                                       disabled={isUpdating}
                                                       onClick={() => updateProgreso(step.clave)} 
                                                       className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-all shadow-sm"
                                                   >
                                                       Marcar
                                                   </button>
                                               )}
                                           </div>
                                       );
                                   })}
                               </div>
                           )}
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
                                           const stepRes = await executeAWSQuery(`
                                               SELECT TOP 1 clave FROM Stock_Plantillas_Progreso_Pasos 
                                               WHERE plantilla_id = ${compra.plantilla_progreso_id || 1} 
                                               ORDER BY orden ASC
                                           `);
                                           let firstStepKey = 'realizada';
                                           if (stepRes && stepRes.length > 0) {
                                               firstStepKey = stepRes[0].clave;
                                           }
                                           await executeAWSQuery(`UPDATE Stock_Compras SET estado = 'pendiente', progreso = '${firstStepKey}' WHERE id = '${compra.id}'`);
                                           toast.success("Compra confirmada!");
                                           onUpdate();
                                           setIsUpdating(false);
                                       }}
                                       disabled={isUpdating}
                                       className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors shadow-sm"
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



