import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Download, AlertTriangle, Clock, Package, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Producto, Etiqueta } from '../types';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { darkMode } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWmsData();
    fetchMetricas();

    const channel1 = supabase.channel('dash_prod').on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, fetchWmsData).subscribe();
    const channel2 = supabase.channel('dash_etiq').on('postgres_changes', { event: '*', schema: 'public', table: 'etiquetas' }, fetchWmsData).subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, []);

  const fetchWmsData = async () => {
    try {
      const [prodRes, etiqRes] = await Promise.all([
        supabase.from('productos').select('*'),
        supabase.from('etiquetas').select('*').eq('estado', 'activo')
      ]);
      if (prodRes.data) setProductos(prodRes.data as Producto[]);
      if (etiqRes.data) setEtiquetas(etiqRes.data as Etiqueta[]);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricas = async () => {
    const { data } = await supabase.from('dashboard_metricas').select('*');
    if (data) setMetricas(data);
  };

  // Compute metrics from relational WMS data
  const totalCapital = productos.reduce((acc, prod) => {
    const qty = etiquetas.filter(e => e.producto_id === prod.id).reduce((sum, e) => sum + Number(e.cantidad_actual), 0);
    return acc + (qty * prod.costo);
  }, 0);

  const totalActivos = etiquetas.reduce((sum, e) => sum + Number(e.cantidad_actual), 0);
  const stockOuts = productos.filter(p => etiquetas.filter(e => e.producto_id === p.id).length === 0).length;

  const chartData = metricas.length > 0 
    ? metricas.map(m => ({ name: m.mes, envios: m.envios }))
    : [
        { name: 'Ene', envios: 0 },
        { name: 'Feb', envios: 0 },
        { name: 'Mar', envios: 0 },
      ];

  const stats = [
    { title: 'Capital Activo', value: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(totalCapital), trend: 'Móvil', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Quiebres (Sin Stock)', value: `${stockOuts} SKUs`, trend: 'Crítico', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { title: 'Items en Circulación', value: `${totalActivos} Uds`, trend: 'Operativo', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Catálogo SKUs', value: productos.length.toString(), trend: 'Global', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-blue-950 dark:text-white tracking-tighter">Dashboard Global</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Control operativo y métricas de rendimiento en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Calendar className="w-4 h-4" /> Últimos 30 días
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-nexus p-8"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg", stat.bg, stat.color)}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
            <h3 className="text-2xl font-black text-blue-950 dark:text-white tracking-tighter truncate">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-nexus p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-blue-950 dark:text-white tracking-tight">Volumen de Operaciones</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <span className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase">Envíos</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={darkMode ? "#3b82f6" : "#1e3a8a"} stopOpacity={1} />
                    <stop offset="100%" stopColor={darkMode ? "#1d4ed8" : "#3b82f6"} stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    fontWeight: 700,
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                    color: darkMode ? '#f8fafc' : '#0f172a'
                  }}
                />
                <Bar dataKey="envios" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card-nexus p-8">
          <h3 className="text-xl font-black text-blue-950 dark:text-white tracking-tight mb-8">Alertas de Red</h3>
          <div className="space-y-6">
            {[
              { id: 'AL-902', type: 'Crítica', msg: 'Retraso en Puerto de Valencia', time: '12m ago', color: 'bg-red-500' },
              { id: 'AL-881', type: 'Advertencia', msg: 'Bajo stock en Almacén Central', time: '45m ago', color: 'bg-amber-500' },
              { id: 'AL-772', type: 'Info', msg: 'Nueva ruta optimizada: Madrid-Lisboa', time: '2h ago', color: 'bg-blue-500' },
              { id: 'AL-650', type: 'Crítica', msg: 'Falla en sensor de temperatura C-4', time: '5h ago', color: 'bg-red-500' },
            ].map((alert) => (
              <div key={alert.id} className="flex gap-4 group cursor-pointer">
                <div className={cn("w-1 h-12 rounded-full shrink-0", alert.color)}></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{alert.id}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">•</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{alert.time}</span>
                  </div>
                  <p className="text-sm font-bold text-blue-950 dark:text-white group-hover:text-blue-600 transition-colors">{alert.msg}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
            Ver todas las alertas
          </button>
        </div>
      </div>
    </div>
  );
}
