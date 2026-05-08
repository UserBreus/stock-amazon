import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, ChevronRight, ChevronLeft, Folder, Network, LayoutGrid, List, Box, Eye, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { executeAWSQuery } from '../../lib/aws-client';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  categorias: any[];
  productos: any[];
  onSelect: (productoId: string) => void;
  selectedValue?: string;
  closeOnSelect?: boolean;
  multiSelect?: boolean;
  onSelectMultiple?: (ids: string[]) => void;
  activeItemIds?: string[];
  emptyMessage?: string;
}

export function CategoryDrillDownModal({ 
  isOpen, 
  onClose, 
  title, 
  categorias, 
  productos, 
  onSelect, 
  selectedValue,
  closeOnSelect = true,
  multiSelect = false,
  onSelectMultiple,
  activeItemIds = [],
  emptyMessage
}: DrillDownModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedMaestroId, setSelectedMaestroId] = useState<string | null>(null);
  const [selectedVariantGroup, setSelectedVariantGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tarjeta' | 'lista'>('tarjeta');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Initialize selectedIds when modal opens
  useEffect(() => {
    if (isOpen && activeItemIds) {
      setSelectedIds(new Set(activeItemIds));
    }
  }, [isOpen, activeItemIds]);

  const [liveStockView, setLiveStockView] = useState<{ id: string, name: string, stockByDepot: {name: string, qty: number}[], total: number, loading: boolean } | null>(null);

  const handleViewLiveStock = async (e: React.MouseEvent, item: any) => {
      e.stopPropagation();
      setLiveStockView({ id: item.id, name: item.label, stockByDepot: [], total: 0, loading: true });
      try {
          const res = await executeAWSQuery(`
              SELECT d.nombre as deposito_nombre, SUM(e.cantidad_actual) as cantidad 
              FROM Stock_Etiquetas e 
              INNER JOIN Stock_Depositos d ON e.deposito_id = d.id 
              INNER JOIN Stock_Variantes v ON e.variante_id = v.id
              WHERE e.estado = 'activo' AND e.cantidad_actual > 0 AND (v.id = ${item.id} OR v.producto_maestro_id = ${item.id})
              GROUP BY d.nombre
          `);
          let total = 0;
          const byDepot = (res || []).map((r: any) => {
              total += r.cantidad;
              return { name: r.deposito_nombre, qty: r.cantidad };
          });
          setLiveStockView({ id: item.id, name: item.label, stockByDepot: byDepot, total, loading: false });
      } catch(err) {
          console.error(err);
          setLiveStockView(null);
      }
  };

  // Cuando buscamos algo, mostramos resultados globales (todos los productos).
  // Cuando NO hay búsqueda, mostramos la jerarquía.
  
  const isGlobalSearch = query.trim().length > 0;

  const displayItems = useMemo(() => {
    if (isGlobalSearch) {
      // Global Search: Solo productos. Filtrar por nombre, cat_nombre y nombre_variante.
      return productos.filter(p => {
        const queryLower = query.toLowerCase();
        return (
          (p.nombre && p.nombre.toLowerCase().includes(queryLower)) || 
          (p.cat_nombre && p.cat_nombre.toLowerCase().includes(queryLower)) ||
          (p.nombre_variante && p.nombre_variante.toLowerCase().includes(queryLower)) ||
          (p.sku && p.sku.toLowerCase().includes(queryLower)) ||
          (p.var_sku && p.var_sku.toLowerCase().includes(queryLower))
        );
      }).map(p => {
        const maestroName = p.nombre || p.producto_nombre || '';
        const variantName = p.nombre_variante || '';
        
        let fullName = maestroName;
        if (variantName) {
            // Si el nombre de la variante ya contiene el nombre del maestro, no duplicamos
            if (variantName.toLowerCase().includes(maestroName.toLowerCase())) {
                fullName = variantName;
            } else {
                fullName = `${maestroName} - ${variantName}`;
            }
        }
        return {
          type: 'product' as const,
          id: p.id.toString(),
          label: fullName,
          sublabel: `${p.sku || p.var_sku ? `${p.sku || p.var_sku} | ` : ''}${p.cat_nombre || p.producto_nombre || ''}`,
          icon: Network,
          stock: p.stock_total
        };
      });
    }

    if (!selectedCategoryId) {
      // Vista Raíz: Categorías. Mostramos cuántos productos tiene.
      return categorias.map(c => {
        const prodCount = new Set(productos.filter(p => p.categoria_id?.toString() === c.id.toString()).map(p => p.producto_maestro_id || p.id)).size;
        return {
          type: 'category' as const,
          id: c.id.toString(),
          label: c.nombre,
          sublabel: `${prodCount} artículos maestros`,
          icon: Folder
        };
      }).sort((a,b) => a.label.localeCompare(b.label)); // Order by Name
    }

    if (!selectedMaestroId) {
      // Vista Nivel 1: Productos Maestros dentro de la Categoría Seleccionada
      const prodsInCat = productos.filter(p => p.categoria_id?.toString() === selectedCategoryId);
      
      const isMaestroList = prodsInCat.length > 0 && prodsInCat[0].producto_maestro_id === undefined;
      if (isMaestroList) {
          return prodsInCat.map(p => ({
               type: 'product' as const,
               id: p.id.toString(),
               label: p.nombre,
               sublabel: p.sku || 'Matriz',
               icon: Box,
               stock: p.stock_total
          }));
      }

      const maestrosMap = new Map();
      prodsInCat.forEach(p => {
         if (!maestrosMap.has(p.producto_maestro_id)) {
            maestrosMap.set(p.producto_maestro_id, {
               type: 'maestro' as const,
               id: p.producto_maestro_id.toString(),
               label: p.producto_nombre,
               sublabel: '0 variantes',
               icon: Box,
               count: 0,
               exactVariantId: p.id,
               exactVariantName: p.nombre_variante,
               exactVariantStock: p.stock_total,
               exactVariantSku: p.sku
            });
         } else {
            const m = maestrosMap.get(p.producto_maestro_id);
            m.exactVariantId = p.id;
            m.exactVariantName = p.nombre_variante;
            m.exactVariantStock = p.stock_total;
            m.exactVariantSku = p.sku;
         }
         maestrosMap.get(p.producto_maestro_id).count++;
      });
      return Array.from(maestrosMap.values()).map(m => {
          if (m.count === 1) {
              return {
                 type: 'product' as const,
                 id: m.exactVariantId.toString(),
                 label: m.label,
                 sublabel: `${m.exactVariantSku ? `${m.exactVariantSku} | ` : ''}${m.exactVariantName ? String(m.exactVariantName) : ''}`,
                 icon: Box,
                 stock: m.exactVariantStock
              };
          }
          return {
             ...m, 
             sublabel: `${m.count} variantes`
          };
      });
    }

    // Vista Nivel Final: Variantes seleccionables
    const variantsOfMaestro = productos.filter(p => p.producto_maestro_id?.toString() === selectedMaestroId);
    return variantsOfMaestro
      .map(p => ({
        type: 'product' as const,
        id: p.id.toString(),
        label: p.nombre_variante ? p.nombre_variante : (p.producto_nombre || ''),
        sublabel: `${p.sku ? `${p.sku} | ` : ''}Variante de ${p.producto_nombre}`,
        icon: Network,
        stock: p.stock_total
      }));

  }, [categorias, productos, query, selectedCategoryId, selectedMaestroId, isGlobalSearch]);

  const activeCategory = useMemo(() => {
    if (selectedCategoryId) {
      return categorias.find(c => c.id.toString() === selectedCategoryId);
    }
    return null;
  }, [selectedCategoryId, categorias]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-950 rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {!isGlobalSearch && selectedCategoryId && (
                    <button 
                      onClick={() => { if(selectedMaestroId) setSelectedMaestroId(null); else setSelectedCategoryId(null); }}
                      className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-200 dark:bg-slate-800 p-1 rounded-md"
                      title="Volver a Categorías"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {title}
                </h2>
                {!isGlobalSearch && selectedCategoryId && activeCategory && (
                   <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-widest pl-8">Explorando Familia: {activeCategory.nombre}</p>
                )}
                {!isGlobalSearch && !selectedCategoryId && (
                   <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Selecciona una familia matriz</p>
                )}
                {isGlobalSearch && (
                   <p className="text-xs font-bold text-pink-600 mt-1 uppercase tracking-widest">Búsqueda Global Activa</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg mr-2">
                  <button onClick={() => setViewMode('lista')} className={cn("p-1.5 rounded-md transition-colors", viewMode === 'lista' ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")} title="Vista en Lista"><List className="w-4 h-4"/></button>
                  <button onClick={() => setViewMode('tarjeta')} className={cn("p-1.5 rounded-md transition-colors", viewMode === 'tarjeta' ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")} title="Vista en Tarjetas"><LayoutGrid className="w-4 h-4"/></button>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Buscar cualquier artículo directamente..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-12 pr-4 py-4 rounded-2xl outline-none font-bold placeholder:text-slate-400 focus:bg-blue-50 focus:text-blue-900 transition-colors"
                />
              </div>

              {/* LIVE STOCK VIEW OVERLAY */}
              <AnimatePresence>
                 {liveStockView && (
                    <motion.div 
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       className="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)] z-20 border border-slate-200 dark:border-slate-700"
                    >
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <h4 className="text-xl font-black text-indigo-900 dark:text-indigo-100">{liveStockView.name}</h4>
                             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Disponibilidad en Tiempo Real</p>
                          </div>
                          <button onClick={()=>setLiveStockView(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400"><X className="w-5 h-5"/></button>
                       </div>
                       
                       {liveStockView.loading ? (
                          <div className="py-8 flex flex-col items-center opacity-50">
                             <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
                             <p className="font-bold text-sm">Consultando Inventario Global...</p>
                          </div>
                       ) : (
                          <div className="space-y-4">
                             {liveStockView.stockByDepot.length === 0 ? (
                                <p className="text-rose-500 font-bold py-4 text-center bg-rose-50 dark:bg-rose-900/10 rounded-xl">0 stock disponible en toda la red.</p>
                             ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                   {liveStockView.stockByDepot.map(dep => (
                                      <div key={dep.name} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                         <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1 line-clamp-1" title={dep.name}>{dep.name}</p>
                                         <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{dep.qty.toLocaleString()}</p>
                                      </div>
                                   ))}
                                </div>
                             )}
                             <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-2">
                                <span className="font-bold text-slate-500 uppercase tracking-widest text-sm">Total Consolidado</span>
                                <span className="font-black text-3xl text-indigo-600 dark:text-indigo-400">{liveStockView.total.toLocaleString()}</span>
                             </div>
                          </div>
                       )}
                    </motion.div>
                 )}
              </AnimatePresence>
            </div>

            {/* Options Grid */}
            <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
              {displayItems.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center">
                  <Network className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="text-slate-500 font-bold mb-2">{emptyMessage || 'No se encontraron resultados.'}</p>
                  {!emptyMessage && isGlobalSearch && <p className="text-sm text-slate-400">Intenta buscar con otros términos.</p>}
                  {!emptyMessage && !isGlobalSearch && selectedCategoryId && <p className="text-sm text-slate-400">Esta categoría todavía no tiene ningún artículo matriz.</p>}
                </div>
              ) : (
                <div className={cn(
                  "grid gap-3",
                  viewMode === 'tarjeta' ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1"
                )}>
                  {displayItems.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (item.type === 'category') {
                          setSelectedCategoryId(item.id);
                          setQuery('');
                        } else if (item.type === 'maestro') {
                          setSelectedMaestroId(item.id);
                          setQuery('');
                        } else {
                          if (multiSelect) {
                              const next = new Set(selectedIds);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              setSelectedIds(next);
                          } else {
                              onSelect(item.id);
                              if (closeOnSelect) {
                                  onClose();
                                  setQuery('');
                                  setSelectedCategoryId(null);
                                  if(selectedMaestroId) setSelectedMaestroId(null);
                              }
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                           // Same logic as onClick
                           if (item.type === 'category') {
                             setSelectedCategoryId(item.id);
                             setQuery('');
                           } else if (item.type === 'maestro') {
                             setSelectedMaestroId(item.id);
                             setQuery('');
                           } else {
                             if (multiSelect) {
                                 const next = new Set(selectedIds);
                                 if (next.has(item.id)) next.delete(item.id);
                                 else next.add(item.id);
                                 setSelectedIds(next);
                             } else {
                                 onSelect(item.id);
                                 if (closeOnSelect) {
                                     onClose();
                                     setQuery('');
                                     setSelectedCategoryId(null);
                                     if(selectedMaestroId) setSelectedMaestroId(null);
                                 }
                             }
                           }
                        }
                      }}
                      className={cn(
                        "text-left transition-all group relative",
                        viewMode === 'tarjeta' ? "p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2" : "p-3 rounded-xl border-2 flex items-center gap-3",
                        item.type === 'product' && (selectedValue === item.id || selectedIds.has(item.id) || activeItemIds.includes(item.id))
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" 
                          : "border-transparent bg-slate-50 dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-white"
                      )}
                    >
                      {item.icon && (
                        <div className={cn(
                          "rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          viewMode === 'tarjeta' ? "w-12 h-12 mb-1" : "w-10 h-10",
                          item.type === 'category' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:bg-amber-200" :
                          item.type === 'maestro' ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 group-hover:bg-indigo-200" :
                          (selectedValue === item.id 
                            ? "bg-blue-500 text-white" 
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600")
                        )}>
                          <item.icon className="w-5 h-5" />
                        </div>
                      )}
                      <div className={cn("flex-1 min-w-0 w-full", viewMode === 'tarjeta' && "text-center")}>
                        <p className={cn(
                          "font-bold text-xs sm:text-sm leading-tight break-words",
                          item.type === 'product' && selectedValue === item.id ? "text-blue-900 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
                        )} style={{ wordBreak: 'break-word' }}>{item.label}</p>
                        {item.sublabel && (
                          <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight break-words">{item.sublabel}</p>
                        )}
                        {(item as any).stock !== undefined && (
                          <div className="mt-2 flex items-center justify-center gap-1 sm:max-w-[140px] mx-auto">
                              <div className={cn("rounded border px-2 py-1 flex-1 text-center font-bold tracking-widest uppercase text-[10px]", (item as any).stock > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800" : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800")}>
                                  Disp: {(item as any).stock}
                              </div>
                              <button onClick={(e) => handleViewLiveStock(e, item)} className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800/50 dark:hover:bg-indigo-800/50 transition-colors" title="Ver Stock Global Real">
                                  <Layers className="w-4 h-4" />
                              </button>
                          </div>
                        )}
                      </div>
                      
                      {(item.type === 'category' || item.type === 'maestro') && (
                         <div className={cn(
                           "rounded-full flex items-center justify-center transition-colors bg-slate-200/50 group-hover:bg-amber-100 dark:bg-slate-800",
                           viewMode === 'tarjeta' ? "w-6 h-6 mt-1" : "w-8 h-8"
                         )}>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                         </div>
                      )}
                      {item.type === 'product' && (selectedValue === item.id || selectedIds.has(item.id)) && (
                        <Check className={cn("w-5 h-5 text-blue-500 shrink-0", viewMode === 'tarjeta' && "absolute top-3 right-3")} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {multiSelect && selectedIds.size > 0 && (
               <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between items-center shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-10 relative">
                  <span className="font-bold text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500" />
                    {selectedIds.size} variantes seleccionadas
                  </span>
                  <button 
                     onClick={() => {
                        if(onSelectMultiple) onSelectMultiple(Array.from(selectedIds));
                        setSelectedIds(new Set());
                        onClose();
                        setSelectedCategoryId(null);
                        setSelectedMaestroId(null);
                        setQuery('');
                     }}
                     className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                  >
                     Cargar {selectedIds.size} Variantes a la Lista
                  </button>
               </div>
            )}
            {/* Safe Bottom Padding */}
            {(!multiSelect || selectedIds.size === 0) && <div className="h-4 shrink-0"></div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
