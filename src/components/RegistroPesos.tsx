import React, { useState, useEffect, useRef } from 'react';
import { executeAWSQuery } from '../lib/aws-client';
import { Scale, ScanBarcode, Search, CheckCircle2, ArrowRight, ListFilter, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { CategoryDrillDownModal } from './ui/CategoryDrillDownModal';
import { Modal } from './ui/Modal';

export function RegistroPesos() {
    const [scanValue, setScanValue] = useState('');
    const [selectedLabel, setSelectedLabel] = useState<any>(null);
    const [pesoInput, setPesoInput] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Manual Catalog States
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [catalogCategorias, setCatalogCategorias] = useState<any[]>([]);
    const [catalogProductos, setCatalogProductos] = useState<any[]>([]);
    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

    // Variant Labels Modal State
    const [isVariantLabelsModalOpen, setIsVariantLabelsModalOpen] = useState(false);
    const [variantLabels, setVariantLabels] = useState<any[]>([]);
    const [selectedVariantName, setSelectedVariantName] = useState('');

    const scanInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus on scan input on mount
    useEffect(() => {
        if (scanInputRef.current && !isCatalogOpen && !isVariantLabelsModalOpen && !selectedLabel) {
            scanInputRef.current.focus();
        }
    }, [isCatalogOpen, isVariantLabelsModalOpen, selectedLabel]);

    const fetchLabelData = async (labelId: string) => {
        setIsSearching(true);
        try {
            const query = `
                SELECT e.*, p.nombre as producto_nombre, v.nombre_variante as variante_nombre, p.sku
                FROM Stock_Etiquetas e
                INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                WHERE e.id = '${labelId}' OR e.codigo_barras = '${labelId}'
            `;
            const result = await executeAWSQuery(query);
            
            if (result && result.length > 0) {
                setSelectedLabel(result[0]);
                setPesoInput(result[0].peso ? result[0].peso.toString() : '');
                toast.success('Etiqueta encontrada');
            } else {
                toast.error('No se encontró ninguna etiqueta con ese código.');
                setSelectedLabel(null);
                setPesoInput('');
            }
        } catch (error) {
            console.error("Error fetching label:", error);
            toast.error('Error al buscar la etiqueta.');
        } finally {
            setIsSearching(false);
            setScanValue('');
        }
    };

    const handleScanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scanValue.trim()) return;
        fetchLabelData(scanValue.trim());
    };

    const handleSavePeso = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLabel) return;
        
        const pesoNum = parseFloat(pesoInput);
        if (isNaN(pesoNum) || pesoNum <= 0) {
            return toast.error('Ingrese un peso válido mayor a 0');
        }

        setIsSaving(true);
        try {
            await executeAWSQuery(`UPDATE Stock_Etiquetas SET peso = ${pesoNum} WHERE id = ${selectedLabel.id}`);
            toast.success(`Peso de ${pesoNum} kg guardado correctamente.`);
            
            setSelectedLabel(null);
            setPesoInput('');
            if (scanInputRef.current) scanInputRef.current.focus();
        } catch (error) {
            console.error("Error saving peso:", error);
            toast.error('Error al guardar el peso.');
        } finally {
            setIsSaving(false);
        }
    };

    const openManualCatalog = async () => {
        setIsLoadingCatalog(true);
        try {
            const prodRes = await executeAWSQuery(`
                SELECT v.*, p.nombre as producto_nombre, p.sku, p.categoria_id, p.tipo_gestion 
                FROM Stock_Variantes v 
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id 
                WHERE LOWER(p.unidad_base) IN ('kg', 'g', 'mg')
                AND EXISTS (
                   SELECT 1 FROM Stock_Etiquetas e WHERE e.variante_id = v.id AND e.estado = 'activo' AND e.cantidad_actual > 0
                )
            `);

            const prodArray = prodRes || [];
            const validCategoryIds = [...new Set(prodArray.map((p: any) => p.categoria_id))];
            let catRes: any[] = [];
            
            if (validCategoryIds.length > 0) {
                catRes = await executeAWSQuery(`SELECT id, nombre FROM Stock_Categorias WHERE id IN (${validCategoryIds.join(',')}) ORDER BY nombre`);
            }

            setCatalogCategorias(catRes || []);
            setCatalogProductos(prodArray);
            setIsCatalogOpen(true);
        } catch (e: any) {
            toast.error("Error cargando catálogo: " + e.message);
        } finally {
            setIsLoadingCatalog(false);
        }
    };

    const handleCatalogSelection = async (producto: any) => {
        // Al seleccionar un producto (variante) en el modal
        setIsCatalogOpen(false);
        setSelectedVariantName(`${producto.producto_nombre} - ${producto.nombre_variante}`);
        
        try {
            // Fetch all active labels for this variant
            const labelsQuery = `
                SELECT e.*, p.nombre as producto_nombre, v.nombre_variante as variante_nombre, p.sku
                FROM Stock_Etiquetas e
                INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                WHERE e.variante_id = ${producto.id} AND e.estado = 'activo' AND e.cantidad_actual > 0
                ORDER BY e.ultima_actualizacion ASC
            `;
            const labelsResult = await executeAWSQuery(labelsQuery);
            setVariantLabels(labelsResult || []);
            setIsVariantLabelsModalOpen(true);
        } catch (error) {
            console.error("Error fetching variant labels:", error);
            toast.error('Error al buscar las etiquetas de esta variante.');
        }
    };

    const selectLabelFromList = (label: any) => {
        setIsVariantLabelsModalOpen(false);
        setSelectedLabel(label);
        setPesoInput(label.peso ? label.peso.toString() : '');
        toast.success('Etiqueta seleccionada');
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            
            {/* ESCÁNER Y BÚSQUEDA SECTION */}
            {!selectedLabel && (
                <div className="card-nexus p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                    <form onSubmit={handleScanSubmit} className="max-w-xl mx-auto">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-4 text-center">
                            Escanear o Ingresar ID de Etiqueta
                        </label>
                        <div className="relative">
                            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500" />
                            <input
                                ref={scanInputRef}
                                type="text"
                                value={scanValue}
                                onChange={(e) => setScanValue(e.target.value)}
                                className="input-nexus w-full h-16 pl-14 text-2xl font-bold tracking-widest text-center shadow-inner"
                                placeholder="Ej. 10045"
                            />
                            <button 
                                type="submit"
                                disabled={isSearching || !scanValue}
                                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-bold disabled:opacity-50 transition-colors"
                            >
                                {isSearching ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>
                        
                        <div className="mt-8 relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-widest text-[10px]">O usar selector</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <button 
                                type="button"
                                onClick={openManualCatalog}
                                disabled={isLoadingCatalog}
                                className="btn-secondary w-full py-4 flex items-center justify-center gap-2"
                            >
                                {isLoadingCatalog ? 'Cargando Catálogo...' : <><ListFilter className="w-5 h-5"/> Buscar Manualmente</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* LABEL DETAIL & PESO INPUT */}
            {selectedLabel && (
                <div className="card-nexus p-8 bg-white dark:bg-slate-900 border-2 border-teal-100 dark:border-teal-900/30">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        
                        {/* Info del Producto */}
                        <div className="flex-1 space-y-2">
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                                Lote / ID: #{selectedLabel.id}
                            </span>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                {selectedLabel.producto_nombre}
                            </h3>
                            <p className="text-slate-500 font-bold flex gap-2">
                                <span className="text-indigo-500">{selectedLabel.sku}</span>
                                <span>&bull;</span>
                                <span>{selectedLabel.variante_nombre}</span>
                            </p>
                            <p className="text-emerald-600 font-black mt-2 text-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg inline-block">
                                Saldo Físico: {selectedLabel.cantidad_actual} {selectedLabel.unidad || 'Unidades'}
                            </p>
                        </div>

                        {/* Input de Peso */}
                        <div className="w-full md:w-auto bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <form onSubmit={handleSavePeso} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                                        Peso Físico (KG)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0.001"
                                            value={pesoInput}
                                            onChange={(e) => setPesoInput(e.target.value)}
                                            className="input-nexus w-full text-4xl font-black text-center h-20 text-teal-600 dark:text-teal-400 border-2 focus:border-teal-500 focus:ring-teal-500"
                                            placeholder="0.000"
                                            required
                                            autoFocus
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 dark:text-slate-700 text-xl">
                                            KG
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-teal-600/30 flex justify-center items-center gap-2 transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {isSaving ? 'Guardando...' : <><CheckCircle2 className="w-6 h-6" /> GUARDAR PESO</>}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedLabel(null)}
                                    className="text-slate-400 font-bold text-sm hover:text-slate-600 dark:hover:text-slate-200 mt-2"
                                >
                                    Cancelar y buscar otro
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            )}

            {/* MODALS PARA SELECCION MANUAL */}
            {isCatalogOpen && (
                <CategoryDrillDownModal 
                    isOpen={isCatalogOpen} 
                    onClose={() => setIsCatalogOpen(false)} 
                    title="Seleccionar Variante para Pesar" 
                    categorias={catalogCategorias} 
                    productos={catalogProductos} 
                    onSelect={handleCatalogSelection} 
                    closeOnSelect={false}
                    emptyMessage="Aún no hay stock físico cargado para artículos que requieran pesaje (KG, G, MG)."
                />
            )}

            {isVariantLabelsModalOpen && (
                <Modal isOpen={isVariantLabelsModalOpen} onClose={() => setIsVariantLabelsModalOpen(false)} title={`Cajas Físicas: ${selectedVariantName}`}>
                    <div className="p-2 space-y-3 max-h-[60vh] overflow-y-auto">
                        {variantLabels.length === 0 ? (
                            <p className="text-center text-slate-500 font-bold py-8">No hay stock físico activo de este producto.</p>
                        ) : (
                            variantLabels.map(label => (
                                <div key={label.id} onClick={() => selectLabelFromList(label)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors flex justify-between items-center group">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-black text-xs text-slate-500">{label.codigo_barras}</span>
                                            <span className="text-[10px] uppercase font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">LOTE #{label.id}</span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm font-bold mt-1 flex items-center gap-2">
                                            <span>Saldo: <span className="text-emerald-600">{label.cantidad_actual} unid</span></span>
                                            <span>&bull;</span>
                                            <span>Peso: <span className="text-teal-600">{label.peso ? `${label.peso} kg` : 'Sin pesar'}</span></span>
                                        </p>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                                </div>
                            ))
                        )}
                    </div>
                </Modal>
            )}

        </div>
    );
}
