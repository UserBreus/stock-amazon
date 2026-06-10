import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe2, Building2, Truck, Save, ShoppingCart, Info, Loader2, Workflow } from 'lucide-react';
import { executeAWSQuery } from '../../lib/aws-client';
import toast from 'react-hot-toast';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportacionesCreationModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingCompras, setFetchingCompras] = useState(false);
  const [compras, setCompras] = useState<any[]>([]);

  // Campos Formulario
  const [origen, setOrigen] = useState('');
  const [empresaImportadora, setEmpresaImportadora] = useState('');
  const [contactoImportador, setContactoImportador] = useState('');
  const [empresaTransporte, setEmpresaTransporte] = useState('');
  const [contactoTransporte, setContactoTransporte] = useState('');
  const [selectedCompras, setSelectedCompras] = useState<Set<string>>(new Set());
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<number | ''>('');

  const fetchPlantillas = async () => {
      try {
          const res = await executeAWSQuery("SELECT id, nombre FROM Stock_Plantillas_Progreso ORDER BY nombre");
          setPlantillas(res || []);
          if (res && res.some((p: any) => p.id === 1)) {
              setSelectedPlantillaId(1);
          } else if (res && res.length > 0) {
              setSelectedPlantillaId(res[0].id);
          }
      } catch (e) {
          console.error("Error fetching plantillas:", e);
      }
  };

  useEffect(() => {
     if (isOpen) {
         fetchComprasLibres();
         fetchPlantillas();
         setSelectedCompras(new Set());
         setOrigen('');
         setEmpresaImportadora('');
         setContactoImportador('');
         setEmpresaTransporte('');
         setContactoTransporte('');
     }
  }, [isOpen]);

  const fetchComprasLibres = async () => {
      setFetchingCompras(true);
      try {
          const q = `
            SELECT 
                c.id, c.referencia_factura, c.fecha_creacion, c.total_compra,
                prov.nombre as proveedor_nombre,
                ISNULL(SUM(d.cantidad), 0) as total_unidades
            FROM Stock_Compras c
            LEFT JOIN Stock_Proveedores prov ON c.proveedor_id = prov.id
            LEFT JOIN Stock_Compras_Detalle d ON c.id = d.compra_id
            WHERE c.importacion_id IS NULL AND c.estado != 'completada'
            GROUP BY c.id, c.referencia_factura, c.fecha_creacion, c.total_compra, prov.nombre
            ORDER BY c.fecha_creacion DESC
          `;
          const res = await executeAWSQuery(q);
          setCompras(res || []);
      } catch (e: any) {
          toast.error("Error cargando compras disponibles: " + e.message);
      } finally {
          setFetchingCompras(false);
      }
  };

  const toggleCompra = (id: string) => {
      const next = new Set(selectedCompras);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedCompras(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!origen) return toast.error("El origen es requerido");
      if (selectedCompras.size === 0) return toast.error("Debes seleccionar al menos una compra para la importación");

      setLoading(true);
      try {
          const newId = crypto.randomUUID();
          
          // Obtener el primer paso de la plantilla seleccionada
          let firstStepKey = 'realizada';
          if (selectedPlantillaId) {
              const stepRes = await executeAWSQuery(`
                  SELECT TOP 1 clave FROM Stock_Plantillas_Progreso_Pasos 
                  WHERE plantilla_id = ${selectedPlantillaId} 
                  ORDER BY orden ASC
              `);
              if (stepRes && stepRes.length > 0) {
                  firstStepKey = stepRes[0].clave;
              }
          }

          const insertImp = `
            INSERT INTO Stock_Importaciones (
                id, origen, empresa_importadora, contacto_importadora,
                empresa_transporte_local, contacto_transporte_local, creado_por,
                plantilla_progreso_id, progreso
            ) VALUES (
                '${newId}',
                '${origen.replace(/'/g, "''")}',
                '${empresaImportadora.replace(/'/g, "''")}',
                '${contactoImportador.replace(/'/g, "''")}',
                '${empresaTransporte.replace(/'/g, "''")}',
                '${contactoTransporte.replace(/'/g, "''")}',
                '${user?.usuario || 'Sistema'}',
                ${selectedPlantillaId || 'NULL'},
                '${firstStepKey.replace(/'/g, "''")}'
            );
          `;
          await executeAWSQuery(insertImp);

          // Update compras
          const idList = Array.from(selectedCompras).map(id => `'${id}'`).join(',');
          const updateCompras = `
            UPDATE Stock_Compras 
            SET importacion_id = '${newId}',
                plantilla_progreso_id = ${selectedPlantillaId || 'NULL'},
                progreso = '${firstStepKey.replace(/'/g, "''")}' 
            WHERE id IN (${idList});
          `;
          await executeAWSQuery(updateCompras);

          toast.success("Importación planificada con éxito");
          onSuccess();
          onClose();
      } catch(e:any) {
          toast.error("Error al crear importación: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                 <Globe2 className="w-6 h-6 text-indigo-500" />
                 Crear Expediente de Importación
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-1">Registra la entidad logística e introduce las compras que viajan en ella.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
             
             {/* Left Column: Form */}
             <div className="flex-[1.2] p-6 space-y-6">
                 
                 <div>
                    <h3 className="font-black text-sm text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Globe2 className="w-4 h-4"/> Logística y Origen
                    </h3>
                    <div className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Puerto / País de Origen *</label>
                             <input required value={origen} onChange={e => setOrigen(e.target.value)} placeholder="Ej: Shanghái, China" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all"/>
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Workflow className="w-3 h-3 text-indigo-500"/> Plantilla de Progreso *
                             </label>
                             <select 
                                required 
                                value={selectedPlantillaId} 
                                onChange={e => setSelectedPlantillaId(e.target.value ? Number(e.target.value) : '')} 
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all cursor-pointer"
                             >
                                {plantillas.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} {p.id === 1 ? '(Nativa)' : ''}
                                    </option>
                                ))}
                             </select>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Building2 className="w-3 h-3"/> Empresa Importadora</label>
                              <input value={empresaImportadora} onChange={e => setEmpresaImportadora(e.target.value)} placeholder="Agencia o Forwarder" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all"/>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contacto Importadora</label>
                              <input value={contactoImportador} onChange={e => setContactoImportador(e.target.value)} placeholder="Teléfono / Email" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all"/>
                           </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-2">
                    <h3 className="font-black text-sm text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Truck className="w-4 h-4"/> Transporte Terrestre Local
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Building2 className="w-3 h-3"/> Empresa Transporte</label>
                          <input value={empresaTransporte} onChange={e => setEmpresaTransporte(e.target.value)} placeholder="Transportista local" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500 transition-all"/>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contacto Transporte</label>
                          <input value={contactoTransporte} onChange={e => setContactoTransporte(e.target.value)} placeholder="Teléfono del chofer" className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500 transition-all"/>
                       </div>
                    </div>
                 </div>

             </div>

             {/* Right Column: Checkboxes */}
             <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                 <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-black text-sm text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                       <ShoppingCart className="w-4 h-4"/> Seleccionar Compras
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Selecciona las compras activas que componen este envío.</p>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                     {fetchingCompras ? (
                         <div className="flex justify-center items-center h-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin"/></div>
                     ) : compras.length === 0 ? (
                         <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                             <Info className="w-8 h-8 text-slate-300 mx-auto mb-3"/>
                             <p className="font-bold text-slate-500">No hay compras activas libres.</p>
                         </div>
                     ) : (
                         <div className="space-y-3">
                             {compras.map(c => (
                                 <button
                                     key={c.id}
                                     type="button"
                                     onClick={() => toggleCompra(c.id)}
                                     className={cn(
                                         "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3",
                                         selectedCompras.has(c.id) ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-300"
                                     )}
                                 >
                                     <div className={cn("w-5 h-5 mt-0.5 rounded flex items-center justify-center shrink-0 border-2 transition-colors", selectedCompras.has(c.id) ? "bg-indigo-500 border-indigo-500" : "border-slate-300 dark:border-slate-600")}>
                                        {selectedCompras.has(c.id) && <motion.div initial={{scale:0}} animate={{scale:1}} className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                     </div>
                                     <div className="flex-1">
                                         <p className="font-black text-slate-800 dark:text-slate-200 leading-tight">Ref: {c.referencia_factura || 'Sin Referencia'}</p>
                                         <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{c.proveedor_nombre || 'Proveedor NS'} • {c.total_unidades} Unds</p>
                                     </div>
                                     <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                         {formatCurrency(c.total_compra, 'USD')}
                                     </div>
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>
             </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex justify-between items-center">
             <div className="font-black text-sm text-slate-500">
                 {selectedCompras.size} compras asociadas
             </div>
             <div className="flex gap-3">
               <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
               <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 rounded-xl font-black bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Planificar Importación
               </button>
             </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
