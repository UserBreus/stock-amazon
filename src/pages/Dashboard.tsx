import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Download, AlertTriangle, Clock, Package, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { executeAWSQuery } from '../lib/aws-client';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { darkMode } = useAuth();
  const [stockConsolidado, setStockConsolidado] = useState<any[]>([]);
  const [capitalActivo, setCapitalActivo] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWmsData();
    const interval = setInterval(fetchWmsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWmsData = async () => {
    try {
      const [capRes, stockRes, metricasRes] = await Promise.all([
        executeAWSQuery("SELECT * FROM Vista_Capital_Activo"),
        executeAWSQuery("SELECT * FROM Vista_Stock_Actual"),
        executeAWSQuery("SELECT TOP 6 CONVERT(date, fecha) as dia, COUNT(*) as envios FROM Stock_Movimientos WHERE tipo_movimiento = 'consumo' GROUP BY CONVERT(date, fecha) ORDER BY dia DESC")
      ]);
      setCapitalActivo(capRes);
      setStockConsolidado(stockRes);
      setMetricas(metricasRes.reverse());
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalCapitalUSD = capitalActivo.find(c => c.moneda === 'USD')?.capital_total || 0;
  const qtyActivos = stockConsolidado.filter(p => p.cantidad_total > 0).length;
  const qtyInactivos = stockConsolidado.filter(p => !p.cantidad_total || p.cantidad_total === 0).length;
  const itemsEnCirculacion = stockConsolidado.reduce((acc, p) => acc + (p.cantidad_total || 0), 0);

  const chartData = metricas.length > 0 
    ? metricas.map(m => ({ name: new Date(m.dia).toLocaleDateString('es-ES', {weekday: 'short'}), envios: m.envios }))
    : [
        { name: 'Lun', envios: 0 },
        { name: 'Mar', envios: 0 },
        { name: 'Mie', envios: 0 },
        { name: 'Jue', envios: 0 },
      ];

  const stats = [
    { title: 'Capital Activo (USD)', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCapitalUSD), trend: 'Móvil', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Agotados / Faltantes', value: `${qtyInactivos} Ítems`, trend: 'Crítico', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { title: 'Mercadería Física', value: `${itemsEnCirculacion} Uds`, trend: 'Operativo', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Modelos en Catálogo', value: `${stockConsolidado.length}`, trend: 'Global', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-blue-950 dark:text-white tracking-tighter">Panel de Control Operativo</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Control logístico y métricas desde AWS SQL Server.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Calendar className="w-4 h-4" /> Últimos Movimientos
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar a Excel
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
            <h3 className="text-xl font-black text-blue-950 dark:text-white tracking-tight">Volumen de Consumo</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <span className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase">Salidas / Consumos</span>
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
          <h3 className="text-xl font-black text-blue-950 dark:text-white tracking-tight mb-8">Alertas de Stock</h3>
          <div className="space-y-6">
            {stockConsolidado.filter(p => !p.cantidad_total || p.cantidad_total === 0).slice(0, 4).map((alert, index) => (
              <div key={`alert-${index}`} className="flex gap-4 group cursor-pointer">
                <div className={cn("w-1 h-12 rounded-full shrink-0", "bg-red-500")}></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{alert.producto_nombre || 'N/A'}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">•</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Agotado</span>
                  </div>
                  <p className="text-sm font-bold text-blue-950 dark:text-white group-hover:text-blue-600 transition-colors">{alert.nombre_completo}</p>
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
