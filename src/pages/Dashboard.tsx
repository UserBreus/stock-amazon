import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Download, AlertTriangle, TrendingDown, DollarSign, PackageOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { executeAWSQuery } from '../lib/aws-client';
import { cn } from '../lib/utils';

import { TopMovimientosModal } from '../components/TopMovimientosModal';

export function Dashboard() {
  const { darkMode } = useAuth();
  const [metricas, setMetricas] = useState<any[]>([]);
  const [capitalActivo, setCapitalActivo] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchWmsData();
    const interval = setInterval(fetchWmsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWmsData = async () => {
    try {
      const [metricasRes, capRes, alertasRes] = await Promise.all([
        executeAWSQuery(`
          SELECT TOP 10 
              v.nombre_variante, 
              ISNULL(SUM(m.cantidad_afectada), 0) as total_movimiento
          FROM Stock_Movimientos m
          INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
          INNER JOIN Stock_Variantes v ON e.variante_id = v.id
          WHERE m.tipo_movimiento = 'consumo' 
            AND m.fecha >= DATEADD(day, -7, GETDATE())
          GROUP BY v.id, v.nombre_variante
          ORDER BY total_movimiento DESC
        `),
        executeAWSQuery(`
          SELECT 
              v.moneda,
              ISNULL(SUM(v.costo * e.cantidad_actual), 0) as capital,
              COUNT(DISTINCT CASE WHEN v.costo > 0 THEN v.id END) as items_con_costo,
              COUNT(DISTINCT CASE WHEN v.costo = 0 OR v.costo IS NULL THEN v.id END) as items_sin_costo
          FROM Stock_Variantes v
          INNER JOIN Stock_Etiquetas e ON e.variante_id = v.id
          WHERE e.cantidad_actual > 0 AND e.estado = 'activo'
          GROUP BY v.moneda
        `),
        executeAWSQuery(`
          SELECT 
              v.id as variante_id,
              p.nombre as prod_nombre,
              v.nombre_variante,
              v.codigo_variante,
              v.stock_minimo_esperado,
              ISNULL((SELECT SUM(cantidad_actual) FROM Stock_Etiquetas e WHERE e.variante_id = v.id AND e.estado = 'activo'), 0) as stock_actual,
              ISNULL((SELECT SUM(cantidad_consumida) FROM Stock_Consumo_Historico ch WHERE ch.variante_id = v.id AND ch.mes = MONTH(GETDATE())), 0) as consumo_historico_mes,
              ISNULL((SELECT SUM(cantidad_afectada) FROM Stock_Movimientos m INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id WHERE e.variante_id = v.id AND m.tipo_movimiento = 'consumo' AND m.fecha >= DATEADD(day, -30, GETDATE())), 0) as consumo_reciente_30_dias
          FROM Stock_Variantes v
          INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
          WHERE v.alerta_activada = 1
        `)
      ]);

      setMetricas((metricasRes || []).reverse());
      setCapitalActivo(capRes || []);
      
      // Calculate survival time for alerts
      const processedAlertas = (alertasRes || []).map((a: any) => {
          const historial = a.consumo_historico_mes || 0;
          const reciente = a.consumo_reciente_30_dias || 0;
          
          let consumoPromedioMensual = 0;
          if (historial > 0 && reciente > 0) {
              consumoPromedioMensual = (historial + reciente) / 2;
          } else if (historial > 0) {
              consumoPromedioMensual = historial;
          } else {
              consumoPromedioMensual = reciente;
          }
          
          const consumoDiario = consumoPromedioMensual / 30;
          const diasRestantes = consumoDiario > 0 ? Math.floor(a.stock_actual / consumoDiario) : -1;

          return { ...a, diasRestantes };
      }).filter((a: any) => a.stock_actual <= a.stock_minimo_esperado).sort((a: any, b: any) => {
          if (a.diasRestantes === -1) return 1;
          if (b.diasRestantes === -1) return -1;
          return a.diasRestantes - b.diasRestantes;
      });

      setAlertas(processedAlertas);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const capUSD = capitalActivo.find(c => c.moneda === 'USD') || { capital: 0, items_con_costo: 0, items_sin_costo: 0 };
  const capUYU = capitalActivo.find(c => c.moneda === 'UYU') || { capital: 0, items_con_costo: 0, items_sin_costo: 0 };

  const chartData = metricas.length > 0 
    ? metricas.map(m => ({ name: m.nombre_variante, consumo: m.total_movimiento }))
    : [];

  if (loading) {
      return <div className="flex justify-center items-center h-full pt-20"><div className="loader"></div></div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-blue-950 dark:text-white tracking-tighter">Panel de Control Operativo</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Métricas de capital, alertas predictivas y volumen de consumo.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar a Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Capital USD */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-nexus p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600"><DollarSign className="w-4 h-4"/></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital USD</span>
                </div>
                <h3 className="text-2xl font-black text-blue-950 dark:text-white tracking-tighter">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(capUSD.capital)}
                </h3>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500">{capUSD.items_con_costo} artículos con valor</p>
                {capUSD.items_sin_costo > 0 && <p className="text-[10px] font-bold text-red-500 mt-1"><AlertCircle className="w-3 h-3 inline-block mr-1"/>{capUSD.items_sin_costo} sin costo</p>}
            </div>
        </motion.div>

        {/* Capital UYU */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-nexus p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600"><DollarSign className="w-4 h-4"/></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital UYU</span>
                </div>
                <h3 className="text-2xl font-black text-blue-950 dark:text-white tracking-tighter">
                    {new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(capUYU.capital)}
                </h3>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500">{capUYU.items_con_costo} artículos con valor</p>
                {capUYU.items_sin_costo > 0 && <p className="text-[10px] font-bold text-red-500 mt-1"><AlertCircle className="w-3 h-3 inline-block mr-1"/>{capUYU.items_sin_costo} sin costo</p>}
            </div>
        </motion.div>
        {/* Modulo 2: Alertas Predictivas */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 card-nexus p-6 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-xl text-red-600"><AlertTriangle className="w-5 h-5"/></div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Alertas de Stock</h2>
                </div>
                <span className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-[10px] font-black uppercase px-2 py-1 rounded-md">{alertas.length} Críticos</span>
            </div>

            {alertas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                    <PackageOpen className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-3" />
                    <p className="text-slate-400 font-bold text-xs text-center">Sin alertas críticas.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 max-h-[350px]">
                    {alertas.map((a, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-0.5">{a.prod_nombre}</p>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{a.nombre_variante}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-red-600 dark:text-red-400">{a.stock_actual} <span className="text-[9px] uppercase">Uds</span></p>
                                    <p className="text-[9px] font-bold text-slate-500">Mín: {a.stock_minimo_esperado}</p>
                                </div>
                            </div>
                            <div className="mt-1 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    <TrendingDown className="w-3 h-3 text-red-500" /> 
                                    {a.diasRestantes === -1 ? 'Sin datos de consumo' : a.diasRestantes === 0 ? '¡Agotado hoy!' : `Dura aprox. ${a.diasRestantes} días`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div 
          onClick={() => setIsModalOpen(true)}
          className="card-nexus p-8 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors group"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-blue-950 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Top 10 Insumos con Mayor Movimiento</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Últimos 7 días. Clic para ver historial detallado por mes y familia.</p>
            </div>
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
                <Bar dataKey="consumo" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <TopMovimientosModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
