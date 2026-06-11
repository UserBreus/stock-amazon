import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe2, Building2, Truck, Box, Package, Factory, Anchor, Ship, MapPin, CheckCircle2, Loader2, CreditCard, Plus, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
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

export function ImportacionDetalleModal({ isOpen, onClose, importacion, onUpdate }: Props) {
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<number>(1);
  const [currentTemplateSteps, setCurrentTemplateSteps] = useState<any[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Pagos
  const [pagos, setPagos] = useState<any[]>([]);
  const [pagoMontoInput, setPagoMontoInput] = useState('');
  const [pagoTipoInput, setPagoTipoInput] = useState('Seña del 50%');
  const [pagoMotivoInput, setPagoMotivoInput] = useState('');
  const [pagoDestinoInput, setPagoDestinoInput] = useState('gastos');
  const [showPagosModal, setShowPagosModal] = useState(false);
  const [motivosList, setMotivosList] = useState<string[]>([]);
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && importacion) {
        fetchComprasDetalle();
        fetchMotivos();
        const platId = importacion.plantilla_progreso_id || 1;
        setSelectedPlantillaId(platId);
        fetchPlantillasAndSteps(platId);
    }
  }, [isOpen, importacion]);

  const fetchMotivos = async () => {
      try {
          const res = await executeAWSQuery("SELECT nombre FROM Stock_Pagos_Motivos ORDER BY nombre ASC");
          if (res) {
              setMotivosList(res.map((r: any) => r.nombre));
          }
      } catch(e) {
          console.error("Error loading motives:", e);
      }
  };

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
      if (isUpdating || !importacion) return;
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

          const q = `
             UPDATE Stock_Importaciones 
             SET plantilla_progreso_id = ${newPlantillaId}, 
                 progreso = '${firstStepKey.replace(/'/g, "''")}' 
             WHERE id = '${importacion.id}';

             UPDATE Stock_Compras 
             SET plantilla_progreso_id = ${newPlantillaId}, 
                 progreso = '${firstStepKey.replace(/'/g, "''")}' 
             WHERE importacion_id = '${importacion.id}';
          `;
          await executeAWSQuery(q);
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

  const fetchComprasDetalle = async () => {
     setLoading(true);
     try {
         const q = `
            SELECT 
                c.id, c.referencia_factura, c.fecha_creacion, c.total_compra, c.gastos_extras,
                prov.nombre as proveedor_nombre,
                ISNULL(SUM(d.cantidad), 0) as total_unidades
            FROM Stock_Compras c
            LEFT JOIN Stock_Proveedores prov ON c.proveedor_id = prov.id
            LEFT JOIN Stock_Compras_Detalle d ON c.id = d.compra_id
            WHERE c.importacion_id = '${importacion.id}'
            GROUP BY c.id, c.referencia_factura, c.fecha_creacion, c.total_compra, c.gastos_extras, prov.nombre
         `;
         const qPagos = `SELECT * FROM Stock_Pagos WHERE importacion_id = '${importacion.id}' ORDER BY fecha ASC`;
         
         const [res, resPagos] = await Promise.all([
             executeAWSQuery(q),
             executeAWSQuery(qPagos)
         ]);
         setCompras(res || []);
         setPagos(resPagos || []);
     } catch(e:any) {
         toast.error("Error cargando compras asociadas y pagos: " + e.message);
     } finally {
         setLoading(false);
     }
  };

  const registrarPago = async () => {
      if(!pagoMontoInput) return toast.error('Ingresa el monto del pago.');
      const m = parseFloat(pagoMontoInput);
      if(isNaN(m) || m <= 0) return toast.error('El monto debe ser un número mayor a cero.');
      
      setIsUpdating(true);
      try {
          const compraIdVal = pagoDestinoInput === 'gastos' ? 'NULL' : `'${pagoDestinoInput}'`;
          await executeAWSQuery(`
              INSERT INTO Stock_Pagos (compra_id, importacion_id, monto, tipo_pago, motivo)
              VALUES (${compraIdVal}, '${importacion.id}', ${m}, '${pagoTipoInput.replace(/'/g, "''")}', ${pagoMotivoInput ? `'${pagoMotivoInput.replace(/'/g, "''")}'` : 'NULL'});
          `);
          toast.success('Pago registrado correctamente.');
          setPagoMontoInput('');
          setPagoMotivoInput('');
          await fetchComprasDetalle();
          onUpdate();
      } catch(e: any) {
          toast.error('Error al registrar pago: ' + e.message);
      } finally {
          setIsUpdating(false);
      }
  };

  const eliminarPago = async (pagoId: number) => {
      if(!window.confirm('¿Seguro que deseas eliminar este pago?')) return;
      setIsUpdating(true);
      try {
          await executeAWSQuery(`DELETE FROM Stock_Pagos WHERE id = ${pagoId}`);
          toast.success('Pago eliminado correctamente.');
          await fetchComprasDetalle();
          onUpdate();
      } catch(e: any) {
          toast.error('Error al eliminar pago: ' + e.message);
      } finally {
          setIsUpdating(false);
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

  const totalCompras = compras.reduce((acc, c) => acc + Number(c.total_compra || 0) + Number(c.gastos_extras || 0), 0);
  const pagosACompras = pagos.filter(p => p.compra_id !== null);
  const totalPagadoCompras = pagosACompras.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const pagosGastosImp = pagos.filter(p => p.compra_id === null);
  const totalPagadoGastosImp = pagosGastosImp.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const saldoPendienteCompras = totalCompras - totalPagadoCompras;

  if (!isOpen || !importacion) return null;

  const currentStepIndex = currentTemplateSteps.findIndex(s => s.clave === importacion.progreso);

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

                  {/* Resumen de Pagos en Panel Principal */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                      <div className="flex justify-between items-center pb-2">
                          <div>
                              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                 <CreditCard className="w-4 h-4 text-indigo-500" />
                                 Estado de Pagos
                              </h3>
                              <p className="text-[11px] text-slate-400 font-medium">Resumen consolidado de la importación</p>
                          </div>
                          <button
                              onClick={() => setShowPagosModal(true)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                          >
                              <CreditCard className="w-3.5 h-3.5" />
                              Gestionar Pagos
                          </button>
                      </div>
                      
                      {/* Resumen Financiero de la Importación */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <div className="text-center">
                              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Total Compras</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-300 mt-1">
                                  {formatCurrency(totalCompras, 'USD')}
                              </p>
                          </div>
                          <div className="text-center border-l border-slate-100 dark:border-slate-800">
                              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider font-semibold">Pagado Órdenes</p>
                              <p className="text-sm font-black text-emerald-600 mt-1">
                                  {formatCurrency(totalPagadoCompras, 'USD')}
                              </p>
                          </div>
                          <div className="text-center border-l border-slate-100 dark:border-slate-800">
                              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider font-semibold">Gtos. Importación</p>
                              <p className="text-sm font-black text-indigo-600 mt-1">
                                  {formatCurrency(totalPagadoGastosImp, 'USD')}
                              </p>
                          </div>
                          <div className="text-center border-l border-slate-100 dark:border-slate-800">
                              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider font-semibold">Pendiente Órdenes</p>
                              <p className={cn("text-sm font-black mt-1", saldoPendienteCompras <= 0 ? "text-emerald-600" : "text-amber-500")}>
                                  {formatCurrency(saldoPendienteCompras, 'USD')}
                              </p>
                          </div>
                      </div>
                  </div>

               </div>
              
              {/* DERECHA: SEGUIMIENTO LOGISTICO GLOBAL */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 relative">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                          <h3 className="font-black text-sm text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                             <Anchor className="w-4 h-4"/> Progreso Logístico Global
                          </h3>
                          <p className="text-xs font-bold text-slate-500 mt-1">Este carril controla y actualiza todas las compras vinculadas al unísono.</p>
                      </div>
                      <div className="w-full md:w-auto shrink-0 flex items-center gap-2">
                          <LucideIcons.Workflow className="w-4 h-4 text-indigo-500 animate-pulse" />
                          <select 
                              disabled={isUpdating}
                              value={selectedPlantillaId}
                              onChange={e => handleReplaceTemplate(Number(e.target.value))}
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
                          >
                              {plantillas.map(p => (
                                  <option key={p.id} value={p.id}>{p.nombre}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <div className="p-8">
                      {loadingTemplate ? (
                          <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                      ) : (
                          <div className="relative">
                              {/* Línea base inactiva */}
                              <div className="absolute left-[23px] top-6 bottom-6 w-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                              {/* Línea pintada activa */}
                              <div 
                                  className="absolute left-[23px] top-6 w-1 bg-indigo-500 rounded-full transition-all duration-700 ease-out" 
                                  style={{ height: `calc(${Math.max(0, currentStepIndex) / Math.max(1, currentTemplateSteps.length - 1) * 100}% - 12px)` }}
                              ></div>
                              
                              <div className="space-y-8 relative">
                                  {currentTemplateSteps.map((step, idx) => {
                                      const isCompleted = currentStepIndex >= idx;
                                      const isCurrent = currentStepIndex === idx;
                                      const Icon = (LucideIcons as any)[step.icono] || LucideIcons.Package;
                                      return (
                                          <div key={step.clave} className="flex flex-col items-start gap-3 relative group">
                                             <div className="flex items-center gap-4 w-full">
                                                <button 
                                                    disabled={isUpdating}
                                                    onClick={() => handleUpdateProgress(step.clave)}
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
                                                        {step.etiqueta}
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
                      )}
                  </div>
              </div>

           </div>
        {/* Sub-modal emergente para la gestión de pagos */}
        <Modal
            isOpen={showPagosModal}
            onClose={() => setShowPagosModal(false)}
            title={`Gestión de Pagos: Expediente ${importacion.origen}`}
            maxWidth="max-w-4xl"
        >
            <div className="space-y-6">
                {/* Resumen Financiero de la Importación */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm font-medium">
                    <div className="text-center">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Total Compras</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 mt-1">
                            {formatCurrency(totalCompras, 'USD')}
                        </p>
                    </div>
                    <div className="text-center border-l border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider font-semibold">Pagado Órdenes</p>
                        <p className="text-sm font-black text-emerald-600 mt-1">
                            {formatCurrency(totalPagadoCompras, 'USD')}
                        </p>
                    </div>
                    <div className="text-center border-l border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider font-semibold font-semibold">Gtos. Importación</p>
                        <p className="text-sm font-black text-indigo-600 mt-1">
                            {formatCurrency(totalPagadoGastosImp, 'USD')}
                        </p>
                    </div>
                    <div className="text-center border-l border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Pendiente Órdenes</p>
                        <p className={cn("text-sm font-black mt-1", saldoPendienteCompras <= 0 ? "text-emerald-600" : "text-amber-500")}>
                            {formatCurrency(saldoPendienteCompras, 'USD')}
                        </p>
                    </div>
                </div>

                {/* Registrar nuevo pago */}
                <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Registrar Pago en Importación</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="text-[9px] font-bold uppercase text-slate-400 pl-1 block mb-1">Monto</label>
                            <input 
                                type="number"
                                step="0.01"
                                placeholder="Monto"
                                className="input-nexus w-full text-xs py-2 px-3"
                                value={pagoMontoInput}
                                onChange={e => setPagoMontoInput(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[9px] font-bold uppercase text-slate-400 pl-1 block mb-1">Motivo</label>
                            <div className="flex gap-1.5">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Seleccione o escriba..."
                                        className="input-nexus w-full text-xs py-2 px-3 pr-8"
                                        value={pagoTipoInput}
                                        onChange={e => {
                                            setPagoTipoInput(e.target.value);
                                            setIsOpenDropdown(true);
                                        }}
                                        onFocus={() => setIsOpenDropdown(true)}
                                        onBlur={() => {
                                            setTimeout(() => setIsOpenDropdown(false), 200);
                                        }}
                                    />
                                    {isOpenDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-55 divide-y divide-slate-100 dark:divide-slate-850">
                                            {motivosList
                                                .filter(m => m.toLowerCase().includes(pagoTipoInput.toLowerCase()))
                                                .map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-800 dark:text-slate-200 font-medium"
                                                        onMouseDown={() => {
                                                            setPagoTipoInput(m);
                                                        }}
                                                    >
                                                        {m}
                                                    </button>
                                                ))
                                            }
                                            {motivosList.filter(m => m.toLowerCase().includes(pagoTipoInput.toLowerCase())).length === 0 && (
                                                <p className="p-2 text-center text-[10px] text-slate-400 italic">No hay coincidencias</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const val = window.prompt("Ingrese el nombre del nuevo motivo de pago:");
                                        if (val && val.trim()) {
                                            try {
                                                await executeAWSQuery(`INSERT INTO Stock_Pagos_Motivos (nombre) VALUES ('${val.trim().replace(/'/g, "''")}')`);
                                                toast.success("Motivo guardado.");
                                                const res = await executeAWSQuery("SELECT nombre FROM Stock_Pagos_Motivos ORDER BY nombre ASC");
                                                if (res) {
                                                    setMotivosList(res.map((r: any) => r.nombre));
                                                    setPagoTipoInput(val.trim());
                                                }
                                            } catch (e: any) {
                                                toast.error("Error al guardar: " + e.message);
                                            }
                                        }
                                    }}
                                    className="px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition font-black text-xs"
                                    title="Crear nuevo motivo"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold uppercase text-slate-400 pl-1 block mb-1">Destino</label>
                            <select
                                className="input-nexus w-full text-xs py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none cursor-pointer"
                                value={pagoDestinoInput}
                                onChange={e => setPagoDestinoInput(e.target.value)}
                            >
                                <option value="gastos">Gastos Importación (Gral.)</option>
                                {compras.map(c => (
                                    <option key={c.id} value={c.id}>Orden: {c.referencia_factura || 'Sin Ref'}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[9px] font-bold uppercase text-slate-400 pl-1 block mb-1">Detalle / Explicación</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    placeholder="Concepto..."
                                    className="input-nexus flex-1 text-xs py-2 px-3"
                                    value={pagoMotivoInput}
                                    onChange={e => setPagoMotivoInput(e.target.value)}
                                />
                                <button 
                                    disabled={isUpdating}
                                    onClick={registrarPago}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Grabar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Listado de Pagos de la Importación */}
                <div className="space-y-2">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Historial de Pagos de la Importación</p>
                    {pagos.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-xl">
                            No hay pagos registrados para esta importación.
                        </p>
                    ) : (
                        <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 max-h-[30vh] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800 sticky top-0">
                                    <tr>
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3">Destino</th>
                                        <th className="p-3">Tipo</th>
                                        <th className="p-3">Detalle</th>
                                        <th className="p-3 text-right">Monto</th>
                                        <th className="p-3 w-10 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {pagos.map(p => {
                                        const compraAsoc = compras.find(c => c.id === p.compra_id);
                                        const destinoNombre = compraAsoc ? `Orden: ${compraAsoc.referencia_factura}` : 'Gastos Importación';
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="p-3 text-slate-500 font-medium">{new Date(p.fecha).toLocaleDateString()}</td>
                                                <td className="p-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide",
                                                        p.compra_id ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" : "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                                                    )}>
                                                        {destinoNombre}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-bold text-[9px] uppercase tracking-wide">
                                                        {p.tipo_pago}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{p.motivo || '-'}</td>
                                                <td className="p-3 text-right font-black text-emerald-600">{formatCurrency(p.monto, 'USD')}</td>
                                                <td className="p-3 text-center">
                                                    <button 
                                                        disabled={isUpdating}
                                                        onClick={() => eliminarPago(p.id)}
                                                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                                                        title="Eliminar Pago"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-3">
                    <button 
                        onClick={() => setShowPagosModal(false)} 
                        className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl border border-slate-200 transition-colors shadow-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
