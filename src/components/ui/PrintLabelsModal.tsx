import { useState, useEffect } from 'react';
import { QrCode, Printer, X, CheckSquare, Square, AlertTriangle, Package } from 'lucide-react';
import { printLabels, LabelItem } from '../../lib/printLabel';

export interface PrintLabelEntry {
  /** Para granel: variante_id. Para lote_individual: Stock_Etiquetas.id */
  variante_id: string | number;
  etiqueta_id?: string | number; // si ya existe la etiqueta física insertada
  producto_nombre: string;
  nombre_variante?: string;
  cantidad?: number;
  sku?: string | null;
  tipo_gestion?: 'granel' | 'lote_individual';
}

interface PrintLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  detalles: PrintLabelEntry[];
}

export function PrintLabelsModal({ isOpen, onClose, detalles }: PrintLabelsModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Seleccionar todas por defecto
      const keys = new Set(detalles.map((d, i) => getKey(d, i)));
      setSelectedKeys(keys);
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
    const itemsToPrint: LabelItem[] = detalles
      .filter((d, i) => selectedKeys.has(getKey(d, i)))
      .map(d => {
        const esLoteInd = d.tipo_gestion === 'lote_individual';
        return {
          // Para lote_individual el QR lleva el ID físico de la etiqueta
          // Para granel lleva el variante_id
          id: esLoteInd && d.etiqueta_id != null ? d.etiqueta_id : d.variante_id,
          producto_padre: d.producto_nombre,
          nombre_variante: d.nombre_variante,
          sku: d.sku ?? undefined,
          tipo_gestion: d.tipo_gestion ?? 'granel',
          cantidad: d.cantidad,
        };
      });

    if (itemsToPrint.length === 0) return;
    await printLabels(itemsToPrint);
    onClose();
  };

  const allSelected = selectedKeys.size === detalles.length;
  const countSelected = selectedKeys.size;

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
                Seleccioná cuáles querés imprimir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-indigo-700 hover:bg-indigo-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info badges */}
        {(granelCount > 0 || loteIndCount > 0) && (
          <div className="px-6 py-2 flex gap-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            {granelCount > 0 && (
              <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider">
                🔵 {granelCount} Granel — QR = Variante ID
              </span>
            )}
            {loteIndCount > 0 && (
              <span className="text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">
                🟡 {loteIndCount} Pieza Única — QR = Etiqueta ID
              </span>
            )}
          </div>
        )}

        {/* Lote individual warning if no etiqueta_id */}
        {detalles.some(d => d.tipo_gestion === 'lote_individual' && !d.etiqueta_id) && (
          <div className="px-6 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Las etiquetas de piezas únicas deben imprimirse DESPUÉS del ingreso físico, cuando el sistema ya generó su ID real. Si las imprimís ahora, el QR llevará el variante_id (provisional).
            </p>
          </div>
        )}

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
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {esLoteInd ? (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 uppercase">
                            {hasRealId ? `ETQ: ${d.etiqueta_id}` : `PIEZA ÚNICA`}
                          </span>
                        ) : (
                          <>
                            {d.cantidad != null && (
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Cant: {d.cantidad}
                              </span>
                            )}
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 uppercase">
                              VAR: {d.variante_id}
                            </span>
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
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handlePrint}
            disabled={countSelected === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow text-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir {countSelected > 0 ? `(${countSelected})` : ''} etiqueta{countSelected !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
