import React, { useState, useEffect } from 'react';
import { executeAWSQuery } from '../lib/aws-client';
import toast from 'react-hot-toast';
import { Truck, Calculator, Coins, CheckCircle, Search, PlaneTakeoff, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '../lib/utils';

export function GestionImportaciones() {
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompra, setSelectedCompra] = useState<any | null>(null);
  
  const [gastos, setGastos] = useState<string>('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchCompras();
  }, []);

  const fetchCompras = async () => {
    setLoading(true);
    try {
      const q = `
        SELECT 
            c.id, c.referencia_factura, c.fecha_creacion, c.gastos_extras, c.total_compra,
            prov.nombre as proveedor_nombre,
            ISNULL(SUM(d.cantidad), 0) as total_unidades
        FROM Stock_Compras c
        LEFT JOIN Stock_Proveedores prov ON c.proveedor_id = prov.id
        LEFT JOIN Stock_Compras_Detalle d ON c.id = d.compra_id
        GROUP BY c.id, c.referencia_factura, c.fecha_creacion, c.gastos_extras, c.total_compra, prov.nombre
        ORDER BY c.fecha_creacion DESC
      `;
      const res = await executeAWSQuery(q);
      setCompras(res || []);
    } catch (e: any) {
      toast.error('Error cargando órdenes de compra: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (compra: any) => {
    setSelectedCompra(compra);
    setGastos(compra.gastos_extras?.toString() || '0');
  };

  const handleAsignarGastos = async () => {
    if (!selectedCompra) return;
    const numGastos = parseFloat(gastos);
    if (isNaN(numGastos) || numGastos < 0) return toast.error('Ingresa un monto válido.');
    if (selectedCompra.total_unidades <= 0) return toast.error("La orden no tiene unidades asociadas para dividir el costo.");

    setCalculating(true);
    try {
        const costoExtraPorUnidad = numGastos / selectedCompra.total_unidades;

        // Script para DB
        const q = `
            -- 1. Asignamos gasto extra maestro
            UPDATE Stock_Compras SET gastos_extras = ${numGastos} WHERE id = '${selectedCompra.id}';

            -- 2. Propagamos a cada etiqueta el valor unitario base + el extra de importacion unitario
            UPDATE e
            SET e.costo_unitario_real = (ISNULL(d.precio_unitario, 0) + ${costoExtraPorUnidad})
            FROM Stock_Etiquetas e
            INNER JOIN Stock_Compras_Detalle d ON e.variante_id = d.variante_id AND d.compra_id = e.compra_id
            WHERE e.compra_id = '${selectedCompra.id}';
        `;

        await executeAWSQuery(q);
        toast.success(`Gastos de importación aplicados. Costo subió ${formatCurrency(costoExtraPorUnidad, 'USD')} por unidad.`);
        
        await fetchCompras();
        setSelectedCompra(null);
    } catch(e:any) {
        toast.error("Error aplicando distribución de costos: " + e.message);
    } finally {
        setCalculating(false);
    }
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center h-48">
              <div className="animate-spin text-blue-500"><Truck className="w-8 h-8" /></div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
          <PlaneTakeoff className="w-6 h-6" />
        </div>
        <div>
           <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">Gastos de Patrimonio e Importación</h2>
           <p className="text-sm font-bold text-slate-500">Distribuye gastos logísticos extras equitativamente por unidades.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {compras.map(c => (
                <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={cn(
                        "w-full card-nexus p-5 text-left border-2 transition-all flex items-center justify-between",
                        selectedCompra?.id === c.id ? "border-indigo-500 bg-indigo-50/10" : "border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <Box className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                Ref: {c.referencia_factura || 'S/Ref'}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 mt-1">
                                Prov: {c.proveedor_nombre} • {c.total_unidades} unidades
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(c.total_compra, 'USD')}</p>
                        {c.gastos_extras > 0 && <p className="text-xs font-bold text-rose-500">+ {formatCurrency(c.gastos_extras, 'USD')} Extra</p>}
                    </div>
                </button>
            ))}
            {compras.length === 0 && (
                <div className="text-center py-10 font-bold text-slate-400">No hay órdenes de compra registradas.</div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {selectedCompra && (
                <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} className="lg:col-span-1">
                    <div className="card-nexus p-6 sticky top-6">
                        <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-indigo-500" />
                            Aplicar Gastos a Orden
                        </h3>
                        
                        <div className="space-y-4">
                           <div>
                               <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Monto Gastos Extras (USD)</label>
                               <div className="relative mt-2">
                                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                  <input 
                                     type="number"
                                     value={gastos}
                                     onChange={e => setGastos(e.target.value)}
                                     placeholder="Ej: 500"
                                     className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-12 pr-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all"
                                  />
                               </div>
                           </div>
                           
                           <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                               <p className="text-sm font-bold text-slate-500">Unidades totales: <span className="text-slate-800 dark:text-slate-200">{selectedCompra.total_unidades}</span></p>
                               {parseFloat(gastos) > 0 && selectedCompra.total_unidades > 0 && (
                                   <p className="text-sm font-bold text-indigo-600 mt-2">
                                       +{formatCurrency(parseFloat(gastos) / selectedCompra.total_unidades, 'USD')} por unidad
                                   </p>
                               )}
                           </div>

                           <button 
                             onClick={handleAsignarGastos}
                             disabled={calculating}
                             className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-xl font-bold transition-all disabled:opacity-50"
                           >
                               {calculating ? 'Calculando...' : 'Guardar y Distribuir Costos'}
                           </button>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
      </div>
    </div>
  );
}
