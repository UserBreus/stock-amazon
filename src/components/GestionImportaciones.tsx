import React, { useState, useEffect } from 'react';
import { executeAWSQuery } from '../lib/aws-client';
import toast from 'react-hot-toast';
import { CheckCircle, Search, PlaneTakeoff, Globe2, Plus, Building2, Truck, Box, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '../lib/utils';
import { ImportacionesCreationModal } from './ui/ImportacionesCreationModal';
import { ImportacionDetalleModal } from './ui/ImportacionDetalleModal';

export function GestionImportaciones() {
  const [importaciones, setImportaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedImpId, setSelectedImpId] = useState<string | null>(null);
  const [selectedImp, setSelectedImp] = useState<any | null>(null);
  const [comprasDetalle, setComprasDetalle] = useState<any[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    fetchImportaciones();
  }, []);

  const fetchImportaciones = async () => {
    setLoading(true);
    try {
      const q = `
        SELECT 
            i.id, i.origen, i.empresa_importadora, i.contacto_importadora,
            i.empresa_transporte_local, i.contacto_transporte_local, i.estado, i.fecha_creacion,
            COUNT(c.id) as cantidad_compras
        FROM Stock_Importaciones i
        LEFT JOIN Stock_Compras c ON c.importacion_id = i.id
        GROUP BY i.id, i.origen, i.empresa_importadora, i.contacto_importadora,
                 i.empresa_transporte_local, i.contacto_transporte_local, i.estado, i.fecha_creacion
        ORDER BY i.fecha_creacion DESC
      `;
      const res = await executeAWSQuery(q);
      setImportaciones(res || []);
    } catch (e: any) {
      toast.error('Error cargando importaciones: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDetalle = async (id: string) => {
     setSelectedImpId(id);
     setLoadingDetalle(true);
     setComprasDetalle([]);
     try {
         const q = `
            SELECT 
                c.id, c.referencia_factura, c.fecha_creacion, c.total_compra,
                prov.nombre as proveedor_nombre,
                ISNULL(SUM(d.cantidad), 0) as total_unidades
            FROM Stock_Compras c
            LEFT JOIN Stock_Proveedores prov ON c.proveedor_id = prov.id
            LEFT JOIN Stock_Compras_Detalle d ON c.id = d.compra_id
            WHERE c.importacion_id = '${id}'
            GROUP BY c.id, c.referencia_factura, c.fecha_creacion, c.total_compra, prov.nombre
         `;
         const res = await executeAWSQuery(q);
         setComprasDetalle(res || []);
     } catch(e:any) {
         toast.error("Error cargando compras de la importación");
     } finally {
         setLoadingDetalle(false);
     }
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center h-48">
              <div className="animate-spin text-indigo-500"><PlaneTakeoff className="w-8 h-8" /></div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
            <PlaneTakeoff className="w-6 h-6" />
            </div>
            <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">Importaciones Consolidadas</h2>
            <p className="text-sm font-bold text-slate-500">Administra expedientes logísticos globales.</p>
            </div>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5"/> Crear Importación
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {importaciones.map(imp => (
                <div key={imp.id} className="card-nexus p-0 overflow-hidden flex flex-col sm:flex-row border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    
                    <div className="flex-1 p-6 flex items-start gap-4 cursor-pointer" onClick={() => setSelectedImp(imp)}>
                        <div className={cn("p-4 rounded-2xl flex items-center justify-center shrink-0 transition-colors", selectedImpId === imp.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                            <Globe2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                               <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{imp.origen}</h3>
                               <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] uppercase tracking-wider">{imp.estado}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building2 className="w-3 h-3"/> Importador</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{imp.empresa_importadora || '-'}</p>
                                    {imp.contacto_importadora && <p className="text-xs font-bold text-indigo-500 mt-1">{imp.contacto_importadora}</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Truck className="w-3 h-3"/> Trans. Local</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{imp.empresa_transporte_local || '-'}</p>
                                    {imp.contacto_transporte_local && <p className="text-xs font-bold text-emerald-500 mt-1">{imp.contacto_transporte_local}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-center items-center sm:items-end min-w-[150px] cursor-pointer" onClick={() => setSelectedImp(imp)}>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Compras Contenidas</p>
                         <p className="text-3xl font-black text-indigo-600 font-mono tracking-tighter">{imp.cantidad_compras}</p>
                    </div>
                </div>
            ))}
            {importaciones.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-[#0a101f] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <Globe2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4"/>
                    <h3 className="font-black text-slate-800 dark:text-slate-200">No hay importaciones registradas</h3>
                    <p className="text-slate-500 font-bold mt-2">Crea una para comenzar a vincular compras.</p>
                </div>
            )}
          </div>
      </div>

      <ImportacionesCreationModal 
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={fetchImportaciones}
      />

      <ImportacionDetalleModal 
          isOpen={selectedImp !== null}
          importacion={selectedImp}
          onClose={() => setSelectedImp(null)}
          onUpdate={() => {
              fetchImportaciones();
              setSelectedImp(null);
          }}
      />
    </div>
  );
}
