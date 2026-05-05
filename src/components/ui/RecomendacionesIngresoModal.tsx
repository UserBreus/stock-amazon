import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Recomendacion {
    variante_id: string;
    nombre_variante: string;
    producto_nombre: string;
    unidad_base: string;
    tipo_gestion: string;
    gramos_por_metro_lineal: number | null;
    cantidad_ideal: number;
    costo_unitario_real: number;
    stock_actual: number;
    falta: number;
}

interface RecomendacionesIngresoModalProps {
    isOpen: boolean;
    onClose: () => void;
    recomendaciones: Recomendacion[];
    onConfirm: (seleccionadas: Recomendacion[], cantidades: Record<string, number>) => void;
}

export function RecomendacionesIngresoModal({ isOpen, onClose, recomendaciones, onConfirm }: RecomendacionesIngresoModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [cantidades, setCantidades] = useState<Record<string, number>>({});

    useEffect(() => {
        if (isOpen) {
            const allIds = new Set(recomendaciones.map(r => r.variante_id));
            setSelectedIds(allIds);
            
            const inicialCants: Record<string, number> = {};
            recomendaciones.forEach(r => {
                inicialCants[r.variante_id] = r.falta;
            });
            setCantidades(inicialCants);
        }
    }, [isOpen, recomendaciones]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleConfirm = () => {
        const seleccionadas = recomendaciones.filter(r => selectedIds.has(r.variante_id));
        onConfirm(seleccionadas, cantidades);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-950 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                    
                    <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-xl font-black uppercase flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-white"/> Recomendación de Ingreso
                            </h2>
                            <p className="text-xs text-amber-100 font-medium tracking-widest mt-1">
                                Según el stock actual y la configuración ideal de este almacén, sugerimos lo siguiente.
                            </p>
                        </div>
                        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"><X className="w-5 h-5"/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
                        {recomendaciones.length === 0 ? (
                            <div className="p-10 text-center flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">¡Todo en Orden!</h3>
                                <p className="text-sm font-medium text-slate-500 max-w-md">El almacén seleccionado tiene su stock al día según las configuraciones ideales o no tiene alertas configuradas.</p>
                            </div>
                        ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                                    <th className="px-6 py-4 w-10 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.size === recomendaciones.length && recomendaciones.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(new Set(recomendaciones.map(r => r.variante_id)));
                                                } else {
                                                    setSelectedIds(new Set());
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                        />
                                    </th>
                                    <th className="px-4 py-4">Artículo</th>
                                    <th className="px-4 py-4 text-center">Stock Actual</th>
                                    <th className="px-4 py-4 text-center text-indigo-500">Cantidad Ideal</th>
                                    <th className="px-6 py-4 text-center text-amber-600">Recomendación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {recomendaciones.map((r, i) => {
                                    const isSelected = selectedIds.has(r.variante_id);
                                    return (
                                        <tr key={i} className={cn("transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50", isSelected ? "bg-amber-50/30 dark:bg-amber-900/10" : "")}>
                                            <td className="px-6 py-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(r.variante_id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-black text-sm text-slate-700 dark:text-slate-200 leading-none mb-1">{r.producto_nombre}</p>
                                                {r.nombre_variante && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded w-fit">{r.nombre_variante}</p>}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="font-bold text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{r.stock_actual}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="font-bold text-sm text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">{r.cantidad_ideal}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-amber-500 hidden sm:block" />
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        disabled={!isSelected}
                                                        value={cantidades[r.variante_id] || ''}
                                                        onChange={(e) => {
                                                            setCantidades({...cantidades, [r.variante_id]: Number(e.target.value)});
                                                        }}
                                                        className={cn(
                                                            "w-20 text-center font-black text-lg bg-white dark:bg-slate-950 border-2 rounded-xl py-1 outline-none transition-colors",
                                                            isSelected ? "border-amber-400 focus:border-amber-500 text-amber-600 dark:text-amber-400" : "border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                                                        )}
                                                    />
                                                    <span className="text-xs font-bold text-slate-400 uppercase">{r.unidad_base}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                        {recomendaciones.length > 0 ? (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedIds.size} seleccionados de {recomendaciones.length}</p>
                        ) : (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sin acciones requeridas</p>
                        )}
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors uppercase text-xs tracking-widest">
                                {recomendaciones.length > 0 ? 'Omitir Sugerencias' : 'Cerrar'}
                            </button>
                            {recomendaciones.length > 0 && (
                                <button 
                                    onClick={handleConfirm}
                                    disabled={selectedIds.size === 0}
                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-black flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-orange-500/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
                                >
                                    <CheckCircle2 className="w-5 h-5"/> CARGAR SELECCIÓN
                                </button>
                            )}
                        </div>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
