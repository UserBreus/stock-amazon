import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ElementType;
}

interface ModalSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: Option[];
  onSelect: (value: string) => void;
  selectedValue?: string;
  closeOnSelect?: boolean;
}

export function ModalSelector({ isOpen, onClose, title, options, onSelect, selectedValue, closeOnSelect = true }: ModalSelectorProps) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    return options.filter(opt => 
      (opt.label?.toLowerCase() || '').includes(query.toLowerCase()) || 
      (opt.sublabel && opt.sublabel.toLowerCase().includes(query.toLowerCase()))
    );
  }, [options, query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            className="relative bg-white dark:bg-slate-950 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{title}</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Buscar opción..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-12 pr-4 py-4 rounded-2xl outline-none font-bold placeholder:text-slate-400 focus:bg-blue-50 focus:text-blue-900 transition-colors"
                />
              </div>
            </div>

            {/* Options Grid */}
            <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold">
                  No se encontraron resultados para "{query}"
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSelect(opt.value);
                        if (closeOnSelect) {
                          onClose();
                          setQuery('');
                        }
                      }}
                      className={cn(
                        "text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group",
                        selectedValue === opt.value 
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" 
                          : "border-transparent bg-slate-50 dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-white"
                      )}
                    >
                      {opt.icon && (
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          selectedValue === opt.value 
                            ? "bg-blue-500 text-white" 
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                        )}>
                          <opt.icon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-black truncate",
                          selectedValue === opt.value ? "text-blue-900 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                        )}>{opt.label}</p>
                        {opt.sublabel && (
                          <p className="text-xs text-slate-500 font-bold truncate mt-1">{opt.sublabel}</p>
                        )}
                      </div>
                      {selectedValue === opt.value && (
                        <Check className="w-5 h-5 text-blue-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Safe Bottom Padding */}
            <div className="h-4"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
