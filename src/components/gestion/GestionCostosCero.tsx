import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch, DollarSign, Save, Check, Layers, AlertCircle, Search } from 'lucide-react';
import { executeAWSQuery } from '../../lib/aws-client';
import { CategoryDrillDownModal } from '../ui/CategoryDrillDownModal';
import toast from 'react-hot-toast';

export function GestionCostosCero() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [productosCero, setProductosCero] = useState<any[]>([]);
    
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // 1. Cargar categorias
            const catRes = await executeAWSQuery("SELECT id, nombre FROM Stock_Categorias ORDER BY nombre");
            setCategorias(catRes || []);

            // 2. Cargar VARIANTES que tienen costo 0 o null
            const prodRes = await executeAWSQuery(`
                SELECT 
                    v.id, 
                    v.nombre_variante as nombre, 
                    v.costo,
                    p.id as producto_maestro_id,
                    p.nombre as producto_nombre,
                    p.categoria_id,
                    c.nombre as cat_nombre
                FROM Stock_Variantes v
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                WHERE (v.costo IS NULL OR v.costo = 0)
            `);
            setProductosCero(prodRes || []);
        } catch (e) {
            console.error("Error loading data:", e);
        }
    };

    const handleSelectMultiple = (ids: string[]) => {
        const selected = ids.map(id => {
            const found = productosCero.find(p => p.id.toString() === id.toString());
            return {
                ...found,
                nuevoCosto: 0,
                nuevaMoneda: 'USD'
            };
        }).filter(p => p.id); // Filter out any undefined
        setSelectedItems(selected);
    };

    const handleSave = async () => {
        if (selectedItems.length === 0) return;
        
        const hasInvalid = selectedItems.some(item => item.nuevoCosto < 0);
        if (hasInvalid) return toast.error("Los costos deben ser mayores o iguales a 0");

        setSaving(true);
        try {
            // Actualización por lotes
            for (const item of selectedItems) {
                await executeAWSQuery(`UPDATE Stock_Variantes SET costo = ${item.nuevoCosto}, moneda = '${item.nuevaMoneda}' WHERE id = ${item.id}`);
            }
            
            toast.success("Costos actualizados correctamente");
            setSelectedItems([]);
            fetchData(); // Refresh list of items with cost 0
        } catch (e) {
            console.error(e);
            toast.error("Error al guardar los costos");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <DollarSign className="w-48 h-48 text-emerald-500" />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-emerald-500"/> Asignación de Costos
                        </h3>
                        <p className="text-slate-500 font-medium">
                            Visualiza y asigna costos a los artículos que actualmente figuran con costo 0.
                        </p>
                    </div>
                    
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
                    >
                        <PackageSearch className="w-5 h-5" />
                        Seleccionar Artículos (Costo 0)
                    </button>
                </div>

                {selectedItems.length > 0 ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedItems.map((item, idx) => (
                                <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{item.cat_nombre || 'Sin Familia'}</p>
                                            <p className="font-bold text-slate-800 dark:text-white truncate">{item.producto_nombre} {item.nombre && `(${item.nombre})`}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="relative flex-1 md:w-40">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="number"
                                                step="0.01"
                                                value={item.nuevoCosto}
                                                onChange={(e) => {
                                                    const newVal = parseFloat(e.target.value) || 0;
                                                    const updated = [...selectedItems];
                                                    updated[idx].nuevoCosto = newVal;
                                                    setSelectedItems(updated);
                                                }}
                                                className="w-full pl-9 pr-16 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                                                placeholder="0.00"
                                            />
                                            <select 
                                                value={item.nuevaMoneda || 'USD'}
                                                onChange={(e) => {
                                                    const updated = [...selectedItems];
                                                    updated[idx].nuevaMoneda = e.target.value;
                                                    setSelectedItems(updated);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent text-xs font-bold text-slate-500 outline-none cursor-pointer"
                                            >
                                                <option value="USD">USD</option>
                                                <option value="UYU">UYU</option>
                                            </select>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))}
                                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                                        >
                                            <Check className="w-5 h-5 rotate-45" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {saving ? (
                                    <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Guardando...</>
                                ) : (
                                    <><Save className="w-5 h-5" /> Guardar Todos los Costos</>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="font-bold text-slate-400">No hay artículos seleccionados para asignar costo.</p>
                        <p className="text-xs text-slate-400 mt-1">Usa el botón superior para buscar artículos con costo 0.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <CategoryDrillDownModal
                    title="Seleccionar Artículos con Costo 0"
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    categorias={categorias}
                    productos={productosCero.map(p => ({
                        id: p.id.toString(),
                        nombre: p.nombre ? `${p.producto_nombre} (${p.nombre})` : p.producto_nombre,
                        nombre_variante: p.nombre,
                        producto_nombre: p.producto_nombre,
                        categoria_id: p.categoria_id ? p.categoria_id.toString() : null,
                        cat_nombre: p.cat_nombre,
                        producto_maestro_id: p.producto_maestro_id ? p.producto_maestro_id.toString() : null
                    }))}
                    onSelect={() => {}}
                    multiSelect={true}
                    onSelectMultiple={handleSelectMultiple}
                    activeItemIds={selectedItems.map(i => i.id.toString())}
                    emptyMessage="No se encontraron artículos con costo 0 en esta categoría."
                />
            )}
        </div>
    );
}
