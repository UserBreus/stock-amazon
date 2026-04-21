import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, ChevronRight, ChevronLeft, Folder, Network, LayoutGrid, List, Box } from 'lucide-react';
import { cn } from '../../lib/utils';

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
  onSelectMultiple
}: DrillDownModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedMaestroId, setSelectedMaestroId] = useState<string | null>(null);
  const [selectedVariantGroup, setSelectedVariantGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tarjeta' | 'lista'>('tarjeta');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Cuando buscamos algo, mostramos resultados globales (todos los productos).
  // Cuando NO hay búsqueda, mostramos la jerarquía.
  
  const isGlobalSearch = query.trim().length > 0;

  const displayItems = useMemo(() => {
    if (isGlobalSearch) {
      // Global Search: Solo productos. Filtrar por nombre y cat_nombre.
      return productos.filter(p => 
        p.nombre.toLowerCase().includes(query.toLowerCase()) || 
        (p.cat_nombre && p.cat_nombre.toLowerCase().includes(query.toLowerCase()))
      ).map(p => ({
        type: 'product' as const,
        id: p.id.toString(),
        label: p.nombre,
        sublabel: p.cat_nombre,
        icon: Network
      }));
    }

    if (!selectedCategoryId) {
      // Vista Raíz: Categorías. Mostramos cuántos productos tiene.
      return categorias.map(c => {
        const prodCount = new Set(productos.filter(p => p.categoria_id?.toString() === c.id.toString()).map(p => p.producto_maestro_id)).size;
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
      const maestrosMap = new Map();
      prodsInCat.forEach(p => {
         if (!maestrosMap.has(p.producto_maestro_id)) {
            maestrosMap.set(p.producto_maestro_id, {
               type: 'maestro' as const,
               id: p.producto_maestro_id.toString(),
               label: p.producto_nombre,
               sublabel: '0 variantes',
               icon: Box,
               count: 0
            });
         }
         maestrosMap.get(p.producto_maestro_id).count++;
      });
      return Array.from(maestrosMap.values()).map(m => ({...m, sublabel: `${m.count} variantes`}));
    }

    // Lógica para agrupamiento de variantes (Nivel 2.5)
    const variantsOfMaestro = productos.filter(p => p.producto_maestro_id?.toString() === selectedMaestroId);
    
    const groupsMap = new Map();
    variantsOfMaestro.forEach(p => {
       const varName = p.nombre_variante || 'Normal';
       const groupName = varName.split(' - ')[0].trim();
       if (!groupsMap.has(groupName)) {
           groupsMap.set(groupName, {
              type: 'variantGroup' as const,
              id: groupName,
              label: groupName,
              sublabel: '0 variantes',
              icon: Folder, // folder icon for group
              count: 0
           });
       }
       groupsMap.get(groupName).count++;
    });

    const groups = Array.from(groupsMap.values());
    const shouldGroup = groups.length > 0 && groups.length < variantsOfMaestro.length;

    if (shouldGroup && !selectedVariantGroup) {
       // Nivel 2 Intermedio: Grupos de atributos (ej. "Rojo", "Azul")
       return groups.map(g => ({...g, sublabel: `${g.count} variantes`}));
    }

    // Vista Nivel Final: Variantes seleccionables
    return variantsOfMaestro
      .filter(p => {
          if (!shouldGroup) return true; // Show all if no grouping needed
          const varName = p.nombre_variante || 'Normal';
          return varName.split(' - ')[0].trim() === selectedVariantGroup;
      })
      .map(p => ({
        type: 'product' as const,
        id: p.id.toString(),
        label: p.nombre_variante || 'Normal',
        sublabel: `Variante de ${p.producto_nombre}`,
        icon: Network
      }));

  }, [categorias, productos, query, selectedCategoryId, selectedMaestroId, selectedVariantGroup, isGlobalSearch]);

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
                      onClick={() => { if (selectedVariantGroup) setSelectedVariantGroup(null); else if(selectedMaestroId) setSelectedMaestroId(null); else setSelectedCategoryId(null); }}
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
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
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
            </div>

            {/* Options Grid */}
            <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
              {displayItems.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center">
                  <Network className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="text-slate-500 font-bold mb-2">No se encontraron resultados.</p>
                  {isGlobalSearch && <p className="text-sm text-slate-400">Intenta buscar con otros términos.</p>}
                  {!isGlobalSearch && selectedCategoryId && <p className="text-sm text-slate-400">Esta categoría todavía no tiene ningún artículo matriz.</p>}
                </div>
              ) : (
                <div className={cn(
                  "grid gap-3",
                  viewMode === 'tarjeta' ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1"
                )}>
                  {displayItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'category') {
                          setSelectedCategoryId(item.id);
                          setQuery('');
                        } else if (item.type === 'maestro') {
                          setSelectedMaestroId(item.id);
                          setQuery('');
                        } else if (item.type === 'variantGroup') {
                          setSelectedVariantGroup(item.id);
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
                      className={cn(
                        "text-left transition-all group relative",
                        viewMode === 'tarjeta' ? "p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-2" : "p-3 rounded-xl border-2 flex items-center gap-3",
                        item.type === 'product' && (selectedValue === item.id || selectedIds.has(item.id))
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
                          item.type === 'variantGroup' ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 group-hover:bg-rose-200" :
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
                          <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-tight break-words">{item.sublabel}</p>
                        )}
                      </div>
                      
                      {(item.type === 'category' || item.type === 'maestro' || item.type === 'variantGroup') && (
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
                    </button>
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
                        setSelectedVariantGroup(null);
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
