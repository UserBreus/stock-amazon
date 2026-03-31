import { useState, useEffect } from 'react';
import { Truck, Anchor, Plane, MapPin, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';

export function Importaciones() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
    
    const channel = supabase
      .channel('importaciones_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'importaciones' },
        () => {
          fetchShipments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShipments = async () => {
    const { data } = await supabase.from('importaciones').select('*').order('fecha_creacion', { ascending: false });
    if (data) setShipments(data);
    setLoading(false);
  };

  const filteredShipments = shipments.filter(s => 
    s.id.toLowerCase().includes(filter.toLowerCase()) || 
    s.origen.toLowerCase().includes(filter.toLowerCase()) ||
    s.transportista.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-blue-950 dark:text-white tracking-tighter">Importaciones Activas</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Monitoreo de carga internacional y trazabilidad.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full md:w-64 focus-within:border-blue-500 transition-colors">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-medium" 
              placeholder="Buscar envío u origen..." 
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card-nexus overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/30">
          <h3 className="font-black text-blue-950 dark:text-white tracking-tight">Cargamentos en Red</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-900">
                <th className="px-8 py-5">Identificador</th>
                <th className="px-8 py-5">Ruta</th>
                <th className="px-8 py-5">Transportista</th>
                <th className="px-8 py-5">ETA</th>
                <th className="px-8 py-5">Progreso</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
              <AnimatePresence>
                {filteredShipments.map((shipment) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={shipment.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform",
                          shipment.type === 'ocean' ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50" : 
                          shipment.type === 'air' ? "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:border-sky-900/50" :
                          "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50"
                        )}>
                          {shipment.type === 'ocean' ? <Anchor className="w-6 h-6" /> : 
                           shipment.type === 'air' ? <Plane className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-black text-sm text-blue-950 dark:text-white tracking-tight">{shipment.id}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shipment.type} FREIGHT</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{shipment.origen}</span>
                        <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-800 relative">
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        </div>
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-400">{shipment.destino}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{shipment.transportista}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-blue-950 dark:text-white">{new Date(shipment.eta).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
                    </td>
                    <td className="px-8 py-6 w-48">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">Progreso</span>
                          <span className="text-blue-600 dark:text-blue-400">{shipment.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${shipment.progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        shipment.progress === 100 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : 
                        shipment.progress > 80 ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                      )}>
                        {shipment.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                    No se encontraron importaciones activas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
