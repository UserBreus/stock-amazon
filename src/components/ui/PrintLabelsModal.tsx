import { useState, useEffect } from 'react';
import { QrCode, Printer, X, CheckSquare, Square } from 'lucide-react';
import { printLabels, LabelItem } from '../../lib/printLabel';

interface PrintLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  detalles: any[]; // los items de la compra ya cargados
}

export function PrintLabelsModal({ isOpen, onClose, detalles }: PrintLabelsModalProps) {
  // selectedIds: set de ids seleccionados para imprimir
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Cuando se abre el modal, seleccionar TODOS por defecto
  useEffect(() => {
    if (isOpen) {
      const allIds = new Set(detalles.map(d => String(d.variante_id)));
      setSelectedIds(allIds);
    }
  }, [isOpen, detalles]);

  if (!isOpen) return null;

  const toggleItem = (varianteId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(varianteId)) {
        next.delete(varianteId);
      } else {
        next.add(varianteId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === detalles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(detalles.map(d => String(d.variante_id))));
    }
  };

  const handlePrint = async () => {
    const itemsToPrint: LabelItem[] = detalles
      .filter(d => selectedIds.has(String(d.variante_id)))
      .map(d => ({
        id: d.variante_id,
        producto_padre: d.producto_nombre,
        nombre_variante: d.nombre_variante,
        sku: d.sku
      }));

    if (itemsToPrint.length === 0) {
      return;
    }

    await printLabels(itemsToPrint);
    onClose();
  };

  const allSelected = selectedIds.size === detalles.length;
  const countSelected = selectedIds.size;

  return (
    // Backdrop
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
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

        {/* Toggle All */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {allSelected
              ? <CheckSquare className="w-5 h-5 text-indigo-600" />
              : <Square className="w-5 h-5 text-slate-400" />
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
              {detalles.map(d => {
                const sid = String(d.variante_id);
                const isChecked = selectedIds.has(sid);
                return (
                  <li key={sid}>
                    <button
                      onClick={() => toggleItem(sid)}
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
                          <p className="text-xs text-slate-500 font-medium truncate">
                            {d.nombre_variante}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Cant.
                        </span>
                        <span className="font-black text-slate-700 dark:text-slate-300">
                          {d.cantidad}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isChecked ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                          ID: {d.variante_id}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Actions */}
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
