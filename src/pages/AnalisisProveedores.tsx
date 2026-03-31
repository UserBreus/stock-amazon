import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Filter, CheckCircle, CreditCard, Calendar, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

export function AnalisisProveedores() {
  const { darkMode } = useAuth();
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    const { data } = await supabase.from('proveedores').select('*');
    if (data) setProveedores(data);
    setLoading(false);
  };

  const chartData = proveedores.length > 0 ? proveedores.map(p => ({
    name: p.nombre,
    sla: p.sla,
    costo: p.costo
  })) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-blue-950 dark:text-white tracking-tighter">Análisis de Proveedores</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Comparativa de rendimiento y cumplimiento de SLAs globales.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col px-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Proveedor</span>
            <select className="bg-transparent border-none text-sm font-bold p-0 focus:ring-0 cursor-pointer text-blue-950 dark:text-white outline-none">
              <option>Todos los proveedores</option>
              <option>Global Logistics Corp</option>
              <option>FastTrack Shipping</option>
              <option>Oceanic Alliance</option>
            </select>
          </div>
          <button className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all active:scale-95">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-bold">Aplicar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-nexus p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">+2.4%</span>
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SLA Cumplimiento</h3>
          <p className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">94.2%</p>
        </div>
        <div className="card-nexus p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">-1.1%</span>
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Promedio p/u</h3>
          <p className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">$12.45</p>
        </div>
        <div className="card-nexus p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-lg">Estable</span>
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiempo de Tránsito</h3>
          <p className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">4.2 Días</p>
        </div>
        <div className="card-nexus p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">+8%</span>
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Volumen Mensual</h3>
          <p className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">12.5k T</p>
        </div>
      </div>

      <div className="card-nexus p-8">
        <h2 className="text-xl font-black text-blue-950 dark:text-white tracking-tight mb-8">Costos vs Calidad de Servicio</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke={darkMode ? '#fff' : '#000'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 700 }} />
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
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Bar dataKey="sla" name="SLA Calidad (%)" fill={darkMode ? '#3b82f6' : '#1e3a8a'} radius={[4, 4, 0, 0]} />
              <Bar dataKey="costo" name="Índice Costo" fill={darkMode ? '#1e40af' : '#93c5fd'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
