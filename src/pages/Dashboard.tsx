import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
    DollarSign, PackageOpen, AlertCircle, AlertTriangle, 
    ShoppingCart, TrendingDown, Layers, Box, MapPin, Tag, Activity,
    Download, ShieldAlert, Zap, Factory, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { executeAWSQuery } from '../lib/aws-client';
import { TopMovimientosModal } from '../components/TopMovimientosModal';
import { ConsumoDetalleModal } from '../components/ConsumoDetalleModal';
import { printReporteDashboard } from '../lib/printReporteDashboard';

// Paletas de colores modernas para los gráficos
const COLORS_PIE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const STATUS_COLORS = { optimo: '#10b981', alerta: '#f59e0b', critico: '#ef4444' };

export function Dashboard() {
    const { darkMode, user } = useAuth();
    
    // Estados de datos
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({ variantes: 0, unidades: 0 });
    const [capital, setCapital] = useState({ usd: 0, uyu: 0 });
    const [topConsumo, setTopConsumo] = useState<any[]>([]);
    const [distAlmacenes, setDistAlmacenes] = useState<any[]>([]);
    const [distCategorias, setDistCategorias] = useState<any[]>([]);
    
    const [nivelesStockGlobal, setNivelesStockGlobal] = useState<any[]>([]);
    const [alertasPorAlmacen, setAlertasPorAlmacen] = useState<any[]>([]);
    const [anomaliasConsumo, setAnomaliasConsumo] = useState<any[]>([]);
    
    const [isTopModalOpen, setIsTopModalOpen] = useState(false);
    const [isConsumoModalOpen, setIsConsumoModalOpen] = useState(false);
    const [selectedDepositoModal, setSelectedDepositoModal] = useState<any | null>(null);
    const [articuloMasConsumido, setArticuloMasConsumido] = useState<{ nombre: string; cantidad: number } | null>(null);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000); // 1 minuto
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [
                kpisRes, capRes, topRes, distAlmRes, distCatRes, 
                stockGlobalRes, alertasDepRes, anomaliasRes
            ] = await Promise.all([
                executeAWSQuery(`
                    SELECT 
                        COUNT(DISTINCT v.id) as total_variantes,
                        ISNULL((SELECT SUM(cantidad_actual) FROM Stock_Etiquetas WHERE estado = 'activo'), 0) as total_unidades
                    FROM Stock_Variantes v
                `).catch(e => { console.error('Error kpisRes:', e); return []; }),
                executeAWSQuery(`
                    SELECT v.moneda, ISNULL(SUM(COALESCE(NULLIF(e.costo_unitario_real, 0), v.costo, 0) * e.cantidad_actual), 0) as capital
                    FROM Stock_Variantes v
                    INNER JOIN Stock_Etiquetas e ON e.variante_id = v.id
                    WHERE e.cantidad_actual > 0 AND e.estado = 'activo'
                    GROUP BY v.moneda
                `).catch(e => { console.error('Error capRes:', e); return []; }),
                executeAWSQuery(`
                    SELECT TOP 10 
                        v.nombre_variante, 
                        p.nombre as producto,
                        (
                            ISNULL((
                                SELECT SUM(m.cantidad_afectada)
                                FROM Stock_Movimientos m
                                INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
                                WHERE e.variante_id = v.id 
                                  AND m.tipo_movimiento IN ('baja_consumo', 'egreso_final')
                                  AND m.fecha >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0)
                                  AND m.fecha < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)
                            ), 0)
                            +
                            ISNULL((
                                SELECT SUM(h.cantidad_consumida)
                                FROM Stock_Consumo_Historico h
                                WHERE h.variante_id = v.id
                                  AND h.anio = YEAR(GETDATE())
                                  AND h.mes = MONTH(GETDATE())
                            ), 0)
                        ) as total_movimiento
                    FROM Stock_Variantes v
                    INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                    ORDER BY total_movimiento DESC
                `).catch(e => { console.error('Error topRes:', e); return []; }),
                executeAWSQuery(`
                    SELECT d.nombre, SUM(e.cantidad_actual) as valor, SUM(COALESCE(NULLIF(e.costo_unitario_real, 0), v.costo, 0) * e.cantidad_actual) as capital_local, v.moneda
                    FROM Stock_Depositos d
                    INNER JOIN Stock_Etiquetas e ON e.deposito_id = d.id
                    INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                    WHERE e.estado = 'activo' AND e.cantidad_actual > 0
                    GROUP BY d.nombre, v.moneda
                `).catch(e => { console.error('Error distAlmRes:', e); return []; }),
                executeAWSQuery(`
                    SELECT TOP 8 c.nombre, SUM(e.cantidad_actual) as valor
                    FROM Stock_Categorias c
                    INNER JOIN Stock_Productos_Maestros p ON p.categoria_id = c.id
                    INNER JOIN Stock_Variantes v ON v.producto_maestro_id = p.id
                    INNER JOIN Stock_Etiquetas e ON e.variante_id = v.id
                    WHERE e.estado = 'activo' AND e.cantidad_actual > 0
                    GROUP BY c.nombre
                    ORDER BY valor DESC
                `).catch(e => { console.error('Error distCatRes:', e); return []; }),
                executeAWSQuery(`
                    SELECT 
                        v.id, p.nombre as producto, v.nombre_variante,
                        ISNULL(v.cantidad_alerta, 0) as cantidad_alerta,
                        ISNULL(v.cantidad_critica, 0) as cantidad_critica,
                        ISNULL(v.stock_minimo_esperado, 0) as stock_minimo_esperado,
                        c.nombre as categoria,
                        ISNULL((SELECT SUM(cantidad_actual) FROM Stock_Etiquetas e WHERE e.variante_id = v.id AND e.estado='activo'), 0) as stock_actual
                    FROM Stock_Variantes v
                    INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                    LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                `).catch(e => { console.error('Error stockGlobalRes:', e); return []; }),
                executeAWSQuery(`
                    SELECT 
                        v.nombre_variante, d.nombre as deposito, p.nombre as producto,
                        ISNULL(ad.cantidad_alerta, 0) as alerta,
                        ISNULL(ad.cantidad_critica, 0) as critica,
                        ISNULL((SELECT SUM(cantidad_actual) FROM Stock_Etiquetas e WHERE e.variante_id = v.id AND e.deposito_id = d.id AND e.estado='activo'), 0) as stock_actual
                    FROM Stock_Alertas_Depositos ad
                    INNER JOIN Stock_Variantes v ON ad.variante_id = v.id
                    INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                    INNER JOIN Stock_Depositos d ON ad.deposito_id = d.id
                    WHERE ad.cantidad_alerta > 0 OR ad.cantidad_critica > 0
                `).catch(e => { console.error('Error alertasDepRes:', e); return []; }),
                executeAWSQuery(`
                    SELECT 
                        v.nombre_variante, p.nombre as producto,
                        SUM(CASE WHEN m.fecha >= DATEADD(day, -1, GETDATE()) THEN m.cantidad_afectada ELSE 0 END) as consumo_24h,
                        SUM(CASE WHEN m.fecha >= DATEADD(day, -7, GETDATE()) THEN m.cantidad_afectada ELSE 0 END) as consumo_7d
                    FROM Stock_Movimientos m
                    INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
                    INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                    INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                    WHERE m.tipo_movimiento IN ('baja_consumo', 'egreso_final') AND m.fecha >= DATEADD(day, -7, GETDATE())
                    GROUP BY v.nombre_variante, p.nombre
                    HAVING SUM(CASE WHEN m.fecha >= DATEADD(day, -1, GETDATE()) THEN m.cantidad_afectada ELSE 0 END) > 0
                `).catch(e => { console.error('Error anomaliasRes:', e); return []; })
            ]);

            const formatName = (prod: string, variant: string) => {
                if (!variant) return prod;
                if (variant.toLowerCase().includes(prod.toLowerCase())) return variant;
                return `${prod} (${variant})`;
            };

            if (kpisRes && kpisRes[0]) setKpis({ variantes: kpisRes[0].total_variantes, unidades: kpisRes[0].total_unidades });
            
            if (capRes) {
                let usd = 0, uyu = 0;
                capRes.forEach((c: any) => {
                    if (c.moneda === 'USD') usd += c.capital;
                    if (c.moneda === 'UYU' || c.moneda === '$U') uyu += c.capital;
                });
                setCapital({ usd, uyu });
            }

            if (topRes) {
                const formattedTop = topRes.map((t: any) => ({
                    ...t,
                    nombre_variante: formatName(t.producto, t.nombre_variante)
                }));
                
                if (formattedTop.length > 0 && formattedTop[0].total_movimiento > 0) {
                    setArticuloMasConsumido({
                        nombre: formattedTop[0].nombre_variante,
                        cantidad: formattedTop[0].total_movimiento
                    });
                } else {
                    setArticuloMasConsumido(null);
                }

                setTopConsumo(formattedTop.filter((t: any) => t.total_movimiento > 0).reverse());
            } else {
                setArticuloMasConsumido(null);
            }
            
            if (distAlmRes) {
                // Agregar capital por almacen
                const agg: any = {};
                distAlmRes.forEach((d: any) => {
                    if (!agg[d.nombre]) agg[d.nombre] = { nombre: d.nombre, valor: 0, capUSD: 0, capUYU: 0 };
                    agg[d.nombre].valor += d.valor;
                    if (d.moneda === 'USD') agg[d.nombre].capUSD += d.capital_local;
                    if (d.moneda === 'UYU') agg[d.nombre].capUYU += d.capital_local;
                });
                setDistAlmacenes(Object.values(agg).sort((a:any, b:any) => b.valor - a.valor));
            }

            if (distCatRes) setDistCategorias(distCatRes);
            if (stockGlobalRes) {
                setNivelesStockGlobal(stockGlobalRes.map((s: any) => ({
                    ...s,
                    nombre_variante: formatName(s.producto, s.nombre_variante)
                })));
            }
            if (alertasDepRes) {
                setAlertasPorAlmacen(alertasDepRes.map((q: any) => ({
                    ...q,
                    nombre_variante: formatName(q.producto, q.nombre_variante)
                })));
            }
            
            // Procesar anomalías (Consumo en 24h > al doble del promedio diario de los ultimos 7 dias)
            if (anomaliasRes) {
                const detected = anomaliasRes.map((a: any) => {
                    const avgDiario7d = a.consumo_7d / 7;
                    const esPico = a.consumo_24h > (avgDiario7d * 2.5) && a.consumo_24h >= 5; // Minimo 5 unidades de salida para no hacer ruido
                    return { 
                        ...a, 
                        avgDiario7d, 
                        esPico,
                        nombre_variante: formatName(a.producto, a.nombre_variante)
                    };
                }).filter((a: any) => a.esPico);
                setAnomaliasConsumo(detected.sort((a: any, b: any) => b.consumo_24h - a.consumo_24h));
            }

        } catch (e) {
            console.error("Error al cargar Dashboard:", e);
        } finally {
            setLoading(false);
        }
    };

    // Procesar Datos Globales
    const { recomendacionesGlobales, statusStats } = useMemo(() => {
        let recs: any[] = [];
        let stats = { optimo: 0, alerta: 0, critico: 0 };

        nivelesStockGlobal.forEach(item => {
            const umbralCritico = item.cantidad_critica || 0;
            const umbralAlerta = item.cantidad_alerta || 0;

            if (item.stock_actual === 0) {
                // El usuario considera que si es 0 ya es "Sin Stock" y no debe aparecer como "Crítico" o "Alerta"
                // No sumamos a alerta/crítico ni lo agregamos a la lista.
                stats.optimo++; 
            } else if (umbralCritico > 0 || umbralAlerta > 0) {
                if (umbralCritico > 0 && item.stock_actual <= umbralCritico) {
                    stats.critico++;
                    recs.push({ ...item, status: 'critico' });
                } else if (umbralAlerta > 0 && item.stock_actual <= umbralAlerta) {
                    stats.alerta++;
                    recs.push({ ...item, status: 'alerta' });
                } else {
                    stats.optimo++;
                }
            } else {
                // Artículos sin alertas configuradas no se muestran como quiebres, 
                // se consideran óptimos o simplemente no-alertas.
                if (item.stock_actual > 0) {
                    stats.optimo++;
                } else {
                    stats.optimo++; 
                }
            }
        });

        recs.sort((a, b) => {
            if (a.status === 'critico' && b.status !== 'critico') return -1;
            if (a.status !== 'critico' && b.status === 'critico') return 1;
            return a.stock_actual - b.stock_actual;
        });

        return { recomendacionesGlobales: recs, statusStats: stats };
    }, [nivelesStockGlobal]);

    // Procesar Quiebres de Stock Locales (Almacenes)
    const quiebresLocales = useMemo(() => {
        return alertasPorAlmacen.filter(a => {
                if (a.stock_actual === 0) return false; // No mostrar alertas si el stock es 0 (Sin Stock)
                const isCritico = a.critica > 0 && a.stock_actual <= a.critica;
                const isAlerta = a.alerta > 0 && a.stock_actual <= a.alerta;
                return isCritico || isAlerta;
            })
            .map(a => ({
                ...a,
                status: (a.critica > 0 && a.stock_actual <= a.critica) ? 'critico' : 'alerta'
            }))
            .sort((a, b) => {
                if (a.status === 'critico' && b.status !== 'critico') return -1;
                return a.stock_actual - b.stock_actual;
            });
    }, [alertasPorAlmacen]);

    const almacenesConQuiebres = useMemo(() => {
        const agrupado: Record<string, { items: any[], criticos: number, alertas: number }> = {};
        quiebresLocales.forEach(q => {
            if (!agrupado[q.deposito]) agrupado[q.deposito] = { items: [], criticos: 0, alertas: 0 };
            agrupado[q.deposito].items.push(q);
            if (q.status === 'critico') agrupado[q.deposito].criticos++;
            if (q.status === 'alerta') agrupado[q.deposito].alertas++;
        });
        return Object.entries(agrupado).map(([nombre, data]) => ({
            nombre,
            ...data
        })).sort((a, b) => b.criticos - a.criticos || b.alertas - a.alertas);
    }, [quiebresLocales]);

    const statusChartData = [
        { name: 'Óptimo', value: statusStats.optimo, color: STATUS_COLORS.optimo },
        { name: 'En Alerta', value: statusStats.alerta, color: STATUS_COLORS.alerta },
        { name: 'Crítico', value: statusStats.critico, color: STATUS_COLORS.critico }
    ].filter(d => d.value > 0);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[80vh] space-y-6">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    <Activity className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-widest uppercase">Inicializando Centro de Comando</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Calculando algoritmos de riesgo y valoraciones de capital...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 w-full max-w-[1800px] mx-auto animate-in fade-in zoom-in-[0.98] duration-500">
            
            {anomaliasConsumo.length > 0 && (
                <div className="bg-amber-500 dark:bg-amber-900/40 text-white dark:text-amber-200 px-4 py-2 rounded-xl flex items-center gap-3 overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-600/50">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-pulse" />
                    <span className="font-black text-xs uppercase tracking-widest whitespace-nowrap">Anomalías Detectadas:</span>
                    <div className="flex-1 overflow-hidden">
                        <div className="animate-marquee whitespace-nowrap flex gap-8 font-bold text-sm">
                            {anomaliasConsumo.map((a, i) => (
                                <span key={`anom-${i}`}>⚠️ Pico de consumo en <b>{a.nombre_variante}</b> ({a.consumo_24h} uds en 24h)</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header del Centro de Comando */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 blur-3xl rounded-full pointer-events-none -z-10"></div>
                <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full pointer-events-none -z-10"></div>
                
                <div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 flex items-center gap-3">
                        <Activity className="w-10 h-10 lg:w-12 lg:h-12 text-indigo-600 dark:text-indigo-500" />
                        Centro de Control
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold max-w-2xl text-lg tracking-wide">
                        Inteligencia de inventario en tiempo real, anomalías y valoración de activos.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => printReporteDashboard({
                            kpis,
                            capital,
                            mostConsumed: articuloMasConsumido,
                            topConsumo,
                            distAlmacenes,
                            distCategorias,
                            recomendacionesGlobales,
                            almacenesConQuiebres: almacenesConQuiebres.map(a => ({
                                nombre: a.nombre,
                                valor: a.items.reduce((sum: number, i: any) => sum + i.stock_actual, 0),
                                capUSD: a.items.reduce((sum: number, i: any) => sum + (i.moneda === 'USD' ? (i.stock_actual * i.costo) : 0), 0),
                                capUYU: a.items.reduce((sum: number, i: any) => sum + ((i.moneda === 'UYU' || i.moneda === '$U') ? (i.stock_actual * i.costo) : 0), 0),
                            })),
                            usuario: user?.nombre_completo || user?.id || 'Desconocido'
                        })}
                        className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex items-center gap-2 shadow-sm hover:shadow-md cursor-pointer text-center"
                    >
                        <Download className="w-4 h-4"/> Generar Reporte Gerencial
                    </button>
                </div>
            </div>

            {/* Fila 1: KPIs Principales (Diseño Compacto y Poderoso) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <KPICard 
                    title="Activos Valorizados (USD)" 
                    value={`USD ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(capital.usd)}`}
                    icon={DollarSign}
                    colorClass="text-emerald-500"
                    bgClass="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30"
                />
                <KPICard 
                    title="Activos Valorizados (UYU)" 
                    value={new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(capital.uyu)}
                    icon={DollarSign}
                    colorClass="text-emerald-600 dark:text-emerald-400"
                    bgClass="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30"
                />
                <KPICard 
                    title="Volumen Físico (Unidades)" 
                    value={kpis.unidades.toLocaleString()}
                    icon={Box}
                    colorClass="text-blue-500"
                    bgClass="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30"
                />
                <KPICard 
                    title="Diversidad de Catálogo" 
                    value={kpis.variantes.toLocaleString()}
                    icon={Layers}
                    colorClass="text-indigo-500"
                    bgClass="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30"
                />
                <div 
                    onClick={() => setIsConsumoModalOpen(true)}
                    className="border rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer hover:border-rose-300 dark:hover:border-rose-800"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500">
                            <TrendingDown className="w-6 h-6"/>
                        </div>
                        <span className="text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md">
                            Top Consumo
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight line-clamp-1 mb-1" title={articuloMasConsumido?.nombre || "Ninguno"}>
                        {articuloMasConsumido ? articuloMasConsumido.nombre : "Ninguno"}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                            {articuloMasConsumido ? articuloMasConsumido.cantidad.toLocaleString() : "0"}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Unidades</span>
                    </div>
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Más consumido este mes</span>
                </div>
            </div>

            {/* Fila 2: El Cerebro Analítico (Recomendaciones, Anomalías y Quiebres) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Columna Izquierda: Alertas y Anomalías (4 columnas) */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Panel de Anomalías Detectadas */}
                    <DashboardCard 
                        title="Anomalías en Consumo (24h)" 
                        icon={Zap} 
                        className="bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/30"
                        titleColor="text-amber-800 dark:text-amber-400"
                    >
                        {anomaliasConsumo.length === 0 ? (
                            <div className="flex justify-center items-center h-32 text-slate-400 font-bold text-sm">Comportamiento Normal Estable</div>
                        ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {anomaliasConsumo.map((a, i) => (
                                    <div key={i} className={`p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900/50 shadow-sm relative overflow-hidden group`}>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-black text-slate-800 dark:text-slate-200 text-sm truncate pr-4">{a.nombre_variante}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                                <TrendingUp className="w-3.5 h-3.5" /> {a.consumo_24h} salidas hoy
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">Promedio normal: {Math.round(a.avgDiario7d)}/día</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DashboardCard>

                    {/* Alertas Específicas de Almacenes */}
                    <DashboardCard title="Quiebres Críticos por Almacén" icon={Factory}>
                        {almacenesConQuiebres.length === 0 ? (
                            <div className="flex justify-center items-center h-32 text-slate-400 font-bold text-sm">Distribución Local Sana</div>
                        ) : (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                {almacenesConQuiebres.map((a, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedDepositoModal(a)}
                                        className="w-full flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group cursor-pointer text-left hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                                    >
                                        <div className="min-w-0 flex-1 pr-2">
                                            <div className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                                                <MapPin className="w-4 h-4" /> {a.nombre}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {a.criticos > 0 && (
                                                <div className="flex items-center gap-1.5 text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg border border-red-100 dark:border-red-900/30">
                                                    <AlertOctagon className="w-4 h-4"/> {a.criticos}
                                                </div>
                                            )}
                                            {a.alertas > 0 && (
                                                <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                    <AlertTriangle className="w-4 h-4"/> {a.alertas}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </DashboardCard>
                </div>

                {/* Columna Derecha: Recomendaciones Generales de Compra (8 columnas) */}
                <div className="xl:col-span-8">
                    <DashboardCard 
                        title="Ordenador Lógico de Compras (Stock Global)" 
                        icon={ShoppingCart} 
                        action={
                            <span className="text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-md">
                                {recomendacionesGlobales.length} Ítems requieren acción
                            </span>
                        }
                        className="h-full"
                    >
                        {recomendacionesGlobales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                                <PackageOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                                <h4 className="text-xl font-black text-slate-500 dark:text-slate-400">Inventario 100% Sano</h4>
                                <p className="text-slate-400 dark:text-slate-500 font-bold mt-1">Ningún artículo global ha superado los umbrales de alerta.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto h-full max-h-[600px] custom-scrollbar pr-2">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                                        <tr className="border-b border-slate-200 dark:border-slate-800">
                                            <th className="py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                            <th className="py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Familia</th>
                                            <th className="py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Artículo Físico</th>
                                            <th className="py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Global</th>
                                            <th className="py-3 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Límite Configurado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {recomendacionesGlobales.map((item, i) => (
                                            <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-2 w-24">
                                                    {item.status === 'critico' ? (
                                                        <div className="flex items-center gap-1.5 text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md border border-red-100 dark:border-red-500/20">
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> CRÍTICO
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md border border-amber-100 dark:border-amber-500/20">
                                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div> ALERTA
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.categoria || 'Sin Familia'}</span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm max-w-[250px] lg:max-w-[400px] truncate">
                                                        {item.nombre_variante}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <span className={`text-xl font-black ${item.status === 'critico' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                                        {item.stock_actual}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-bold text-slate-500">
                                                            {item.cantidad_critica > 0 ? `C: ${item.cantidad_critica}` : ''}
                                                            {item.cantidad_critica > 0 && item.cantidad_alerta > 0 ? ' / ' : ''}
                                                            {item.cantidad_alerta > 0 ? `A: ${item.cantidad_alerta}` : ''}
                                                        </span>
                                                        <span className="text-[9px] uppercase font-bold text-slate-400">Límite Configurado</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </DashboardCard>
                </div>
            </div>

            {/* Fila 3: Gráficos de Inteligencia */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* Distribución por Almacén */}
                <DashboardCard title="Valor Concentrado por Almacén" icon={MapPin} className="h-full">
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distAlmacenes}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    innerRadius={60}
                                    dataKey="valor"
                                    nameKey="nombre"
                                    stroke="none"
                                    paddingAngle={2}
                                >
                                    {distAlmacenes.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: any, name: any, props: any) => {
                                        const payload = props.payload;
                                        return [
                                            <div className="flex flex-col">
                                                <span>{value.toLocaleString()} Unidades</span>
                                                {payload.capUSD > 0 && <span className="text-emerald-500 text-xs">USD {payload.capUSD.toLocaleString()}</span>}
                                                {payload.capUYU > 0 && <span className="text-blue-500 text-xs">UYU {payload.capUYU.toLocaleString()}</span>}
                                            </div>, 
                                            'Volumen'
                                        ];
                                    }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </DashboardCard>

                {/* Gráfico de Barras de Categorías */}
                <DashboardCard title="Volumen Físico por Familia (Top 8)" icon={Tag} className="h-full">
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distCategorias} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 700 }}/>
                                <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} width={80} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 9, fontWeight: 700 }} />
                                <Tooltip 
                                    cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                                    formatter={(value: any) => [value.toLocaleString(), 'Unidades']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="valor" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} >
                                    {distCategorias.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_PIE[(index + 4) % COLORS_PIE.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </DashboardCard>

                {/* Salud Global */}
                <DashboardCard title="Proporción de Salud (Global)" icon={Activity} className="h-full">
                    {statusChartData.length === 0 ? (
                        <div className="flex justify-center items-center h-[280px] text-slate-400 font-bold text-sm">Sin datos de configuración</div>
                    ) : (
                        <div className="h-[280px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#1e293b' : '#fff', color: darkMode ? '#fff' : '#000', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{statusStats.alerta + statusStats.critico}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">En Riesgo</span>
                            </div>
                        </div>
                    )}
                </DashboardCard>

            </div>

            {/* Fila 4: Top Movimientos de Salida */}
            <DashboardCard 
                title="Top 10 Rotación (Frecuencia de Salida)" 
                icon={TrendingDown}
                onClick={() => setIsTopModalOpen(true)}
                className="cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors group"
                action={
                    <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-indigo-500 transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md flex items-center gap-2">
                        Analizar Tendencias <TrendingUp className="w-3 h-3"/>
                    </span>
                }
            >
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topConsumo}>
                            <defs>
                                <linearGradient id="barGradientTop" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={darkMode ? "#6366f1" : "#4f46e5"} stopOpacity={1} />
                                    <stop offset="100%" stopColor={darkMode ? "#4338ca" : "#3730a3"} stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                            <XAxis 
                                dataKey="nombre_variante" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 700 }} />
                            <Tooltip 
                                cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                                formatter={(value: any) => [value.toLocaleString(), 'Movimientos/Unidades']}
                                contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 700, backgroundColor: darkMode ? '#0f172a' : '#ffffff', color: darkMode ? '#f8fafc' : '#0f172a' }}
                            />
                            <Bar dataKey="total_movimiento" fill="url(#barGradientTop)" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </DashboardCard>

            <TopMovimientosModal 
                isOpen={isTopModalOpen}
                onClose={() => setIsTopModalOpen(false)}
            />

            <ConsumoDetalleModal 
                isOpen={isConsumoModalOpen}
                onClose={() => setIsConsumoModalOpen(false)}
            />

            {/* Modal de Quiebres por Almacén */}
            <AnimatePresence>
                {selectedDepositoModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setSelectedDepositoModal(null)}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                        <Factory className="w-6 h-6 text-indigo-500" /> Alertas: {selectedDepositoModal.nombre}
                                    </h2>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Artículos en riesgo de quiebre en este almacén</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedDepositoModal(null)}
                                    className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    <span className="font-bold text-xl leading-none">&times;</span>
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
                                <div className="space-y-3">
                                    {selectedDepositoModal.items.map((q: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                                            <div className="min-w-0 flex-1 pr-4">
                                                <div className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">{q.nombre_variante}</div>
                                                <div className="flex items-center gap-4 mt-1.5">
                                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><AlertOctagon className="w-3.5 h-3.5" /> C: {q.critica}</span>
                                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> A: {q.alerta}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-2xl font-black leading-none ${q.status === 'critico' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                    {q.stock_actual}
                                                </span>
                                                {q.status === 'critico' ? 
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded">Crítico</span> : 
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded">Alerta</span>
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{__html: `
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}} />
        </div>
    );
}

// Componentes Auxiliares
function KPICard({ title, value, icon: Icon, colorClass, bgClass }: any) {
    return (
        <div className={`border rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
                    <Icon className="w-6 h-6"/>
                </div>
            </div>
            <h3 className="text-3xl lg:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter truncate mb-1">
                {value}
            </h3>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</span>
        </div>
    );
}

function DashboardCard({ title, icon: Icon, children, action, className = "", onClick, titleColor = "text-slate-800 dark:text-slate-100" }: any) {
    return (
        <div onClick={onClick} className={`rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden transition-all ${className}`}>
            <div className="flex justify-between items-center mb-6 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                        <Icon className="w-5 h-5"/>
                    </div>
                    <h2 className={`text-base font-black tracking-tight ${titleColor}`}>{title}</h2>
                </div>
                {action && <div>{action}</div>}
            </div>
            <div className="flex-1 z-10">
                {children}
            </div>
        </div>
    );
}

function AlertOctagon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    );
}
