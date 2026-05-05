import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch, AlertTriangle, AlertCircle, Save, Check, Layers, AlertOctagon, Activity, Box, Edit, Trash2, Settings2, Globe, MapPin, CheckSquare, Square, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { executeAWSQuery } from '../../lib/aws-client';
import { CategoryDrillDownModal } from '../ui/CategoryDrillDownModal';

export function GestionAlertasStock() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [depositos, setDepositos] = useState<any[]>([]);
    
    // Editor form state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedItemsData, setSelectedItemsData] = useState<any[]>([]);
    
    const [globalAlerta, setGlobalAlerta] = useState<number>(0);
    const [globalCritica, setGlobalCritica] = useState<number>(0);
    const [depositoAlertas, setDepositoAlertas] = useState<Record<number, {alerta: number, critica: number, ideal: number}>>({});
    
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [configuredItems, setConfiguredItems] = useState<any[]>([]);
    const [configuredDepositoItems, setConfiguredDepositoItems] = useState<any[]>([]);
    const [activeConfigTab, setActiveConfigTab] = useState<string>('global');

    // Bulk edit from configured items
    const [selectedConfiguredIds, setSelectedConfiguredIds] = useState<string[]>([]);
    const [selectedLocationForConfig, setSelectedLocationForConfig] = useState<string | null>(null);
    const [selectedConfigKey, setSelectedConfigKey] = useState<string | null>(null);
    const [selectedFamilyForConfig, setSelectedFamilyForConfig] = useState<string | null>(null);
    const [mainTab, setMainTab] = useState<'configurar' | 'gestionar'>('configurar');

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

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Variantes]') AND name = 'cantidad_ideal')
                BEGIN
                    ALTER TABLE Stock_Variantes ADD cantidad_ideal INT NOT NULL DEFAULT 0;
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Alertas_Depositos]') AND name = 'cantidad_ideal')
                BEGIN
                    ALTER TABLE Stock_Alertas_Depositos ADD cantidad_ideal INT NOT NULL DEFAULT 0;
                END
            `);

            const catRes = await executeAWSQuery("SELECT id, nombre FROM Stock_Categorias ORDER BY nombre");
            if (catRes) setCategorias(catRes);

            const depRes = await executeAWSQuery("SELECT id, nombre FROM Stock_Depositos ORDER BY nombre");
            if (depRes) {
                setDepositos(depRes);
                const initialDepAlerts: Record<number, {alerta: number, critica: number, ideal: number}> = {};
                depRes.forEach((d: any) => {
                    initialDepAlerts[d.id] = { alerta: 0, critica: 0, ideal: 0 };
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
            // Traer variantes que tienen alerta global OR alerta local
            const res = await executeAWSQuery(`
                SELECT 
                    v.id, 
                    v.nombre_variante, 
                    p.nombre as producto_nombre,
                    ISNULL(v.cantidad_alerta, 0) as cantidad_alerta, 
                    ISNULL(v.cantidad_critica, 0) as cantidad_critica,
                    ISNULL(v.cantidad_ideal, 0) as cantidad_ideal,
                    c.nombre as categoria_nombre
                FROM Stock_Variantes v
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                WHERE ISNULL(v.cantidad_alerta, 0) > 0 OR ISNULL(v.cantidad_critica, 0) > 0 OR ISNULL(v.cantidad_ideal, 0) > 0
                OR v.id IN (SELECT variante_id FROM Stock_Alertas_Depositos WHERE cantidad_alerta > 0 OR cantidad_critica > 0 OR cantidad_ideal > 0)
                ORDER BY c.nombre, p.nombre, v.nombre_variante
            `);
            if (res) setConfiguredItems(res);

            const depRes = await executeAWSQuery(`
                SELECT 
                    ad.variante_id,
                    ad.deposito_id,
                    ad.cantidad_alerta,
                    ad.cantidad_critica,
                    ad.cantidad_ideal,
                    d.nombre as deposito_nombre
                FROM Stock_Alertas_Depositos ad
                INNER JOIN Stock_Depositos d ON ad.deposito_id = d.id
                WHERE ad.cantidad_alerta > 0 OR ad.cantidad_critica > 0 OR ad.cantidad_ideal > 0
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

    const handleEditItem = (item: any) => {
        setSelectedIds([item.id.toString()]);
        setSelectedItemsData([{
            id: item.id.toString(),
            nombre: item.nombre_variante ? `${item.producto_nombre} (${item.nombre_variante})` : item.producto_nombre,
            categoria: item.categoria_nombre || 'Sin familia'
        }]);
        setGlobalAlerta(item.cantidad_alerta || 0);
        setGlobalCritica(item.cantidad_critica || 0);
        
        const resetDepAlerts = {...depositoAlertas};
        Object.keys(resetDepAlerts).forEach(k => {
            resetDepAlerts[Number(k)] = { alerta: 0, critica: 0, ideal: 0 };
        });
        if (item.depositos && item.depositos.length > 0) {
            item.depositos.forEach((dep: any) => {
                if (resetDepAlerts[dep.deposito_id]) {
                    resetDepAlerts[dep.deposito_id] = { alerta: dep.cantidad_alerta, critica: dep.cantidad_critica, ideal: dep.cantidad_ideal || 0 };
                }
            });
        }
        setDepositoAlertas(resetDepAlerts);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBulkEditFromConfigured = () => {
        if (selectedConfiguredIds.length === 0) return;

        const itemsToEdit = groupedConfigured.filter(i => selectedConfiguredIds.includes(i.id.toString()));
        setSelectedIds(itemsToEdit.map(i => i.id.toString()));
        setSelectedItemsData(itemsToEdit.map(i => ({
            id: i.id.toString(),
            nombre: i.nombre_variante ? `${i.producto_nombre} (${i.nombre_variante})` : i.producto_nombre,
            categoria: i.categoria_nombre || 'Sin familia'
        })));

        if (itemsToEdit.length === 1) {
            // Pre-fill
            const item = itemsToEdit[0];
            setGlobalAlerta(item.cantidad_alerta || 0);
            setGlobalCritica(item.cantidad_critica || 0);
            
            const resetDepAlerts = {...depositoAlertas};
            Object.keys(resetDepAlerts).forEach(k => {
                resetDepAlerts[Number(k)] = { alerta: 0, critica: 0, ideal: 0 };
            });
            if (item.depositos && item.depositos.length > 0) {
                item.depositos.forEach((dep: any) => {
                    if (resetDepAlerts[dep.deposito_id]) {
                        resetDepAlerts[dep.deposito_id] = { alerta: dep.cantidad_alerta, critica: dep.cantidad_critica, ideal: dep.cantidad_ideal || 0 };
                    }
                });
            }
            setDepositoAlertas(resetDepAlerts);
        } else {
            // Multiple edit, clear inputs for bulk overwrite
            setGlobalAlerta(0);
            setGlobalCritica(0);
            const resetDepAlerts = {...depositoAlertas};
            Object.keys(resetDepAlerts).forEach(k => {
                resetDepAlerts[Number(k)] = { alerta: 0, critica: 0, ideal: 0 };
            });
            setDepositoAlertas(resetDepAlerts);
        }

        setSelectedConfiguredIds([]); // clear selection
        setMainTab('configurar');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteConfigured = async () => {
        if (selectedConfiguredIds.length === 0) return;
        
        if (!window.confirm(`¿Estás seguro de que deseas eliminar las alertas de ${selectedConfiguredIds.length} artículo(s)?`)) return;

        setSaving(true);
        try {
            const idList = selectedConfiguredIds.join(',');
            
            // 1. Borrar globales (volver a 0)
            await executeAWSQuery(`
                UPDATE Stock_Variantes 
                SET cantidad_alerta = 0, cantidad_critica = 0
                WHERE id IN (${idList})
            `);
            
            // 2. Borrar locales (eliminar registro)
            await executeAWSQuery(`DELETE FROM Stock_Alertas_Depositos WHERE variante_id IN (${idList})`);

            setSelectedConfiguredIds([]);
            fetchConfiguredItems();
        } catch (e) {
            console.error(e);
            alert("Error al eliminar la configuración");
        } finally {
            setSaving(false);
        }
    };

    const toggleConfiguredSelection = (id: string) => {
        setSelectedConfiguredIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (selectedIds.length === 0) return;
        setSaving(true);
        try {
            const idList = selectedIds.join(',');
            
            if (activeConfigTab === 'global') {
                // 1. Guardar global (Stock_Variantes)
                await executeAWSQuery(`
                    UPDATE Stock_Variantes 
                    SET cantidad_alerta = ${globalAlerta}, cantidad_critica = ${globalCritica}
                    WHERE id IN (${idList})
                `);
            } else {
                // 2. Guardar por deposito (Stock_Alertas_Depositos) para el almacén activo
                const depId = activeConfigTab;
                const val = depositoAlertas[Number(depId)];
                
                await executeAWSQuery(`DELETE FROM Stock_Alertas_Depositos WHERE variante_id IN (${idList}) AND deposito_id = ${depId}`);
                
                if (val && (val.alerta > 0 || val.critica > 0 || val.ideal > 0)) {
                    const insertValues = selectedIds.map(vid => `(${vid}, ${depId}, ${val.alerta}, ${val.critica}, ${val.ideal || 0})`);
                    await executeAWSQuery(`
                        INSERT INTO Stock_Alertas_Depositos (variante_id, deposito_id, cantidad_alerta, cantidad_critica, cantidad_ideal)
                        VALUES ${insertValues.join(',')}
                    `);
                }
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
                    resetDepAlerts[Number(k)] = { alerta: 0, critica: 0, ideal: 0 };
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
    const groupedConfigured = useMemo(() => {
        return configuredItems.map(item => {
            const depAlerts = configuredDepositoItems.filter(d => String(d.variante_id) === String(item.id));
            return {
                ...item,
                depositos: depAlerts
            };
        });
    }, [configuredItems, configuredDepositoItems]);

    // Identificar combinaciones únicas de alertas (Globales y por Almacén)
    const alertConfigGroups = useMemo(() => {
        const groups: Record<string, any[]> = {};
        groupedConfigured.forEach(item => {
            // Regla Global
            if (item.cantidad_alerta > 0 || item.cantidad_critica > 0) {
                const key = `General: A${item.cantidad_alerta || 0} C${item.cantidad_critica || 0}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(item);
            }
            // Reglas por Almacén
            if (item.depositos && item.depositos.length > 0) {
                item.depositos.forEach((dep: any) => {
                    const key = `${dep.deposito_nombre}: I${dep.cantidad_ideal || 0} A${dep.cantidad_alerta || 0} C${dep.cantidad_critica || 0}`;
                    if (!groups[key]) groups[key] = [];
                    // Evitar duplicar el item si ya está en la lista (caso raro de misma regla en 2 almacenes que se llamen igual, pero por seguridad)
                    if (!groups[key].find((i: any) => i.id === item.id)) {
                        groups[key].push(item);
                    }
                });
            }
        });
        return groups;
    }, [groupedConfigured]);

    // Ordenar las llaves de los grupos para que aparezcan de forma lógica
    const sortedGroupKeys = useMemo(() => {
        return Object.keys(alertConfigGroups).sort((a, b) => {
            const isGeneralA = a.startsWith("General");
            const isGeneralB = b.startsWith("General");
            if (isGeneralA && !isGeneralB) return -1;
            if (!isGeneralA && isGeneralB) return 1;
            return a.localeCompare(b, undefined, { numeric: true });
        });
    }, [alertConfigGroups]);

    // Agrupar por categoría dentro de la configuración seleccionada
    const groupedByCategory = useMemo(() => {
        if (!selectedConfigKey) return {};
        const items = alertConfigGroups[selectedConfigKey] || [];
        const byCat: Record<string, any[]> = {};
        items.forEach(item => {
            const cat = item.categoria_nombre || 'Sin Familia';
            if (!byCat[cat]) byCat[cat] = [];
            byCat[cat].push(item);
        });
        return byCat;
    }, [alertConfigGroups, selectedConfigKey]);

    // Filtrar productos disponibles (no registrados) para el modal
    const availableProducts = useMemo(() => {
        return productos.filter(p => !configuredItems.some(ci => ci.id.toString() === p.id.toString()));
    }, [productos, configuredItems]);

    const renderConfiguredCard = (item: any) => {
        const isSelected = selectedConfiguredIds.includes(item.id.toString());
        return (
            <div 
                key={item.id} 
                onClick={() => toggleConfiguredSelection(item.id.toString())}
                className={`p-4 border rounded-xl flex flex-col relative overflow-hidden transition-all cursor-pointer group ${
                    isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-sm' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
            >
                <div className="absolute top-3 right-3 text-slate-400">
                    {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Square className="w-5 h-5 opacity-50 group-hover:opacity-100" />}
                </div>

                <div className="pr-8 mb-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">{item.categoria_nombre || 'Sin Familia'}</span>
                    <span className={`font-bold truncate block ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-100'}`}>
                        {item.nombre_variante}
                    </span>
                </div>
                
                <div className="space-y-3 mt-auto">
                    {(item.cantidad_alerta > 0 || item.cantidad_critica > 0) && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Globe className="w-3 h-3"/> Global</span>
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
                    )}
                    
                    {item.depositos && item.depositos.length > 0 && (
                        <div className="space-y-1.5">
                            {item.depositos.map((dep: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[140px] flex items-center gap-1.5"><MapPin className="w-3 h-3"/> {dep.deposito_nombre}</span>
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
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            
            {/* Navegación Principal */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full max-w-md mx-auto relative z-20">
                <button
                    onClick={() => setMainTab('configurar')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-black text-sm transition-all ${
                        mainTab === 'configurar'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <Settings2 className="w-4 h-4"/> Configuración
                </button>
                <button
                    onClick={() => setMainTab('gestionar')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-black text-sm transition-all ${
                        mainTab === 'gestionar'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <Layers className="w-4 h-4"/> Gestión de Alertas
                    {groupedConfigured.length > 0 && (
                        <span className="ml-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full px-2 py-0.5 text-[10px]">
                            {groupedConfigured.length}
                        </span>
                    )}
                </button>
            </div>

            {mainTab === 'configurar' && (
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
                                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {selectedItemsData.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg text-sm shadow-sm">
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
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
                                <Layers className="w-4 h-4" /> Seleccionar Entorno
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setActiveConfigTab('global')}
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${
                                        activeConfigTab === 'global' 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <Box className="w-4 h-4 inline-block mr-1.5 align-text-bottom" />
                                    General
                                </button>
                                {depositos.map(dep => (
                                    <button
                                        key={dep.id}
                                        onClick={() => setActiveConfigTab(dep.id.toString())}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${
                                            activeConfigTab === dep.id.toString()
                                            ? 'bg-slate-700 text-white border-slate-700 shadow-md' 
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {dep.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activeConfigTab === 'global' && (
                            <div className="p-5 border-2 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> Alerta General (Todos los almacenes)
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
                        )}

                        {activeConfigTab !== 'global' && depositos.map(dep => {
                            if (dep.id.toString() !== activeConfigTab) return null;
                            return (
                                <div key={dep.id} className="p-5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-500" /> {dep.nombre}
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/> Alerta
                                            </label>
                                            <input 
                                                type="number" 
                                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12 text-base font-black text-amber-600"
                                                value={depositoAlertas[dep.id]?.alerta || 0}
                                                onChange={(e) => setDepositoAlertas({...depositoAlertas, [dep.id]: { ...depositoAlertas[dep.id], alerta: Number(e.target.value) }})}
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5 text-rose-500"/> Crítica
                                            </label>
                                            <input 
                                                type="number" 
                                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12 text-base font-black text-rose-600"
                                                value={depositoAlertas[dep.id]?.critica || 0}
                                                onChange={(e) => setDepositoAlertas({...depositoAlertas, [dep.id]: { ...depositoAlertas[dep.id], critica: Number(e.target.value) }})}
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> Ideal
                                            </label>
                                            <input 
                                                type="number" 
                                                className="input-nexus w-full bg-white dark:bg-slate-900 h-12 text-base font-black text-emerald-600"
                                                value={depositoAlertas[dep.id]?.ideal || 0}
                                                onChange={(e) => setDepositoAlertas({...depositoAlertas, [dep.id]: { ...depositoAlertas[dep.id], ideal: Number(e.target.value) }})}
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

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
            )}

            {/* Gestor de Alertas Activas */}
            {mainTab === 'gestionar' && groupedConfigured.length > 0 && (
                <div className="card-nexus bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Header Action Bar (Solo si hay seleccionados) */}
                    {selectedConfiguredIds.length > 0 && (
                        <div className="p-4 border-b border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                            <span className="text-sm font-black text-indigo-800 dark:text-indigo-200">
                                {selectedConfiguredIds.length} artículos seleccionados
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDeleteConfigured}
                                    className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-900/20 dark:text-rose-400 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 border border-rose-200 dark:border-rose-800 transition-all shadow-sm"
                                    title="Eliminar alertas"
                                >
                                    <Trash2 className="w-4 h-4"/>
                                    <span className="hidden sm:inline">Eliminar</span>
                                </button>
                                <button
                                    onClick={handleBulkEditFromConfigured}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-all"
                                >
                                    <Edit className="w-4 h-4"/>
                                    <span className="hidden sm:inline">Editar</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navegación ERP de Alertas Activas */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                {selectedLocationForConfig && (
                                    <button 
                                        onClick={() => {
                                            if (selectedConfigKey) {
                                                setSelectedConfigKey(null);
                                                setSelectedFamilyForConfig(null);
                                                setSelectedConfiguredIds([]);
                                            } else {
                                                setSelectedLocationForConfig(null);
                                            }
                                        }}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <ArrowLeft className="w-4 h-4"/>
                                        Volver
                                    </button>
                                )}
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                                        {!selectedLocationForConfig ? "1. Seleccione Entorno" : !selectedConfigKey ? `2. Umbrales en: ${selectedLocationForConfig}` : `3. Artículos en: ${selectedConfigKey}`}
                                    </h3>
                                </div>
                            </div>

                            {!selectedLocationForConfig ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
                                    {Array.from(new Set(sortedGroupKeys.map(k => k.split(': ')[0]))).map(loc => (
                                        <button
                                            key={loc}
                                            onClick={() => setSelectedLocationForConfig(loc)}
                                            className="aspect-video p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group"
                                        >
                                            {loc === 'General' ? <Globe className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors"/> : <MapPin className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors"/>}
                                            <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200 text-center">{loc}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : !selectedConfigKey ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
                                    {sortedGroupKeys.filter(k => k.startsWith(selectedLocationForConfig + ": ")).map(key => {
                                        const count = alertConfigGroups[key].length;
                                        const umbralLabel = key.split(': ')[1];
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedConfigKey(key)}
                                                className="aspect-video p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group"
                                            >
                                                <Activity className="w-6 h-6 text-emerald-500/50 group-hover:text-emerald-500 transition-colors"/>
                                                <span className="font-black text-sm sm:text-lg text-slate-800 dark:text-slate-100">{umbralLabel}</span>
                                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">{count} artículos</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Lista Agrupada por Familia (Cuadrículas) */}
                    <div className="p-6">
                        {!selectedConfigKey ? null : (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* Grid de Familias */}
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Familias Afectadas</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {Object.keys(groupedByCategory).sort().map(catName => {
                                            const isSelected = selectedFamilyForConfig === catName;
                                            const items = groupedByCategory[catName];
                                            return (
                                                <button
                                                    key={catName}
                                                    onClick={() => setSelectedFamilyForConfig(catName)}
                                                    className={`aspect-square flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                                                        isSelected 
                                                        ? 'bg-indigo-50 border-indigo-500 shadow-sm text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300 scale-95' 
                                                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-indigo-800/50'
                                                    }`}
                                                >
                                                    <Layers className={`w-8 h-8 mb-3 ${isSelected ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`}/>
                                                    <span className="font-black text-[11px] uppercase tracking-wider text-center line-clamp-2 leading-tight">{catName}</span>
                                                    <span className="mt-2 bg-slate-100 dark:bg-slate-800 rounded-full px-2.5 py-0.5 text-[10px] font-black">{items.length}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Lista de Artículos de la Familia Seleccionada */}
                                {selectedFamilyForConfig && groupedByCategory[selectedFamilyForConfig] && (
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                <PackageSearch className="w-4 h-4 text-indigo-500"/> 
                                                Artículos en: {selectedFamilyForConfig}
                                            </h4>
                                            <button 
                                                onClick={() => {
                                                    const allIds = groupedByCategory[selectedFamilyForConfig].map(i => i.id.toString());
                                                    const allSelected = allIds.every(id => selectedConfiguredIds.includes(id));
                                                    if (allSelected) {
                                                        setSelectedConfiguredIds(prev => prev.filter(id => !allIds.includes(id)));
                                                    } else {
                                                        setSelectedConfiguredIds(prev => [...new Set([...prev, ...allIds])]);
                                                    }
                                                }}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
                                            >
                                                Seleccionar Todos
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {groupedByCategory[selectedFamilyForConfig].map(item => {
                                                const isSelected = selectedConfiguredIds.includes(item.id.toString());
                                                const displayName = item.nombre_variante ? `${item.producto_nombre} (${item.nombre_variante})` : item.producto_nombre;
                                                
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleConfiguredSelection(item.id.toString())}
                                                        className={`p-4 rounded-xl border cursor-pointer transition-all select-none group relative overflow-hidden ${
                                                            isSelected
                                                            ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-500 shadow-sm'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                        }`}
                                                    >
                                                        <div className="absolute top-3 right-3">
                                                            {isSelected
                                                                ? <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
                                                                : <Square className="w-5 h-5 text-slate-200 dark:text-slate-700 group-hover:text-slate-400"/>
                                                            }
                                                        </div>

                                                        <div className="pr-8 mb-3">
                                                            <span className={`font-black text-xs leading-tight block ${
                                                                isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-200'
                                                            }`}>{displayName}</span>
                                                        </div>

                                                        {/* Valores Globales */}
                                                        {(item.cantidad_alerta > 0 || item.cantidad_critica > 0) && (
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                                    <span className="text-[10px] font-black text-amber-600">{item.cantidad_alerta || 0}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                                    <span className="text-[10px] font-black text-rose-600">{item.cantidad_critica || 0}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Umbrales Local */}
                                                        {item.depositos.length > 0 && (
                                                            <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                                {item.depositos.map((dep: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between">
                                                                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 truncate max-w-[120px]">
                                                                            <MapPin className="w-3 h-3"/>{dep.deposito_nombre}
                                                                        </span>
                                                                        <div className="flex items-center gap-2">
                                                                            {dep.cantidad_ideal > 0 && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1 rounded" title="Ideal">{dep.cantidad_ideal}</span>}
                                                                            {dep.cantidad_alerta > 0 && <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1 rounded" title="Alerta">{dep.cantidad_alerta}</span>}
                                                                            {dep.cantidad_critica > 0 && <span className="text-[10px] font-black text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-1 rounded" title="Crítica">{dep.cantidad_critica}</span>}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <CategoryDrillDownModal
                    title="Seleccionar Artículos para Alertas"
                    isOpen={true}
                    categorias={categorias}
                    productos={availableProducts}
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
