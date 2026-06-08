import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Layers, BarChart2, TrendingUp, PackageSearch, Activity } from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { BarChart, Bar, LineChart, Line, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { cn, getVisualName } from '../lib/utils';

interface TopMovimientosModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TopMovimientosModal({ isOpen, onClose }: TopMovimientosModalProps) {
    const { darkMode } = useAuth();
    
    const d30 = new Date(); d30.setDate(d30.getDate() - 30);
    const [fechaDesde, setFechaDesde] = useState(d30.toISOString().split('T')[0]);
    const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);
    const [agrupacion, setAgrupacion] = useState<'totales'|'diario'|'semanal'|'quincenal'|'mensual'|'semestral'>('totales');
    const [catId, setCatId] = useState<string>('todas');
    
    const [categorias, setCategorias] = useState<any[]>([]);
    const [datosTotales, setDatosTotales] = useState<any[]>([]);
    const [datosEvolucion, setDatosEvolucion] = useState<any[]>([]);
    const [topNames, setTopNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedArticuloId, setSelectedArticuloId] = useState<string>('todos');

    useEffect(() => {
        if (isOpen) {
            fetchCategorias();
            setSelectedArticuloId('todos');
            fetchDatos();
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedArticuloId('todos');
    }, [catId]);

    useEffect(() => {
        if (isOpen) {
            fetchDatos();
        }
    }, [fechaDesde, fechaHasta, catId, agrupacion, selectedArticuloId]);

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
            
            const queryTotales = `
                SELECT 
                    v.id as variante_id,
                    v.nombre_variante, 
                    p.nombre as prod_nombre, 
                    c.nombre as categoria_nombre,
                    (
                        ISNULL((
                            SELECT SUM(m.cantidad_afectada)
                            FROM Stock_Movimientos m
                            INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
                            WHERE e.variante_id = v.id 
                              AND m.tipo_movimiento IN ('baja_consumo', 'egreso_final')
                              AND m.fecha >= '${fechaDesde} 00:00:00' AND m.fecha <= '${fechaHasta} 23:59:59'
                        ), 0)
                        +
                        ISNULL((
                            SELECT SUM(h.cantidad_consumida)
                            FROM Stock_Consumo_Historico h
                            WHERE h.variante_id = v.id
                              AND DATEFROMPARTS(h.anio, h.mes, 1) >= '${fechaDesde}'
                              AND DATEFROMPARTS(h.anio, h.mes, 1) <= '${fechaHasta} 23:59:59'
                        ), 0)
                    ) as total_movimiento
                FROM Stock_Variantes v
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                WHERE 1=1 ${catFilter}
                  AND (
                        ISNULL((
                            SELECT SUM(m.cantidad_afectada)
                            FROM Stock_Movimientos m
                            INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
                            WHERE e.variante_id = v.id 
                              AND m.tipo_movimiento IN ('baja_consumo', 'egreso_final')
                              AND m.fecha >= '${fechaDesde} 00:00:00' AND m.fecha <= '${fechaHasta} 23:59:59'
                        ), 0)
                        +
                        ISNULL((
                            SELECT SUM(h.cantidad_consumida)
                            FROM Stock_Consumo_Historico h
                            WHERE h.variante_id = v.id
                              AND DATEFROMPARTS(h.anio, h.mes, 1) >= '${fechaDesde}'
                              AND DATEFROMPARTS(h.anio, h.mes, 1) <= '${fechaHasta} 23:59:59'
                        ), 0)
                  ) > 0
                ORDER BY total_movimiento DESC
            `;
            
            const totalesRaw = await executeAWSQuery(queryTotales);
            const totales = (totalesRaw || []).map((d: any) => ({
                id: d.variante_id,
                name: getVisualName(d.categoria_nombre, d.prod_nombre, d.nombre_variante),
                product: d.prod_nombre,
                category: d.categoria_nombre || 'Sin Familia',
                consumo: d.total_movimiento
            }));
            
            setDatosTotales(totales);

            if (agrupacion !== 'totales' && totales.length > 0) {
                let targetIds = '';
                let targetNames: string[] = [];

                if (selectedArticuloId !== 'todos') {
                    const matched = totales.find(t => String(t.id) === selectedArticuloId);
                    if (matched) {
                        targetIds = `'${matched.id.toString().replace(/'/g, "''")}'`;
                        targetNames = [matched.name];
                    } else {
                        const top5 = totales.slice(0, 5);
                        targetIds = top5.map(t => `'${t.id.toString().replace(/'/g, "''")}'`).join(',');
                        targetNames = top5.map(t => t.name);
                    }
                } else {
                    const top5 = totales.slice(0, 5);
                    targetIds = top5.map(t => `'${t.id.toString().replace(/'/g, "''")}'`).join(',');
                    targetNames = top5.map(t => t.name);
                }

                setTopNames(targetNames);

                const queryEvolucion = `
                    SELECT 
                        m.fecha,
                        v.nombre_variante,
                        p.nombre as prod_nombre,
                        c.nombre as cat_nombre,
                        m.cantidad_afectada as cantidad
                    FROM Stock_Movimientos m
                    INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
                    INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                    INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                    LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                    WHERE m.tipo_movimiento IN ('baja_consumo', 'egreso_final')
                      AND m.fecha >= '${fechaDesde} 00:00:00' AND m.fecha <= '${fechaHasta} 23:59:59'
                      ${catFilter}
                      AND v.id IN (${targetIds})
                      
                    UNION ALL
                    
                    SELECT 
                        DATEFROMPARTS(h.anio, h.mes, 1) as fecha,
                        v.nombre_variante,
                        p.nombre as prod_nombre,
                        c.nombre as cat_nombre,
                        h.cantidad_consumida as cantidad
                    FROM Stock_Consumo_Historico h
                    INNER JOIN Stock_Variantes v ON h.variante_id = v.id
                    INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                    LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                    WHERE DATEFROMPARTS(h.anio, h.mes, 1) >= '${fechaDesde}' 
                      AND DATEFROMPARTS(h.anio, h.mes, 1) <= '${fechaHasta} 23:59:59'
                      ${catFilter}
                      AND v.id IN (${targetIds})
                `;
                const evoRaw = await executeAWSQuery(queryEvolucion);

                const groupedMap: any = {};
                for(let r of (evoRaw || [])) {
                    const d = new Date(r.fecha);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    
                    let key = '';
                    if (agrupacion === 'diario') key = `${yyyy}-${mm}-${dd}`;
                    else if (agrupacion === 'semanal') {
                        const firstDay = new Date(d.setDate(d.getDate() - d.getDay()));
                        key = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
                    }
                    else if (agrupacion === 'quincenal') key = `${yyyy}-${mm}-${d.getDate() <= 15 ? 'Q1' : 'Q2'}`;
                    else if (agrupacion === 'mensual') key = `${yyyy}-${mm}`;
                    else if (agrupacion === 'semestral') key = `${yyyy}-${d.getMonth() <= 5 ? 'S1' : 'S2'}`;

                    const formattedName = getVisualName(r.cat_nombre, r.prod_nombre, r.nombre_variante);
                    if(!groupedMap[key]) groupedMap[key] = { fecha: key };
                    if(!groupedMap[key][formattedName]) groupedMap[key][formattedName] = 0;
                    groupedMap[key][formattedName] += r.cantidad;
                }

                const sortedKeys = Object.keys(groupedMap).sort();
                const finalEvo = sortedKeys.map(k => groupedMap[k]);
                setDatosEvolucion(finalEvo);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const colors = ["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6"];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-950 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-2xl">
                                <BarChart2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">Análisis de Consumo de Insumos</h2>
                                <p className="text-sm font-medium text-slate-500">Explorador detallado por fecha, intervalos y familia.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4"/> Desde
                            </label>
                            <input 
                                type="date" 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4"/> Hasta
                            </label>
                            <input 
                                type="date" 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4"/> Agrupación
                            </label>
                            <select 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12 font-bold text-indigo-600 dark:text-indigo-400"
                                value={agrupacion}
                                onChange={(e) => setAgrupacion(e.target.value as any)}
                            >
                                <option value="totales">Totales Globales</option>
                                <option value="diario">Comparación Diaria</option>
                                <option value="semanal">Comparación Semanal</option>
                                <option value="quincenal">Comparación Quincenal</option>
                                <option value="mensual">Comparación Mensual</option>
                                <option value="semestral">Comparación Semestral</option>
                            </select>
                        </div>
                        <div className="flex-[2] min-w-[200px]">
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
                        <div className="flex-[2] min-w-[200px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4"/> Producto Específico
                            </label>
                            <select 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12 font-bold text-indigo-600 dark:text-indigo-400"
                                value={selectedArticuloId}
                                onChange={(e) => setSelectedArticuloId(e.target.value)}
                            >
                                <option value="todos">-- Comparar Top 5 --</option>
                                {datosTotales.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col p-6 bg-white dark:bg-slate-900">
                        {loading ? (
                            <div className="flex-1 flex justify-center items-center"><div className="loader"></div></div>
                        ) : datosTotales.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                <PackageSearch className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2">Sin Movimientos</h3>
                                <p className="text-slate-500 text-center font-medium max-w-md">No se han registrado salidas o consumos para los filtros seleccionados durante este periodo.</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                                {/* Chart Section */}
                                <div className="flex-[2] h-full flex flex-col min-h-[300px]">
                                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6">
                                        {agrupacion === 'totales' ? 'Volumen Comparativo (Top 15)' : 'Evolución Temporal (Top 5)'}
                                    </h3>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {agrupacion === 'totales' ? (
                                                <BarChart data={datosTotales.slice(0, 15)} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
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
                                            ) : (
                                                <LineChart data={datosEvolucion} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                                                    <XAxis 
                                                        dataKey="fecha" 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }}
                                                        dy={10}
                                                    />
                                                    <YAxis 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700, backgroundColor: darkMode ? '#0f172a' : '#ffffff', color: darkMode ? '#f8fafc' : '#0f172a' }}
                                                    />
                                                    <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 700, fontSize: '12px' }} />
                                                    {topNames.map((name, i) => (
                                                        <Line 
                                                            key={name} 
                                                            type="monotone" 
                                                            dataKey={name} 
                                                            stroke={colors[i % colors.length]} 
                                                            strokeWidth={4} 
                                                            dot={{ r: 4, fill: colors[i % colors.length], strokeWidth: 2, stroke: darkMode ? '#0f172a' : '#ffffff' }} 
                                                            activeDot={{ r: 6 }} 
                                                        />
                                                    ))}
                                                </LineChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 text-center">
                                        {agrupacion === 'totales' ? '* La gráfica muestra hasta el Top 15 de la selección actual.' : '* La gráfica muestra el Top 5 en base a la línea temporal seleccionada.'}
                                    </p>
                                </div>
                                
                                {/* List Section */}
                                <div className="flex-1 h-full flex flex-col border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-indigo-500" /> Ranking Global
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                        {datosTotales.map((d, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0", i < 3 ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                                                    #{i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{d.name}</p>
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
