import { useState, useEffect } from 'react';
import { QrCode, Printer, X, CheckSquare, Square, AlertTriangle, Package } from 'lucide-react';
import { printLabels, LabelItem } from '../../lib/printLabel';
import { executeAWSQuery } from '../../lib/aws-client';
import toast from 'react-hot-toast';

export interface PrintLabelEntry {
  /** Para granel: variante_id. Para lote_individual: Stock_Etiquetas.id */
  variante_id: string | number;
  etiqueta_id?: string | number; // si ya existe la etiqueta física insertada
  etiqueta_ids?: (string | number)[]; // colección de IDs disponibles al recibir lote individual
  compra_id?: string;
  producto_nombre: string;
  nombre_variante?: string;
  cantidad?: number;
  sku?: string | null;
  tipo_gestion?: 'granel' | 'lote_individual';
  bultos_predefinidos?: number;
}

interface PrintLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  detalles: PrintLabelEntry[];
}

export function PrintLabelsModal({ isOpen, onClose, detalles }: PrintLabelsModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bultosPorItem, setBultosPorItem] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [printSize, setPrintSize] = useState<'grid' | '10x15' | '4x4' | 'custom'>('10x15');
  const [customWidth, setCustomWidth] = useState<number>(100);
  const [customHeight, setCustomHeight] = useState<number>(100);

  useEffect(() => {
    if (isOpen) {
      // Seleccionar todas por defecto
      const keys = new Set(detalles.map((d, i) => getKey(d, i)));
      setSelectedKeys(keys);

      const bts: Record<string, number> = {};
      detalles.forEach((d, i) => {
         bts[getKey(d, i)] = d.bultos_predefinidos || 1;
      });
      setBultosPorItem(bts);
    }
  }, [isOpen, detalles]);

  if (!isOpen) return null;

  const getKey = (d: PrintLabelEntry, i: number) => {
    // Si tiene etiqueta física real, la usamos como key única
    if (d.etiqueta_id != null) return `etq-${d.etiqueta_id}`;
    return `var-${d.variante_id}-${i}`;
  };

  const toggleItem = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedKeys.size === detalles.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(detalles.map((d, i) => getKey(d, i))));
    }
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    let updatedItemsToPrint: LabelItem[] = [];

    for (let i = 0; i < detalles.length; i++) {
        const d = detalles[i];
        const key = getKey(d, i);
        if (!selectedKeys.has(key)) continue;

        const bultos = bultosPorItem[key] || 1;
        const ids = d.etiqueta_ids && d.etiqueta_ids.length > 0
            ? d.etiqueta_ids
            : d.etiqueta_id != null ? [d.etiqueta_id] : null;

        if (ids && ids.length > 0) {
            if (ids.length === 1) {
                // Si es un solo ID, repetimos la cantidad de bultos/copias solicitada
                for (let j = 0; j < bultos; j++) {
                    updatedItemsToPrint.push({
                        id: ids[0],
                        producto_padre: d.producto_nombre,
                        nombre_variante: d.nombre_variante,
                        sku: d.sku ?? undefined,
                        tipo_gestion: d.tipo_gestion ?? 'granel',
                        cantidad: d.cantidad
                    });
                }
            } else {
                // Caso de múltiples etiquetas físicas distintas: 1 por ID
                for (const etqId of ids) {
                    updatedItemsToPrint.push({
                        id: etqId,
                        producto_padre: d.producto_nombre,
                        nombre_variante: d.nombre_variante,
                        sku: d.sku ?? undefined,
                        tipo_gestion: d.tipo_gestion ?? 'granel',
                        cantidad: d.cantidad
                    });
                }
            }
        } else {
            // Sin IDs (raro): fallback a variante_id con las copias que el usuario define
            for (let j = 0; j < bultos; j++) {
                updatedItemsToPrint.push({
                    id: d.variante_id,
                    producto_padre: d.producto_nombre,
                    nombre_variante: d.nombre_variante,
                    sku: d.sku ?? undefined,
                    tipo_gestion: d.tipo_gestion ?? 'granel',
                    cantidad: d.cantidad
                });
            }
        }
    }

    if (updatedItemsToPrint.length === 0) {
        setIsProcessing(false);
        return;
    }
    
    await printLabels(updatedItemsToPrint, {
        size: printSize,
        customWidth: printSize === 'custom' ? customWidth : undefined,
        customHeight: printSize === 'custom' ? customHeight : undefined
    });
    setIsProcessing(false);
    onClose();
  };

  const allSelected = selectedKeys.size === detalles.length;
  const countSelected = selectedKeys.size;
  const sumBultos = detalles.reduce((acc, d, i) => {
      const key = getKey(d, i);
      if (!selectedKeys.has(key)) return acc;
      const idsLen = d.etiqueta_ids ? d.etiqueta_ids.length : -1;
      const etqCount = (d.etiqueta_ids && d.etiqueta_ids.length > 1)
          ? d.etiqueta_ids.length
          : (bultosPorItem[key] || 1);
      console.log('[SUMBULTOS]', d.producto_nombre, d.nombre_variante, 'ids_len:', idsLen, 'etiqueta_id:', d.etiqueta_id, 'etqCount:', etqCount);
      return acc + etqCount;
  }, 0);




  // Separar por tipo para mostrar info
  const granelCount = detalles.filter(d => d.tipo_gestion !== 'lote_individual').length;
  const loteIndCount = detalles.filter(d => d.tipo_gestion === 'lote_individual').length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6" />
            <div>
              <h2 className="font-black text-lg leading-none">Imprimir Etiquetas</h2>
              <p className="text-indigo-200 text-xs font-medium mt-0.5">
                Seleccioná cuáles querés imprimir y definí los bultos (Lotes)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-indigo-700 hover:bg-indigo-800 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info badges */}
        {(granelCount > 0 || loteIndCount > 0) && (
          <div className="px-6 py-2 flex gap-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            {granelCount > 0 && (
              <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider">
                🔵 {granelCount} Granel — QR = ID x Bulto
              </span>
            )}
            {loteIndCount > 0 && (
              <span className="text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">
                🟡 {loteIndCount} Únicas — QR = ID Único
              </span>
            )}
          </div>
        )}

        {/* Lote individual warning if no etiqueta_id */}
        {detalles.some(d => d.tipo_gestion === 'lote_individual' && !d.etiqueta_id) && (
          <div className="px-6 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Las etiquetas de piezas únicas deben imprimirse DESPUÉS del ingreso físico. Si las imprimís ahora, el sistema fallará.
            </p>
          </div>
        )}

        {/* Print Size Selection */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
               <Printer className="w-4 h-4"/> Formato de Etiqueta
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                    { id: '10x15', nom: '10x15 cm' },
                    { id: '4x4', nom: '4x4 cm' },
                    { id: 'grid', nom: 'A4 Grid' },
                    { id: 'custom', nom: 'A Medida' }
                ].map(sz => (
                    <button 
                       key={sz.id}
                       onClick={() => setPrintSize(sz.id as any)}
                       className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${printSize === sz.id ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                    >
                       {sz.nom}
                    </button>
                ))}
            </div>
            {printSize === 'custom' && (
                <div className="flex items-center gap-4 mt-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-slate-400">Ancho (mm)</span>
                        <input type="number" min="10" className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 outline-none text-sm font-bold" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-slate-400">Alto (mm)</span>
                        <input type="number" min="10" className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 outline-none text-sm font-bold" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} />
                    </div>
                </div>
            )}
        </div>

        {/* Toggle All */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full"
          >
            {allSelected
              ? <CheckSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              : <Square className="w-5 h-5 text-slate-400 flex-shrink-0" />
            }
            {allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
            <span className="ml-auto text-xs font-normal text-slate-400">
              {countSelected} de {detalles.length} seleccionadas
            </span>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto max-h-[50vh]">
          {detalles.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-bold text-sm">
              No hay artículos en esta orden.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {detalles.map((d, i) => {
                const key = getKey(d, i);
                const isChecked = selectedKeys.has(key);
                const esLoteInd = d.tipo_gestion === 'lote_individual';
                const hasRealId = d.etiqueta_id != null;
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggleItem(key)}
                      className="w-full flex items-center gap-4 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                    >
                      {isChecked
                        ? <CheckSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        : <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                          {d.producto_nombre}
                        </p>
                        {d.nombre_variante && (
                          <p className="text-xs text-slate-500 font-medium truncate">{d.nombre_variante}</p>
                        )}
                        {!esLoteInd && hasRealId && (
                           <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                               Total Original: {d.cantidad}
                           </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {esLoteInd ? (
                          <>
                           <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 uppercase">
                             {hasRealId ? `ETQ: ${d.etiqueta_id}` : `PIEZA ÚNICA`}
                           </span>
                           <div className="mt-1 flex items-center gap-1 bg-white border border-slate-200 rounded px-1 shadow-sm" onClick={(e) => e.stopPropagation()}>
                               <span className="text-[8px] font-black text-slate-400 uppercase">Copias:</span>
                               <input 
                                   type="number" 
                                   min="1" 
                                   max="5000"
                                   className="w-10 text-[10px] font-bold text-center outline-none bg-transparent"
                                   value={bultosPorItem[key] || 1}
                                   onChange={(e) => setBultosPorItem({...bultosPorItem, [key]: Number(e.target.value) || 1})}
                               />
                           </div>
                          </>
                        ) : (
                          <>
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 uppercase">
                               {hasRealId ? `LOTE O. ${d.etiqueta_id}` : `VAR: ${d.variante_id}`}
                            </span>
                            
                            <div className="mt-1 flex items-center gap-1 bg-white border border-slate-200 rounded px-1 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[8px] font-black text-slate-400 uppercase">Cajas:</span>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="5000"
                                    className="w-10 text-[10px] font-bold text-center outline-none bg-transparent"
                                    value={bultosPorItem[key] || 1}
                                    onChange={(e) => setBultosPorItem({...bultosPorItem, [key]: Number(e.target.value) || 1})}
                                />
                            </div>
                          </>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePrint}
            disabled={isProcessing || countSelected === 0}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
          >
            <Printer className="w-5 h-5" />
            {isProcessing ? 'Procesando...' : `Imprimir (${sumBultos}) Etiquetas`}
          </button>
        </div>
      </div>
    </div>
  );
}
