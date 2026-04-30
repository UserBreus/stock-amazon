import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch, AlertTriangle, AlertCircle, Save, Check, Layers, AlertOctagon } from 'lucide-react';
import { executeAWSQuery } from '../../lib/aws-client';
import { CategoryDrillDownModal } from '../ui/CategoryDrillDownModal';

export function GestionAlertasStock() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedItemsData, setSelectedItemsData] = useState<any[]>([]);
    
    const [alerta, setAlerta] = useState<number>(0);
    const [critica, setCritica] = useState<number>(0);
    
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [configuredItems, setConfiguredItems] = useState<any[]>([]);

    useEffect(() => {
        initDbAndFetchData();
    }, []);

    const initDbAndFetchData = async () => {
        try {
            // Asegurar que existan las columnas en Stock_Variantes
            await executeAWSQuery(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Variantes]') AND name = 'cantidad_alerta')
                BEGIN
                    ALTER TABLE Stock_Variantes ADD cantidad_alerta INT NOT NULL DEFAULT 0;
                END
                
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Variantes]') AND name = 'cantidad_critica')
                BEGIN
                    ALTER TABLE Stock_Variantes ADD cantidad_critica INT NOT NULL DEFAULT 0;
                END
            `);

            // Cargar categorias y productos para el modal
            const catRes = await executeAWSQuery("SELECT id, nombre, color, emoji FROM Stock_Categorias WHERE estado = 'activo' ORDER BY nombre");
            if (catRes) setCategorias(catRes);

            const prodRes = await executeAWSQuery(`
                SELECT 
                    v.id, 
                    v.nombre_variante as nombre, 
                    p.categoria_id, 
                    p.id as maestro_id
                FROM Stock_Variantes v
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                WHERE p.estado = 'activo'
            `);
            if (prodRes) setProductos(prodRes);

            fetchConfiguredItems();
        } catch (e) {
            console.error("Error init alertas:", e);
        }
    };

    const fetchConfiguredItems = async () => {
        try {
            const res = await executeAWSQuery(`
                SELECT 
                    v.id, 
                    v.nombre_variante, 
                    v.cantidad_alerta, 
                    v.cantidad_critica,
                    c.nombre as categoria_nombre
                FROM Stock_Variantes v
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                WHERE v.cantidad_alerta > 0 OR v.cantidad_critica > 0
                ORDER BY c.nombre, v.nombre_variante
            `);
            if (res) setConfiguredItems(res);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectMultiple = (ids: string[]) => {
        setSelectedIds(ids);
        
        // Match IDs with full data
        const matched = ids.map(id => {
            const prod = productos.find(p => String(p.id) === String(id));
            const cat = prod ? categorias.find(c => String(c.id) === String(prod.categoria_id)) : null;
            return {
                id,
                nombre: prod ? prod.nombre : 'Desconocido',
                categoria: cat ? cat.nombre : 'Sin familia'
            };
        });
        setSelectedItemsData(matched);
    };

    const handleSave = async () => {
        if (selectedIds.length === 0) return;
        setSaving(true);
        try {
            const idList = selectedIds.join(',');
            await executeAWSQuery(`
                UPDATE Stock_Variantes 
                SET cantidad_alerta = ${alerta}, cantidad_critica = ${critica}
                WHERE id IN (${idList})
            `);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setSelectedIds([]);
                setSelectedItemsData([]);
                setAlerta(0);
                setCritica(0);
            }, 3000);
            
            fetchConfiguredItems();
        } catch (e) {
            console.error(e);
            alert("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
                    <AlertTriangle className="w-48 h-48 text-indigo-500" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                    <AlertOctagon className="w-8 h-8 text-rose-500"/> Alertas de Stock
                </h3>
                <p className="text-slate-500 font-medium mb-8 max-w-2xl">
                    Configura los niveles de stock mínimo (alerta) y crítico para uno o varios artículos simultáneamente.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <PackageSearch className="w-4 h-4"/> Seleccionar Artículos
                            </label>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-bold transition-all flex flex-col items-center justify-center gap-2"
                            >
                                <Layers className="w-6 h-6" />
                                {selectedIds.length > 0 ? (
                                    <span>{selectedIds.length} Artículos Seleccionados</span>
                                ) : (
                                    <span>Haz clic para elegir productos del catálogo</span>
                                )}
                            </button>
                        </div>

                        {selectedItemsData.length > 0 && (
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Elementos a configurar ({selectedItemsData.length}):
                                </h4>
                                <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-2">
                                    {selectedItemsData.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg text-sm">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{item.nombre}</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider ml-auto">{item.categoria}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500"/> Cantidad de Alerta (Poco Stock)
                            </label>
                            <input 
                                type="number" 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-14 text-lg font-black text-amber-600"
                                value={alerta}
                                onChange={(e) => setAlerta(Number(e.target.value))}
                                min="0"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">El sistema notificará cuando el stock sea menor o igual a este valor.</p>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-500"/> Cantidad Crítica (Stock Muy Bajo)
                            </label>
                            <input 
                                type="number" 
                                className="input-nexus w-full bg-white dark:bg-slate-900 h-14 text-lg font-black text-rose-600"
                                value={critica}
                                onChange={(e) => setCritica(Number(e.target.value))}
                                min="0"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">El sistema mostrará advertencias críticas cuando el stock caiga por debajo de este valor.</p>
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={saving || selectedIds.length === 0 || success}
                            className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${
                                success 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : selectedIds.length === 0 
                                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5'
                            }`}
                        >
                            {saving ? (
                                <><div className="loader w-5 h-5 border-2 border-white/30 border-t-white"></div> Guardando...</>
                            ) : success ? (
                                <><Check className="w-5 h-5"/> Configuración Guardada</>
                            ) : (
                                <><Save className="w-5 h-5"/> Establecer Límites</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Listado de items con alertas ya configuradas */}
            {configuredItems.length > 0 && (
                <div className="card-nexus p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" /> Artículos con Alertas Activas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {configuredItems.map(item => (
                            <div key={item.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{item.categoria_nombre || 'Sin Familia'}</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate mb-2">{item.nombre_variante}</span>
                                <div className="flex gap-4 mt-auto">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        <span className="text-xs font-black text-amber-600">{item.cantidad_alerta}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <span className="text-xs font-black text-rose-600">{item.cantidad_critica}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <CategoryDrillDownModal
                    title="Seleccionar Artículos para Alertas"
                    categorias={categorias}
                    productos={productos}
                    onSelect={() => {}}
                    multiSelect={true}
                    onSelectMultiple={handleSelectMultiple}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
