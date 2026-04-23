import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode, maxWidth?: string }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn("bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative z-10 border border-slate-100 dark:border-slate-800", maxWidth)}
          >
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-blue-950 dark:text-blue-50 tracking-tight">{title}</h3>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all hover:rotate-90 duration-300 shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
              >
                <Plus className="w-5 h-5 rotate-45 text-slate-400" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
