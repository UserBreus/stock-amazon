import React, { useState } from 'react';
import { useUIConfig, DynamicUIIcon } from '../../context/UIContext';
import * as LucideIcons from 'lucide-react';
import { X, Search, CheckCircle2, Save, Undo2, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function UiEditorPanel() {
    const { isEditMode, editingComponentId, setEditingComponentId, uiConfigs, updateConfigLocal, saveConfigToDB, refreshConfigs } = useUIConfig();
    
    // Inject default parameters if the button hasn't been saved to DB yet
    const config = editingComponentId ? (uiConfigs[editingComponentId] || {
        component_id: editingComponentId,
        group_area: 'general',
        label: 'Nuevo Botón',
        sub_label: '',
        icon_type: 'lucide',
        icon_value: 'Box',
        icon_color: '',
        bg_color: '',
        order_index: 99
    }) : null;

    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isEditMode) return null;

    const lucideKeys = Object.keys(LucideIcons).filter(k => k !== 'createLucideIcon' && k !== 'default');
    
    // Diccionario de traducción para buscar iconos en español
    const wmsDictionary: Record<string, string[]> = {
        'caja': ['box', 'package', 'archive', 'container'],
        'camion': ['truck', 'car', 'bus', 'van'],
        'transporte': ['truck', 'navigation', 'map', 'send'],
        'usuario': ['user', 'users', 'person', 'contact'],
        'dinero': ['dollar', 'coins', 'banknote', 'credit-card', 'wallet', 'piggy-bank'],
        'finanzas': ['trending-up', 'bar-chart', 'pie-chart', 'activity'],
        'documento': ['file', 'file-text', 'clipboard', 'book', 'folder'],
        'configuracion': ['settings', 'tool', 'wrench', 'slider', 'cog'],
        'alerta': ['alert', 'bell', 'triangle', 'warning'],
        'flecha': ['arrow', 'chevron', 'move'],
        'herramienta': ['hammer', 'wrench', 'scissors', 'pen', 'ruler'],
        'escaneo': ['scan', 'barcode', 'qr-code', 'maximize'],
        'compras': ['shopping-cart', 'shopping-bag', 'store', 'tag'],
        'tiempo': ['clock', 'watch', 'calendar', 'timer'],
        'red': ['network', 'wifi', 'share', 'globe', 'link'],
        'seguridad': ['shield', 'lock', 'key']
    };

    const smartTags = [
        { label: "Cajas", val: "caja" },
        { label: "Transporte", val: "camion" },
        { label: "Usuarios", val: "usuario" },
        { label: "Dinero", val: "dinero" },
        { label: "Finanzas", val: "finanzas" },
        { label: "Docs", val: "documento" },
        { label: "Flechas", val: "flecha" },
        { label: "Escaner", val: "escaneo" },
        { label: "Compras", val: "compras" },
        { label: "Ajustes", val: "configuracion" }
    ];

    // Buscador Mejorado bilingue
    const filteredLucide = lucideKeys.filter(k => {
        if (!searchTerm) return true;
        const lowTerm = searchTerm.toLowerCase();
        
        // Si la busqueda inglesa coincide directo
        if (k.toLowerCase().includes(lowTerm)) return true;

        // Si la busqueda española es parte de nuestras keys del diccionario
        for (const [esWord, enArray] of Object.entries(wmsDictionary)) {
            if (esWord.includes(lowTerm)) { // Si busco "caj" entra en "caja"
                if (enArray.some(en => k.toLowerCase().includes(en))) return true;
            }
        }
        return false;
    }).slice(0, 150);

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);
        try {
            await saveConfigToDB(config);
            await refreshConfigs(); // Refresh fully from DB to ensure everyone has same
            toast.success("Componente Visual Guardado");
        } catch(e) { toast.error("Error guardando el botón"); }
        finally { setIsSaving(false); }
    };

    return (
        <AnimatePresence>
            {config && (
                <>
                {/* Backdrop */}
                <motion.div 
                    initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[99]"
                    onClick={() => setEditingComponentId(null)}
                />
                
                {/* Editor Panel */}
                <motion.div 
                    initial={{x: '100%'}} animate={{x: 0}} exit={{x: '100%'}} transition={{type: 'spring', damping: 25, stiffness: 200}}
                    className="fixed top-0 right-0 h-screen w-full md:w-[480px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[100] flex flex-col overflow-hidden"
                >
                    <div className="flex justify-between items-center px-6 py-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-b border-indigo-800">
                        <div className="flex items-center gap-3">
                            <LayoutTemplate className="w-5 h-5 text-blue-300" />
                            <div>
                               <h2 className="text-base font-black tracking-tight leading-tight">Constructor Visual</h2>
                               <p className="text-[10px] text-blue-300 uppercase tracking-widest font-bold">Editando: {config.component_id}</p>
                            </div>
                        </div>
                        <button onClick={() => setEditingComponentId(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        
                        {/* 1. LABLES AND TEXTS */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">1. Titulación</h3>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Título Principal</label>
                                <input 
                                    className="input-nexus w-full bg-slate-50 dark:bg-slate-900/50" 
                                    value={config.label} 
                                    onChange={e => updateConfigLocal(config.component_id, { label: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Texto Secundario (Si aplica)</label>
                                <textarea 
                                    className="input-nexus w-full h-20 bg-slate-50 dark:bg-slate-900/50 resize-none text-xs" 
                                    value={config.sub_label || ''} 
                                    onChange={e => updateConfigLocal(config.component_id, { sub_label: e.target.value })} 
                                />
                            </div>
                        </div>

                        {/* 2. COLORS */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">2. Apariencia Tonal</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Tinte del Ícono</label>
                                    <select 
                                        className="input-nexus w-full bg-slate-50 dark:bg-slate-900/50 text-xs font-bold"
                                        value={config.icon_color}
                                        onChange={e => updateConfigLocal(config.component_id, { icon_color: e.target.value })}
                                    >
                                        <option value="text-blue-600">Azul Corporativo</option>
                                        <option value="text-indigo-600">Índigo Brillante</option>
                                        <option value="text-purple-600">Púrpura</option>
                                        <option value="text-fuchsia-600">Fucsia</option>
                                        <option value="text-rose-600">Rosa / Rojo</option>
                                        <option value="text-orange-600">Naranja Alerta</option>
                                        <option value="text-amber-600">Ámbar</option>
                                        <option value="text-emerald-600">Esmeralda Éxito</option>
                                        <option value="text-teal-600">Teal Oceánico</option>
                                        <option value="text-cyan-600">Cyan Digital</option>
                                        <option value="text-slate-600">Gris Pizarra</option>
                                        <option value="text-slate-300">Gris Claro (Boton Oscuro)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Fondo de Contenedor</label>
                                    <select 
                                        className="input-nexus w-full bg-slate-50 dark:bg-slate-900/50 text-xs font-bold"
                                        value={config.bg_color}
                                        onChange={e => updateConfigLocal(config.component_id, { bg_color: e.target.value })}
                                    >
                                        <option value="bg-blue-50">Azul Suave</option>
                                        <option value="bg-indigo-50">Índigo Suave</option>
                                        <option value="bg-purple-50">Púrpura Suave</option>
                                        <option value="bg-fuchsia-50">Fucsia Suave</option>
                                        <option value="bg-rose-50">Rosa Suave</option>
                                        <option value="bg-orange-50">Naranja Suave</option>
                                        <option value="bg-amber-50">Ámbar Suave</option>
                                        <option value="bg-emerald-50">Esmeralda Suave</option>
                                        <option value="bg-teal-50">Teal Suave</option>
                                        <option value="bg-cyan-50">Cyan Suave</option>
                                        <option value="bg-slate-100">Gris Suave</option>
                                        <option value="bg-slate-800">Gris Oscuro (Premium)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Live Preview Button */}
                            <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/20">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Previsualización del Ícono</span>
                                <div className={cn("p-4 rounded-2xl w-fit", config.bg_color)}>
                                    <DynamicUIIcon id={config.component_id} className={cn("w-8 h-8", config.icon_color)} />
                                </div>
                            </div>
                        </div>

                        {/* 3. ICON PICKER */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">3. Selector Vectorial</h3>
                            
                            {/* Smart Tags */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {smartTags.map(tag => (
                                    <button 
                                        key={tag.val}
                                        onClick={() => setSearchTerm(tag.val)}
                                        className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                               <input 
                                   type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                                   placeholder="Buscador Inteligente de Íconos..."
                                   className="input-nexus w-full pl-10 bg-slate-50 dark:bg-slate-900/50"
                               />
                            </div>
                            
                            <div className="grid grid-cols-5 gap-2 h-64 overflow-y-auto custom-scrollbar p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                {filteredLucide.map(key => {
                                    const Ico = (LucideIcons as any)[key];
                                    if(!Ico) return null;
                                    const isActive = config.icon_type === 'lucide' && config.icon_value === key;
                                    return (
                                       <button 
                                           key={key} 
                                           onClick={() => updateConfigLocal(config.component_id, { icon_type: 'lucide', icon_value: key })}
                                           title={key}
                                           className={cn(
                                               "aspect-square flex items-center justify-center rounded-xl transition-all",
                                               isActive 
                                                 ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" 
                                                 : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800"
                                           )}
                                       >
                                           <Ico className="w-5 h-5" />
                                       </button>
                                    )
                                })}
                            </div>

                            <div className="mt-4">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">O Inyectar SVG Manual (XML Raw)</label>
                                <textarea 
                                    className="input-nexus w-full h-16 bg-slate-50 dark:bg-slate-900/50 resize-none text-[10px] font-mono text-indigo-600" 
                                    placeholder="<svg>...</svg>"
                                    value={config.icon_type === 'svg' ? config.icon_value : ''} 
                                    onChange={e => updateConfigLocal(config.component_id, { icon_type: 'svg', icon_value: e.target.value })} 
                                />
                            </div>

                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
                        <button onClick={async() => { await refreshConfigs(); setEditingComponentId(null); }} className="btn-secondary w-full flex items-center justify-center gap-2">
                            <Undo2 className="w-4 h-4" /> Descartar
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Aplicar'}
                        </button>
                    </div>

                </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
