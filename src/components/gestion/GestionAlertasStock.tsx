import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch, AlertTriangle, AlertCircle, Save, Check, Layers, AlertOctagon, Activity, Box } from 'lucide-react';
import { executeAWSQuery } from '../../lib/aws-client';
import { CategoryDrillDownModal } from '../ui/CategoryDrillDownModal';

export function GestionAlertasStock() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [depositos, setDepositos] = useState<any[]>([]);
    
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedItemsData, setSelectedItemsData] = useState<any[]>([]);
    
    const [globalAlerta, setGlobalAlerta] = useState<number>(0);
    const [globalCritica, setGlobalCritica] = useState<number>(0);
    const [depositoAlertas, setDepositoAlertas] = useState<Record<number, {alerta: number, critica: number}>>({});
    
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [configuredItems, setConfiguredItems] = useState<any[]>([]);
    const [configuredDepositoItems, setConfiguredDepositoItems] = useState<any[]>([]);

    useEffect(() => {
        initDbAndFetchData();
    }, []);

    const initDbAndFetchData = async () => {
        try {
            await executeAWSQuery(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Variantes]') AND name = 'cantidad_alerta')
                BEGIN
                    ALTER TABLE Stock_Variantes ADD cantidad_alerta INT NOT NULL DEFAULT 0;
                END
                
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Variantes]') AND name = 'cantidad_critica')
                BEGIN
                    ALTER TABLE Stock_Variantes ADD cantidad_critica INT NOT NULL DEFAULT 0;
                END

                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Alertas_Depositos' AND xtype='U') 
                BEGIN
                    CREATE TABLE Stock_Alertas_Depositos (
                        variante_id INT NOT NULL, 
                        deposito_id INT NOT NULL, 
                        cantidad_alerta INT NOT NULL DEFAULT 0, 
                        cantidad_critica INT NOT NULL DEFAULT 0, 
                        PRIMARY KEY (variante_id, deposito_id)
                    )
                END
            `);

            const catRes = await executeAWSQuery("SELECT id, nombre FROM Stock_Categorias ORDER BY nombre");
            if (catRes) setCategorias(catRes);

            const depRes = await executeAWSQuery("SELECT id, nombre FROM Stock_Depositos ORDER BY nombre");
            if (depRes) {
                setDepositos(depRes);
                const initialDepAlerts: Record<number, {alerta: number, critica: number}> = {};
                depRes.forEach((d: any) => {
                    initialDepAlerts[d.id] = { alerta: 0, critica: 0 };
                });
                setDepositoAlertas(initialDepAlerts);
            }

            const prodRes = await executeAWSQuery(`
                SELECT 
                    v.id, 
                    v.nombre_variante, 
                    p.categoria_id, 
                    p.id as producto_maestro_id,
                    p.nombre as producto_nombre
                FROM Stock_Variantes v
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
            `);
            if (prodRes) {
                setProductos(prodRes.map((p: any) => ({
                    ...p,
                    id: p.id.toString(),
                    nombre: p.nombre_variante ? `${p.producto_nombre} (${p.nombre_variante})` : p.producto_nombre,
                    producto_maestro_id: p.producto_maestro_id.toString(),
                    categoria_id: p.categoria_id ? p.categoria_id.toString() : null
                })));
            }

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

            const depRes = await executeAWSQuery(`
                SELECT 
                    ad.variante_id,
                    ad.deposito_id,
                    ad.cantidad_alerta,
                    ad.cantidad_critica,
                    d.nombre as deposito_nombre
                FROM Stock_Alertas_Depositos ad
                INNER JOIN Stock_Depositos d ON ad.deposito_id = d.id
                WHERE ad.cantidad_alerta > 0 OR ad.cantidad_critica > 0
            `);
            if (depRes) setConfiguredDepositoItems(depRes);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectMultiple = (ids: string[]) => {
        setSelectedIds(ids);
        
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
            
            // 1. Guardar global (Stock_Variantes)
            await executeAWSQuery(`
                UPDATE Stock_Variantes 
                SET cantidad_alerta = ${globalAlerta}, cantidad_critica = ${globalCritica}
                WHERE id IN (${idList})
            `);
            
            // 2. Guardar por deposito (Stock_Alertas_Depositos)
            await executeAWSQuery(`DELETE FROM Stock_Alertas_Depositos WHERE variante_id IN (${idList})`);
            
            const insertValues: string[] = [];
            selectedIds.forEach(vid => {
                depositos.forEach(dep => {
                    const val = depositoAlertas[dep.id];
                    if (val && (val.alerta > 0 || val.critica > 0)) {
                        insertValues.push(`(${vid}, ${dep.id}, ${val.alerta}, ${val.critica})`);
                    }
                });
            });
            
            if (insertValues.length > 0) {
                await executeAWSQuery(`
                    INSERT INTO Stock_Alertas_Depositos (variante_id, deposito_id, cantidad_alerta, cantidad_critica)
                    VALUES ${insertValues.join(',')}
                `);
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setSelectedIds([]);
                setSelectedItemsData([]);
                setGlobalAlerta(0);
                setGlobalCritica(0);
                const resetDepAlerts = {...depositoAlertas};
                Object.keys(resetDepAlerts).forEach(k => {
                    resetDepAlerts[Number(k)] = { alerta: 0, critica: 0 };
                });
                setDepositoAlertas(resetDepAlerts);
            }, 3000);
            
            fetchConfiguredItems();
        } catch (e) {
            console.error(e);
            alert("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    // Agrupar items configurados para visualización
    const groupedConfigured = configuredItems.map(item => {
        const depAlerts = configuredDepositoItems.filter(d => String(d.variante_id) === String(item.id));
        return {
            ...item,
            depositos: depAlerts
        };
    });

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
                    <AlertTriangle className="w-48 h-48 text-indigo-500" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                    <AlertOctagon className="w-8 h-8 text-rose-500"/> Configuración de Alertas
                </h3>
                <p className="text-slate-500 font-medium mb-8 max-w-2xl">
                    Establece umbrales de alerta a nivel global y por almacén. Si el stock alcanza o cae por debajo del umbral, el sistema notificará. Establecer un valor en 0 desactiva la alerta.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <PackageSearch className="w-4 h-4"/> Seleccionar Artículos
                            </label>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-bold transition-all flex flex-col items-center justify-center gap-2 hover:shadow-md"
                            >
                                <Layers className="w-6 h-6" />
                                {selectedIds.length > 0 ? (
                                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{selectedIds.length} Artículos Seleccionados</span>
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
                                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                                    {selectedItemsData.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg text-sm">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate flex-1">{item.nombre}</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{item.categoria}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 border-2 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl">
                            <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Box className="w-4 h-4" /> Alerta General (Todos los almacenes)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/> Alerta
                                    </label>
                                    <input 
                                        type="number" 
                                        className="input-nexus w-full bg-white dark:bg-slate-900 h-12 text-base font-black text-amber-600 focus:border-amber-500 focus:ring-amber-500/20"
                                        value={globalAlerta}
                                        onChange={(e) => setGlobalAlerta(Number(e.target.value))}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500"/> Crítica
                                    </label>
                                    <input 
                                        type="number" 
                                        className="input-nexus w-full bg-white dark:bg-slate-900 h-12 text-base font-black text-rose-600 focus:border-rose-500 focus:ring-rose-500/20"
                                        value={globalCritica}
                                        onChange={(e) => setGlobalCritica(Number(e.target.value))}
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {depositos.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
                                    <Layers className="w-4 h-4" /> Alertas por Almacén Específico
                                </h4>
                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                    {depositos.map(dep => (
                                        <div key={dep.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">{dep.nombre}</h5>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Alerta</label>
                                                    <input 
                                                        type="number" 
                                                        className="input-nexus w-full bg-white dark:bg-slate-900 h-10 text-sm font-bold text-amber-600"
                                                        value={depositoAlertas[dep.id]?.alerta || 0}
                                                        onChange={(e) => setDepositoAlertas({...depositoAlertas, [dep.id]: { ...depositoAlertas[dep.id], alerta: Number(e.target.value) }})}
                                                        min="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Crítica</label>
                                                    <input 
                                                        type="number" 
                                                        className="input-nexus w-full bg-white dark:bg-slate-900 h-10 text-sm font-bold text-rose-600"
                                                        value={depositoAlertas[dep.id]?.critica || 0}
                                                        onChange={(e) => setDepositoAlertas({...depositoAlertas, [dep.id]: { ...depositoAlertas[dep.id], critica: Number(e.target.value) }})}
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handleSave}
                            disabled={saving || selectedIds.length === 0 || success}
                            className={`w-full py-4 mt-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${
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

            {/* Listado de items con alertas activas */}
            {groupedConfigured.length > 0 && (
                <div className="card-nexus p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" /> Artículos con Alertas Activas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupedConfigured.map(item => (
                            <div key={item.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col relative overflow-hidden">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{item.categoria_nombre || 'Sin Familia'}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate mb-4">{item.nombre_variante}</span>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Global</span>
                                        <div className="flex gap-3">
                                            <div className="flex items-center gap-1.5" title="Nivel de Alerta">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                <span className="text-xs font-black text-amber-600">{item.cantidad_alerta}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Nivel Crítico">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                <span className="text-xs font-black text-rose-600">{item.cantidad_critica}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {item.depositos && item.depositos.length > 0 && (
                                        <div className="space-y-1.5">
                                            {item.depositos.map((dep: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{dep.deposito_nombre}</span>
                                                    <div className="flex gap-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></div>
                                                            <span className="text-[11px] font-bold text-amber-600">{dep.cantidad_alerta}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50"></div>
                                                            <span className="text-[11px] font-bold text-rose-600">{dep.cantidad_critica}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <CategoryDrillDownModal
                    title="Seleccionar Artículos para Alertas"
                    isOpen={true}
                    categorias={categorias}
                    productos={productos}
                    onSelect={() => {}}
                    multiSelect={true}
                    onSelectMultiple={handleSelectMultiple}
                    activeItemIds={selectedIds}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
