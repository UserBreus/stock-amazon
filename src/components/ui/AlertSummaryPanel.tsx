import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Box, PackageOpen, X, Layers, Check } from 'lucide-react';
import { executeAWSQuery } from '../../lib/aws-client';

export function AlertSummaryPanel() {
    const [alertsGlobal, setAlertsGlobal] = useState<{alerta: any[], critica: any[]}>({alerta: [], critica: []});
    const [alertsDeposito, setAlertsDeposito] = useState<Record<number, {nombre: string, alerta: any[], critica: any[]}>>({});
    const [depositosInfo, setDepositosInfo] = useState<any[]>([]);
    
    const [selectedDep, setSelectedDep] = useState<string | null>(null); // 'global' or deposito_id
    
    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const deps = await executeAWSQuery("SELECT id, nombre FROM Stock_Depositos ORDER BY nombre");
            if(deps) setDepositosInfo(deps);

            // 1. Obtener Stock Global por variante y comparar con Stock_Variantes
            const globalStock = await executeAWSQuery(`
                SELECT 
                    v.id,
                    v.nombre_variante,
                    p.nombre as producto_nombre,
                    v.cantidad_alerta,
                    v.cantidad_critica,
                    ISNULL((SELECT SUM(cantidad_actual) FROM Stock_Etiquetas WHERE variante_id = v.id AND estado = 'activo'), 0) as stock_real
                FROM Stock_Variantes v
                JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                WHERE v.cantidad_alerta > 0 OR v.cantidad_critica > 0
            `);
            
            const gAlerta: any[] = [];
            const gCritica: any[] = [];
            
            if (globalStock) {
                globalStock.forEach((row: any) => {
                    const s = Number(row.stock_real);
                    const c = Number(row.cantidad_critica);
                    const a = Number(row.cantidad_alerta);
                    
                    if (s <= c && c > 0) {
                        gCritica.push(row);
                    } else if (s <= a && a > 0) {
                        gAlerta.push(row);
                    }
                });
            }
            setAlertsGlobal({ alerta: gAlerta, critica: gCritica });

            // 2. Obtener Stock por deposito y comparar con Stock_Alertas_Depositos
            const depStock = await executeAWSQuery(`
                SELECT 
                    ad.deposito_id,
                    ad.variante_id,
                    v.nombre_variante,
                    p.nombre as producto_nombre,
                    ad.cantidad_alerta,
                    ad.cantidad_critica,
                    d.nombre as deposito_nombre,
                    ISNULL((SELECT SUM(cantidad_actual) FROM Stock_Etiquetas WHERE variante_id = ad.variante_id AND deposito_id = ad.deposito_id AND estado = 'activo'), 0) as stock_real
                FROM Stock_Alertas_Depositos ad
                JOIN Stock_Variantes v ON ad.variante_id = v.id
                JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                JOIN Stock_Depositos d ON ad.deposito_id = d.id
                WHERE ad.cantidad_alerta > 0 OR ad.cantidad_critica > 0
            `);

            const dAlerts: Record<number, {nombre: string, alerta: any[], critica: any[]}> = {};
            if (depStock) {
                depStock.forEach((row: any) => {
                    if (!dAlerts[row.deposito_id]) {
                        dAlerts[row.deposito_id] = { nombre: row.deposito_nombre, alerta: [], critica: [] };
                    }
                    const s = Number(row.stock_real);
                    const c = Number(row.cantidad_critica);
                    const a = Number(row.cantidad_alerta);
                    
                    if (s <= c && c > 0) {
                        dAlerts[row.deposito_id].critica.push(row);
                    } else if (s <= a && a > 0) {
                        dAlerts[row.deposito_id].alerta.push(row);
                    }
                });
            }
            setAlertsDeposito(dAlerts);

        } catch (error) {
            console.error("Error fetching alerts:", error);
        }
    };

    const totalAlertas = alertsGlobal.alerta.length + Object.values(alertsDeposito).reduce((sum, d) => sum + d.alerta.length, 0);
    const totalCriticas = alertsGlobal.critica.length + Object.values(alertsDeposito).reduce((sum, d) => sum + d.critica.length, 0);

    if (totalAlertas === 0 && totalCriticas === 0) {
        return (
            <div className="w-full mb-8">
                <div className="flex items-center gap-3 mb-4 px-1">
                    <AlertCircle className="w-5 h-5 text-slate-400" />
                    <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Control de Stock y Alertas</h2>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                        <Check className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">Todo en orden</h3>
                    <p className="text-xs text-slate-500 mt-1">Actualmente no hay ningún artículo por debajo de sus límites de alerta.</p>
                </div>
            </div>
        );
    }

    let itemsToShow: {alerta: any[], critica: any[]} | null = null;
    let titleToShow = '';

    if (selectedDep === 'global') {
        itemsToShow = alertsGlobal;
        titleToShow = 'Stock General';
    } else if (selectedDep && alertsDeposito[Number(selectedDep)]) {
        itemsToShow = alertsDeposito[Number(selectedDep)];
        titleToShow = alertsDeposito[Number(selectedDep)].nombre;
    }

    return (
        <div className="w-full mb-8">
            <div className="flex items-center gap-3 mb-4 px-1">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Control de Stock y Alertas</h2>
                <div className="flex gap-2 ml-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800/50">
                        {totalCriticas} Críticas
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
                        {totalAlertas} Bajas
                    </span>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                {/* Global Card */}
                {(alertsGlobal.alerta.length > 0 || alertsGlobal.critica.length > 0) && (
                    <div 
                        onClick={() => setSelectedDep(selectedDep === 'global' ? null : 'global')}
                        className={`flex-shrink-0 w-64 p-4 rounded-2xl border-2 transition-all cursor-pointer snap-start ${
                            selectedDep === 'global' 
                            ? 'bg-rose-50 border-rose-500 shadow-lg shadow-rose-500/20 dark:bg-rose-900/20 dark:border-rose-500' 
                            : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                <Box className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Global</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2 text-center border border-amber-100 dark:border-amber-800/30">
                                <div className="text-[10px] font-black text-amber-500 uppercase">Alertas</div>
                                <div className="text-xl font-black text-amber-600">{alertsGlobal.alerta.length}</div>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-2 text-center border border-rose-100 dark:border-rose-800/30">
                                <div className="text-[10px] font-black text-rose-500 uppercase">Críticas</div>
                                <div className="text-xl font-black text-rose-600">{alertsGlobal.critica.length}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Deposit Cards */}
                {Object.keys(alertsDeposito).map(depId => {
                    const dep = alertsDeposito[Number(depId)];
                    if (dep.alerta.length === 0 && dep.critica.length === 0) return null;
                    const isSelected = selectedDep === String(depId);
                    return (
                        <div 
                            key={depId}
                            onClick={() => setSelectedDep(isSelected ? null : String(depId))}
                            className={`flex-shrink-0 w-64 p-4 rounded-2xl border-2 transition-all cursor-pointer snap-start ${
                                isSelected 
                                ? 'bg-rose-50 border-rose-500 shadow-lg shadow-rose-500/20 dark:bg-rose-900/20 dark:border-rose-500' 
                                : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{dep.nombre}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2 text-center border border-amber-100 dark:border-amber-800/30">
                                    <div className="text-[10px] font-black text-amber-500 uppercase">Alertas</div>
                                    <div className="text-xl font-black text-amber-600">{dep.alerta.length}</div>
                                </div>
                                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-2 text-center border border-rose-100 dark:border-rose-800/30">
                                    <div className="text-[10px] font-black text-rose-500 uppercase">Críticas</div>
                                    <div className="text-xl font-black text-rose-600">{dep.critica.length}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedDep && itemsToShow && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 mt-2 relative shadow-sm">
                            <button 
                                onClick={() => setSelectedDep(null)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 pr-10">Desglose de Alertas: {titleToShow}</h3>
                            
                            {itemsToShow.critica.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Nivel Crítico
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {itemsToShow.critica.map((item, idx) => (
                                            <div key={idx} className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-xl p-3 flex justify-between items-center">
                                                <div className="flex flex-col flex-1 min-w-0 pr-3">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{item.producto_nombre}</span>
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.nombre_variante}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-medium text-slate-500">Mín: {item.cantidad_critica}</span>
                                                    <span className="text-base font-black text-rose-600">{item.stock_real}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {itemsToShow.alerta.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Nivel de Alerta
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {itemsToShow.alerta.map((item, idx) => (
                                            <div key={idx} className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-3 flex justify-between items-center">
                                                <div className="flex flex-col flex-1 min-w-0 pr-3">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{item.producto_nombre}</span>
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.nombre_variante}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-medium text-slate-500">Mín: {item.cantidad_alerta}</span>
                                                    <span className="text-base font-black text-amber-600">{item.stock_real}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
