import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Layers, BarChart2, TrendingUp, PackageSearch } from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface TopMovimientosModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TopMovimientosModal({ isOpen, onClose }: TopMovimientosModalProps) {
    const { darkMode } = useAuth();
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [catId, setCatId] = useState<string>('todas');
    const [categorias, setCategorias] = useState<any[]>([]);
    const [datos, setDatos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCategorias();
            fetchDatos();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchDatos();
        }
    }, [mes, anio, catId]);

    const fetchCategorias = async () => {
        try {
            const res = await executeAWSQuery("SELECT id, nombre FROM Stock_Categorias ORDER BY nombre");
            if (res) setCategorias(res);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchDatos = async () => {
        setLoading(true);
        try {
            let catFilter = catId === 'todas' ? '' : `AND c.id = ${catId}`;
            
            // Build the query to aggregate consumption for the selected month and year
            const query = `
                SELECT 
                    v.id as variante_id,
                    v.nombre_variante, 
                    p.nombre as prod_nombre, 
                    c.nombre as categoria_nombre,
                    ISNULL(SUM(m.cantidad_afectada), 0) as total_movimiento
                FROM Stock_Movimientos m
                INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
                INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                WHERE m.tipo_movimiento = 'consumo' 
                  AND MONTH(m.fecha) = ${mes}
                  AND YEAR(m.fecha) = ${anio}
                  ${catFilter}
                GROUP BY v.id, v.nombre_variante, p.nombre, c.nombre
                ORDER BY total_movimiento DESC
            `;
            const data = await executeAWSQuery(query);
            
            // Transform data for the chart/list
            const formatted = (data || []).map((d: any) => ({
                name: d.nombre_variante,
                product: d.prod_nombre,
                category: d.categoria_nombre || 'Sin Familia',
                consumo: d.total_movimiento
            }));
            
            setDatos(formatted);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-2xl">
                                <BarChart2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">Análisis de Consumo de Insumos</h2>
                                <p className="text-sm font-medium text-slate-500">Explorador detallado por mes y familia de productos.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4"/> Mes
                                </label>
                                <select 
                                    className="input-nexus w-full bg-white dark:bg-slate-900 h-12"
                                    value={mes}
                                    onChange={(e) => setMes(Number(e.target.value))}
                                >
                                    <option value={1}>Enero</option>
                                    <option value={2}>Febrero</option>
                                    <option value={3}>Marzo</option>
                                    <option value={4}>Abril</option>
                                    <option value={5}>Mayo</option>
                                    <option value={6}>Junio</option>
                                    <option value={7}>Julio</option>
                                    <option value={8}>Agosto</option>
                                    <option value={9}>Septiembre</option>
                                    <option value={10}>Octubre</option>
                                    <option value={11}>Noviembre</option>
                                    <option value={12}>Diciembre</option>
                                </select>
                            </div>
                            <div className="w-32">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    Año
                                </label>
                                <input 
                                    type="number" 
                                    className="input-nexus w-full bg-white dark:bg-slate-900 h-12"
                                    value={anio}
                                    onChange={(e) => setAnio(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="flex-[2]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Layers className="w-4 h-4"/> Familia / Categoría
                            </label>
                            <select 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12"
                                value={catId}
                                onChange={(e) => setCatId(e.target.value)}
                            >
                                <option value="todas">-- Todas las Familias --</option>
                                {categorias.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col p-6 bg-white dark:bg-slate-900">
                        {loading ? (
                            <div className="flex-1 flex justify-center items-center"><div className="loader"></div></div>
                        ) : datos.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                <PackageSearch className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2">Sin Movimientos</h3>
                                <p className="text-slate-500 text-center font-medium max-w-md">No se han registrado salidas o consumos para los filtros seleccionados durante este periodo.</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                                {/* Chart Section */}
                                <div className="flex-[2] h-full flex flex-col min-h-[300px]">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6">Volumen Comparativo</h3>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={datos.slice(0, 15)} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="barGradientModal" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor={darkMode ? "#3b82f6" : "#1e3a8a"} stopOpacity={1} />
                                                        <stop offset="100%" stopColor={darkMode ? "#8b5cf6" : "#4f46e5"} stopOpacity={0.8} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                                                <XAxis type="number" hide />
                                                <YAxis 
                                                    dataKey="name" 
                                                    type="category" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    width={150}
                                                    tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }}
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700, backgroundColor: darkMode ? '#0f172a' : '#ffffff', color: darkMode ? '#f8fafc' : '#0f172a' }}
                                                />
                                                <Bar dataKey="consumo" fill="url(#barGradientModal)" radius={[0, 6, 6, 0]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 text-center">* La gráfica muestra hasta el Top 15 de la selección actual.</p>
                                </div>
                                
                                {/* List Section */}
                                <div className="flex-1 h-full flex flex-col border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-indigo-500" /> Ranking Detallado
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                        {datos.map((d, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0", i < 3 ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                                                    #{i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{d.name}</p>
                                                    <p className="text-[10px] text-slate-500 truncate">{d.product}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{d.consumo}</p>
                                                    <p className="text-[9px] uppercase font-bold text-slate-400">Uds</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
