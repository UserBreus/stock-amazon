import fs from 'fs';

let drillTxt = fs.readFileSync('src/components/ui/CategoryDrillDownModal.tsx', 'utf8');

// Add multiSelect props
drillTxt = drillTxt.replace(
    '  closeOnSelect?: boolean;\n}',
    '  closeOnSelect?: boolean;\n  multiSelect?: boolean;\n  onSelectMultiple?: (ids: string[]) => void;\n}'
);

drillTxt = drillTxt.replace(
    '  closeOnSelect = true \n}: DrillDownModalProps) {',
    '  closeOnSelect = true,\n  multiSelect = false,\n  onSelectMultiple\n}: DrillDownModalProps) {'
);

drillTxt = drillTxt.replace(
    "  const [viewMode, setViewMode] = useState<'tarjeta' | 'lista'>('tarjeta');",
    "  const [viewMode, setViewMode] = useState<'tarjeta' | 'lista'>('tarjeta');\n  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());"
);

// Modify product click
const clickHandlerSearch = `                          onSelect(item.id);
                          if (closeOnSelect) {
                              onClose();
                              setQuery('');
                              setSelectedCategoryId(null);
                          }`;
const clickHandlerRepl = `                          if (multiSelect) {
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
                          }`;
drillTxt = drillTxt.replace(clickHandlerSearch, clickHandlerRepl);

// Add Check icon for multiSelect
const checkSearch = `{item.type === 'product' && selectedValue === item.id && (
                        <Check className={cn("w-5 h-5 text-blue-500 shrink-0", viewMode === 'tarjeta' && "absolute top-3 right-3")} />
                      )}`;
const checkRepl = `{item.type === 'product' && (selectedValue === item.id || selectedIds.has(item.id)) && (
                        <Check className={cn("w-5 h-5 text-blue-500 shrink-0", viewMode === 'tarjeta' && "absolute top-3 right-3")} />
                      )}`;
drillTxt = drillTxt.replace(checkSearch, checkRepl);

// Add styling for selected items
drillTxt = drillTxt.replace(
    `item.type === 'product' && selectedValue === item.id`,
    `item.type === 'product' && (selectedValue === item.id || selectedIds.has(item.id))`
);

// Add Footer
const footerSearch = `{/* Safe Bottom Padding */}
            <div className="h-4 shrink-0"></div>`;
const footerRepl = `{multiSelect && selectedIds.size > 0 && (
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
            {(!multiSelect || selectedIds.size === 0) && <div className="h-4 shrink-0"></div>}`;
drillTxt = drillTxt.replace(footerSearch, footerRepl);

fs.writeFileSync('src/components/ui/CategoryDrillDownModal.tsx', drillTxt);


// NOW MODIFY RecepcionAuditoria.tsx to pass multiSelect and onSelectMultiple
let recpTxt = fs.readFileSync('src/components/RecepcionAuditoria.tsx', 'utf8');

const modalSearch = `<CategoryDrillDownModal 
               isOpen={isProdDrillDownOpen}
               onClose={() => setIsProdDrillDownOpen(false)}
               title="Buscar Artículo a Ingresar Manual"
               categorias={categorias}
               productos={productos}
               onSelect={(id) => {
                   agregarLineaLibre(id);
                   toast.success("Artículo añadido a la lista. Puedes seguir buscando.");
               }}
               closeOnSelect={false}
            />`;

const modalRepl = `<CategoryDrillDownModal 
               isOpen={isProdDrillDownOpen}
               onClose={() => setIsProdDrillDownOpen(false)}
               title="Buscar Artículo a Ingresar Manual"
               categorias={categorias}
               productos={productos}
               onSelect={(id) => {
                   agregarLineaLibre(id);
               }}
               multiSelect={true}
               onSelectMultiple={(ids) => {
                   ids.forEach(id => agregarLineaLibre(id));
                   toast.success(\`\${ids.length} artículos añadidos a la lista.\`);
               }}
            />`;

recpTxt = recpTxt.replace(modalSearch, modalRepl);
fs.writeFileSync('src/components/RecepcionAuditoria.tsx', recpTxt);

console.log("Updated both files.");
