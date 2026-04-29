import React, { useState, useEffect } from 'react';
import { executeAWSQuery } from '../lib/aws-client';
import { AlertTriangle, TrendingDown, Save, Calendar, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function AlertasPredictivasConfig() {
    const [variantes, setVariantes] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVarId, setSelectedVarId] = useState<number | null>(null);

    // Edit states
    const [alertaActivada, setAlertaActivada] = useState(false);
    const [stockMinimo, setStockMinimo] = useState(0);
    const [historial, setHistorial] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // New history states
    const [newMes, setNewMes] = useState(new Date().getMonth() + 1);
    const [newAnio, setNewAnio] = useState(new Date().getFullYear());
    const [newCantidad, setNewCantidad] = useState('');

    const fetchVariantes = async () => {
        try {
            const data = await executeAWSQuery(`
                SELECT v.id, v.nombre_variante, v.codigo_variante, p.nombre as prod_nombre, 
                       v.alerta_activada, v.stock_minimo_esperado
                FROM Stock_Variantes v 
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id 
                ORDER BY p.nombre, v.nombre_variante
            `);
            setVariantes(data || []);
        } catch (e) {
            toast.error("Error cargando variantes");
        }
    };

    useEffect(() => {
        fetchVariantes();
    }, []);

    const handleSelectVar = async (v: any) => {
        setSelectedVarId(v.id);
        setAlertaActivada(!!v.alerta_activada);
        setStockMinimo(v.stock_minimo_esperado || 0);
        await fetchHistorial(v.id);
    };

    const fetchHistorial = async (vid: number) => {
        setIsLoading(true);
        try {
            const data = await executeAWSQuery(`SELECT * FROM Stock_Consumo_Historico WHERE variante_id = ${vid} ORDER BY anio DESC, mes DESC`);
            setHistorial(data || []);
        } catch (e) {
            toast.error("Error cargando historial");
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!selectedVarId) return;
        try {
            await executeAWSQuery(`UPDATE Stock_Variantes SET alerta_activada = ${alertaActivada ? 1 : 0}, stock_minimo_esperado = ${stockMinimo} WHERE id = ${selectedVarId}`);
            toast.success("Configuración guardada");
            fetchVariantes();
        } catch (e) {
            toast.error("Error guardando configuración");
        }
    };

    const addHistorial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVarId) return;
        if (!newCantidad || isNaN(Number(newCantidad))) return toast.error("Cantidad inválida");

        try {
            await executeAWSQuery(`
                INSERT INTO Stock_Consumo_Historico (variante_id, mes, anio, cantidad_consumida) 
                VALUES (${selectedVarId}, ${newMes}, ${newAnio}, ${newCantidad})
            `);
            toast.success("Historial añadido");
            setNewCantidad('');
            fetchHistorial(selectedVarId);
        } catch (e) {
            toast.error("Error añadiendo historial");
        }
    };

    const deleteHistorial = async (id: number) => {
        if(!confirm('¿Eliminar este registro?')) return;
        try {
            await executeAWSQuery(`DELETE FROM Stock_Consumo_Historico WHERE id = ${id}`);
            toast.success("Registro eliminado");
            if(selectedVarId) fetchHistorial(selectedVarId);
        } catch(e) {
            toast.error("Error al eliminar");
        }
    };

    const filteredVars = variantes.filter(v => 
        (v.prod_nombre + ' ' + v.nombre_variante + ' ' + v.codigo_variante).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-7xl mx-auto mt-10">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500"/> Alertas y Consumo Predictivo
            </h3>
            <p className="text-slate-500 font-medium mb-8">Configura el stock mínimo por artículo y alimenta el sistema con el histórico de ventas para estimar tiempos de agotamiento.</p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lista de Variantes */}
                <div className="lg:col-span-5 flex flex-col h-[600px]">
                    <input 
                        type="text" 
                        placeholder="Buscar artículo..." 
                        className="input-nexus w-full bg-slate-50 dark:bg-slate-950 mb-4 h-12"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 border border-slate-100 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/20">
                        {filteredVars.map(v => (
                            <button 
                                key={v.id}
                                onClick={() => handleSelectVar(v)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedVarId === v.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-800'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-black text-slate-800 dark:text-slate-100 text-sm truncate pr-2">{v.prod_nombre}</span>
                                    {v.alerta_activada ? <span className="w-2 h-2 rounded-full bg-red-500" title="Alerta Activada"></span> : null}
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">{v.nombre_variante}</span>
                                    <span className="font-bold text-slate-400">{v.codigo_variante}</span>
                                </div>
                            </button>
                        ))}
                        {filteredVars.length === 0 && <p className="text-center text-slate-400 py-10 text-sm font-bold">No hay resultados.</p>}
                    </div>
                </div>

                {/* Panel de Configuración */}
                <div className="lg:col-span-7">
                    {!selectedVarId ? (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-10">
                            <TrendingDown className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                            <p className="text-slate-500 font-bold text-center">Selecciona un artículo de la lista para configurar su comportamiento predictivo.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Card Alerta */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    1. Configuración de Alerta
                                </h4>
                                
                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={alertaActivada} 
                                            onChange={(e) => setAlertaActivada(e.target.checked)}
                                            className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-600"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Activar Alerta Predictiva</span>
                                            <span className="text-xs text-slate-500">El sistema monitoreará el stock de este artículo y avisará si cae por debajo del mínimo, estimando los días restantes.</span>
                                        </div>
                                    </label>

                                    {alertaActivada && (
                                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Stock Mínimo Esperado (Umbral de Alerta)</label>
                                            <div className="flex gap-4">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    step="0.01"
                                                    className="input-nexus flex-1 bg-white dark:bg-slate-900 h-12" 
                                                    value={stockMinimo} 
                                                    onChange={e=>setStockMinimo(Number(e.target.value))} 
                                                />
                                                <button onClick={saveSettings} className="btn-primary px-8 h-12 flex items-center gap-2 whitespace-nowrap">
                                                    <Save className="w-4 h-4" /> Guardar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Consumo Histórico */}
                            {alertaActivada && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                                <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                                    2. Alimentación Histórica (Manual)
                                </h4>
                                <p className="text-xs text-slate-500 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    Ingresa cuánto se consumió/vendió de este artículo en periodos pasados. El sistema promediará esto con el consumo reciente para predecir cuándo te quedarás sin stock.
                                </p>
                                
                                <form onSubmit={addHistorial} className="flex gap-3 mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <select className="input-nexus flex-1 bg-white dark:bg-slate-900" value={newMes} onChange={e=>setNewMes(Number(e.target.value))}>
                                        <option value={1}>Enero</option><option value={2}>Febrero</option>
                                        <option value={3}>Marzo</option><option value={4}>Abril</option>
                                        <option value={5}>Mayo</option><option value={6}>Junio</option>
                                        <option value={7}>Julio</option><option value={8}>Agosto</option>
                                        <option value={9}>Septiembre</option><option value={10}>Octubre</option>
                                        <option value={11}>Noviembre</option><option value={12}>Diciembre</option>
                                    </select>
                                    <input type="number" className="input-nexus w-24 bg-white dark:bg-slate-900" value={newAnio} onChange={e=>setNewAnio(Number(e.target.value))} />
                                    <input type="number" step="0.01" min="0" placeholder="Cant." className="input-nexus w-32 bg-white dark:bg-slate-900" value={newCantidad} onChange={e=>setNewCantidad(e.target.value)} required />
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 flex items-center justify-center transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </form>

                                {isLoading ? (
                                    <div className="flex justify-center py-4"><div className="loader"></div></div>
                                ) : (
                                    <div className="space-y-2">
                                        {historial.map(h => (
                                            <div key={h.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Mes {h.mes} / {h.anio}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-md">{h.cantidad_consumida} unid.</span>
                                                    <button onClick={() => deleteHistorial(h.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {historial.length === 0 && <p className="text-center text-xs font-bold text-slate-400 py-4">No hay registros históricos.</p>}
                                    </div>
                                )}
                            </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
