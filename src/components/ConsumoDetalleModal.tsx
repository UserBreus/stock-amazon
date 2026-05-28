import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Layers, BarChart2, TrendingUp, PackageSearch, Activity, SlidersHorizontal, CheckSquare, Square } from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { BarChart, Bar, LineChart, Line, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface ConsumoDetalleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ConsumoDetalleModal({ isOpen, onClose }: ConsumoDetalleModalProps) {
    const { darkMode } = useAuth();
    
    // Rango de fechas por defecto: desde principio de año hasta hoy
    const defaultDesde = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-01-01`;
    }, []);
    const defaultHasta = useMemo(() => {
        return new Date().toISOString().split('T')[0];
    }, []);

    const [fechaDesde, setFechaDesde] = useState(defaultDesde);
    const [fechaHasta, setFechaHasta] = useState(defaultHasta);
    const [catId, setCatId] = useState<string>('todas');
    const [selectedArticuloId, setSelectedArticuloId] = useState<string>('todos');
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]); // "YYYY-MM" format

    const [categorias, setCategorias] = useState<any[]>([]);
    const [rawConsumos, setRawConsumos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCategorias();
            fetchDatos();
        }
    }, [isOpen]);

    // Recargar datos cuando cambian las fechas generales
    useEffect(() => {
        if (isOpen) {
            fetchDatos();
        }
    }, [fechaDesde, fechaHasta]);

    const fetchCategorias = async () => {
        try {
            const res = await executeAWSQuery("SELECT id, nombre FROM Stock_Categorias ORDER BY nombre");
            if (res) setCategorias(res);
        } catch (e) {
            console.error("Error al cargar categorías:", e);
        }
    };

    const fetchDatos = async () => {
        setLoading(true);
        try {
            // Traer consumos agregados por año, mes y variante dentro del rango
            // Combinando movimientos activos del rango de fechas e históricos de consumo
            const query = `
                SELECT 
                    YEAR(m.fecha) as anio,
                    MONTH(m.fecha) as mes,
                    v.id as variante_id,
                    v.nombre_variante, 
                    p.nombre as prod_nombre, 
                    c.nombre as categoria_nombre,
                    c.id as categoria_id,
                    SUM(m.cantidad_afectada) as cantidad
                FROM Stock_Movimientos m
                INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
                INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                WHERE m.tipo_movimiento IN ('baja_consumo', 'egreso_final')
                  AND m.fecha >= '${fechaDesde} 00:00:00' AND m.fecha <= '${fechaHasta} 23:59:59'
                GROUP BY YEAR(m.fecha), MONTH(m.fecha), v.id, v.nombre_variante, p.nombre, c.nombre, c.id

                UNION ALL

                SELECT 
                    h.anio,
                    h.mes,
                    v.id as variante_id,
                    v.nombre_variante,
                    p.nombre as prod_nombre,
                    c.nombre as categoria_nombre,
                    c.id as categoria_id,
                    h.cantidad_consumida as cantidad
                FROM Stock_Consumo_Historico h
                INNER JOIN Stock_Variantes v ON h.variante_id = v.id
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                WHERE DATEFROMPARTS(h.anio, h.mes, 1) >= '${fechaDesde}'
                  AND DATEFROMPARTS(h.anio, h.mes, 1) <= '${fechaHasta} 23:59:59'
            `;
            
            const res = await executeAWSQuery(query);
            if (res) {
                // Formatear los registros y asignar nombres completos
                const formatted = res.map((r: any) => {
                    const mesStr = String(r.mes).padStart(2, '0');
                    return {
                        anio: r.anio,
                        mes: r.mes,
                        monthKey: `${r.anio}-${mesStr}`,
                        variante_id: r.variante_id,
                        nombre_completo: r.nombre_variante ? `${r.prod_nombre} (${r.nombre_variante})` : r.prod_nombre,
                        categoria_nombre: r.categoria_nombre || 'Sin Familia',
                        categoria_id: String(r.categoria_id),
                        cantidad: Number(r.cantidad)
                    };
                });
                setRawConsumos(formatted);

                // Inicializar todos los meses disponibles como seleccionados por defecto
                const uniqueMonths = Array.from(new Set(formatted.map((f: any) => f.monthKey))).sort();
                setSelectedMonths(uniqueMonths);
            }
        } catch (e) {
            console.error("Error al cargar consumos:", e);
        } finally {
            setLoading(false);
        }
    };

    // Procesamiento de datos intermedios basado en filtros locales (Categoría / Familia)
    const filteredByFamily = useMemo(() => {
        if (catId === 'todas') return rawConsumos;
        return rawConsumos.filter(r => r.categoria_id === catId);
    }, [rawConsumos, catId]);

    // Meses únicos disponibles en el rango actual (después del filtro de familia)
    const availableMonths = useMemo(() => {
        return Array.from(new Set(filteredByFamily.map(r => r.monthKey))).sort();
    }, [filteredByFamily]);

    // Filtrado secundario por los meses que el usuario tenga seleccionados (Checkboxes)
    const filteredByMonths = useMemo(() => {
        return filteredByFamily.filter(r => selectedMonths.includes(r.monthKey));
    }, [filteredByFamily, selectedMonths]);

    // Listado de Artículos únicos para el selector (después del filtro de familia y meses)
    const availableArticulos = useMemo(() => {
        const map: Record<string, string> = {};
        filteredByMonths.forEach(r => {
            map[r.variante_id] = r.nombre_completo;
        });
        return Object.entries(map).map(([id, name]) => ({ id, name })).sort((a,b) => a.name.localeCompare(b.name));
    }, [filteredByMonths]);

    // 1. Ranking Global de consumo en el periodo actual
    const rankingData = useMemo(() => {
        const agg: Record<string, { nombre: string; categoria: string; total: number }> = {};
        filteredByMonths.forEach(r => {
            const k = r.variante_id;
            if (!agg[k]) agg[k] = { nombre: r.nombre_completo, categoria: r.categoria_nombre, total: 0 };
            agg[k].total += r.cantidad;
        });
        return Object.values(agg).sort((a,b) => b.total - a.total);
    }, [filteredByMonths]);

    // 2. Datos para el Gráfico de Barras: "Artículo Más Consumido por Mes"
    const monthlyTopChartData = useMemo(() => {
        // Para cada mes, buscamos cuál fue el artículo más consumido
        const dataByMonth: Record<string, { monthKey: string; name: string; consumo: number }> = {};
        
        selectedMonths.forEach(mKey => {
            // Inicializar el mes con consumo 0
            dataByMonth[mKey] = { monthKey: mKey, name: 'Ninguno', consumo: 0 };
        });

        filteredByMonths.forEach(r => {
            const current = dataByMonth[r.monthKey];
            if (current && r.cantidad > current.consumo) {
                dataByMonth[r.monthKey] = {
                    monthKey: r.monthKey,
                    name: r.nombre_completo,
                    consumo: r.cantidad
                };
            }
        });

        // Retornar ordenados cronológicamente
        return Object.values(dataByMonth).sort((a,b) => a.monthKey.localeCompare(b.monthKey));
    }, [filteredByMonths, selectedMonths]);

    // 3. Datos para el Gráfico de Línea: "Consumo Mensual de un Artículo Específico"
    const specificArticleChartData = useMemo(() => {
        if (selectedArticuloId === 'todos') return [];
        
        const dataByMonth: Record<string, number> = {};
        selectedMonths.forEach(m => { dataByMonth[m] = 0; });

        filteredByMonths.forEach(r => {
            if (String(r.variante_id) === selectedArticuloId) {
                if (dataByMonth[r.monthKey] !== undefined) {
                    dataByMonth[r.monthKey] += r.cantidad;
                }
            }
        });

        return Object.entries(dataByMonth)
            .map(([monthKey, cantidad]) => ({ monthKey, cantidad }))
            .sort((a,b) => a.monthKey.localeCompare(b.monthKey));
    }, [filteredByMonths, selectedArticuloId, selectedMonths]);

    // Alternar selección de meses
    const toggleMonth = (mKey: string) => {
        setSelectedMonths(prev => 
            prev.includes(mKey) ? prev.filter(m => m !== mKey) : [...prev, mKey]
        );
    };

    const toggleAllMonths = () => {
        if (selectedMonths.length === availableMonths.length) {
            setSelectedMonths([]);
        } else {
            setSelectedMonths([...availableMonths]);
        }
    };

    if (!isOpen) return null;

    const COLORS_CHART = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#14b8a6'];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-950 w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="flex items-center gap-3">
                            <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-2xl">
                                <TrendingUp className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white">Análisis de Consumo Detallado</h2>
                                <p className="text-sm font-medium text-slate-500">Métricas avanzadas, evolución por meses y comportamiento de familias.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filtros Generales */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4"/> Rango Desde
                            </label>
                            <input 
                                type="date" 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4"/> Rango Hasta
                            </label>
                            <input 
                                type="date" 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Layers className="w-4 h-4"/> Familia (Categoría)
                            </label>
                            <select 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12 font-bold"
                                value={catId}
                                onChange={(e) => {
                                    setCatId(e.target.value);
                                    setSelectedArticuloId('todos'); // Reiniciar filtro de artículo al cambiar categoría
                                }}
                            >
                                <option value="todas">-- Todas las Familias --</option>
                                {categorias.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4"/> Artículo Específico
                            </label>
                            <select 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12 font-bold text-indigo-600 dark:text-indigo-400"
                                value={selectedArticuloId}
                                onChange={(e) => setSelectedArticuloId(e.target.value)}
                            >
                                <option value="todos">-- Gráfica de Líderes por Mes --</option>
                                {availableArticulos.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row p-6 gap-6 bg-white dark:bg-slate-900 min-h-0">
                        
                        {/* Panel izquierdo de filtros de mes (checkboxes) */}
                        <div className="w-full lg:w-56 shrink-0 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col max-h-[300px] lg:max-h-full">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-4 h-4 text-slate-400"/> Filtrar Meses
                                </h3>
                                <button 
                                    onClick={toggleAllMonths}
                                    className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    {selectedMonths.length === availableMonths.length ? 'Ninguno' : 'Todos'}
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                                {availableMonths.length === 0 ? (
                                    <p className="text-xs text-slate-400 font-bold text-center py-4">Sin meses disponibles</p>
                                ) : (
                                    availableMonths.map(mKey => {
                                        const isSelected = selectedMonths.includes(mKey);
                                        return (
                                            <button
                                                key={mKey}
                                                onClick={() => toggleMonth(mKey)}
                                                className={cn(
                                                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left border",
                                                    isSelected 
                                                        ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 shadow-sm"
                                                        : "text-slate-400 dark:text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40"
                                                )}
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                                )}
                                                {mKey}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Central: Gráficos de Visualización */}
                        <div className="flex-1 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col min-w-0">
                            {loading ? (
                                <div className="flex-1 flex justify-center items-center"><div className="loader"></div></div>
                            ) : rawConsumos.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <PackageSearch className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-3" />
                                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">No se encontraron consumos</h4>
                                    <p className="text-xs text-slate-400 font-bold mt-1 text-center max-w-sm">No existen registros de consumos o salidas en el rango seleccionado.</p>
                                </div>
                            ) : selectedMonths.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <SlidersHorizontal className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
                                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">Selecciona algún mes</h4>
                                    <p className="text-xs text-slate-400 font-bold mt-1">Activa al menos un mes del panel izquierdo para visualizar las gráficas.</p>
                                </div>
                            ) : selectedArticuloId !== 'todos' ? (
                                // Renderizar Gráfica de Líneas para artículo específico
                                <div className="flex-1 flex flex-col min-h-0">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex justify-between items-center">
                                        <span>Consumo Mensual: <b className="text-indigo-600 dark:text-indigo-400">{availableArticulos.find(a => a.id === selectedArticuloId)?.name}</b></span>
                                        <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded">Gráfico de Línea</span>
                                    </h3>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={specificArticleChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                                                <XAxis 
                                                    dataKey="monthKey" 
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
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="cantidad" 
                                                    name="Consumo (Unidades)"
                                                    stroke="#6366f1" 
                                                    strokeWidth={4} 
                                                    dot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: darkMode ? '#0f172a' : '#ffffff' }} 
                                                    activeDot={{ r: 7 }} 
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                // Renderizar Gráfica de Barras para el artículo más consumido por mes
                                <div className="flex-1 flex flex-col min-h-0">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex justify-between items-center">
                                        <span>Insumo Más Consumido por Mes</span>
                                        <span className="text-[10px] px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded">Gráfico de Barra</span>
                                    </h3>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={monthlyTopChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                                                <XAxis 
                                                    dataKey="monthKey" 
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
                                                    formatter={(value: any, name: any, props: any) => {
                                                        const p = props.payload;
                                                        return [
                                                            <div className="flex flex-col text-xs font-bold leading-relaxed">
                                                                <span className="text-slate-400">Artículo líder:</span>
                                                                <span className="text-slate-100 text-sm font-black">{p.name}</span>
                                                                <span className="text-indigo-400 text-sm font-black mt-1">{value} Unidades</span>
                                                            </div>, 
                                                            'Detalle del Mes'
                                                        ];
                                                    }}
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#0f172a' : '#ffffff', color: darkMode ? '#f8fafc' : '#0f172a' }}
                                                />
                                                <Bar dataKey="consumo" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={40}>
                                                    {monthlyTopChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Derecho: Tabla de Ranking de Consumo en el Periodo */}
                        <div className="w-full lg:w-96 shrink-0 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-rose-500" /> Ranking Consumo Acumulado
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {rankingData.length === 0 ? (
                                    <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-bold">No hay consumos en este filtro</div>
                                ) : (
                                    rankingData.map((d, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => {
                                                // Encontrar ID del artículo correspondiente en availableArticulos para cambiar el gráfico
                                                const match = availableArticulos.find(a => a.name === d.nombre);
                                                if (match) setSelectedArticuloId(match.id);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all text-left border border-transparent",
                                                availableArticulos.find(a => a.name === d.nombre)?.id === selectedArticuloId
                                                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm"
                                                    : ""
                                            )}
                                        >
                                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0", i < 3 ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-slate-200/60 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                                                #{i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{d.nombre}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{d.categoria}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-black text-rose-500">{d.total.toLocaleString()}</p>
                                                <p className="text-[8px] uppercase font-bold text-slate-400">Uds</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
