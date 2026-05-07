import { Search, Sun, Moon, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useUIConfig } from '../../context/UIContext';
import { Edit3 } from 'lucide-react';
import { UserProfileModal } from '../ui/UserProfileModal';
import { useState } from 'react';

export function TopBar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { user, profile, isGerente, isAdminStock, darkMode, toggleDarkMode, hasAccess } = useAuth();
  const { isEditMode, setIsEditMode, saveAllToDB } = useUIConfig();
  const canEditUI = profile?.rol === 'admin' || profile?.rol === 'administrador' || hasAccess('sidebar_sistema') === 'write';
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <header className="print:hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200 dark:border-slate-900 transition-colors duration-500">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex-1 max-w-xl flex items-center gap-3">
          <button 
            onClick={onMenuToggle}
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group focus-within:ring-2 focus-within:ring-blue-500/20 transition-all w-full md:w-auto">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-400 font-medium outline-none" 
              placeholder="Buscar envíos, SKUs o reportes..." 
              type="text"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-6 ml-8">
          <div className="flex items-center gap-2">
            
            {canEditUI && (
              <button 
                title="Modo Edición del Sistema"
                onClick={async () => {
         if (isEditMode) {
             toast.loading("Sincronizando Cambios Visuales...", { id: 'save' });
             await saveAllToDB();
             toast.success("Diseño Guardado en Nube", { id: 'save' });
         }
         setIsEditMode(!isEditMode);
    }}
                className={`p-2.5 rounded-xl transition-all active:scale-90 border ${isEditMode ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-100 dark:hover:border-slate-800'}`}
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}

            <button 
              onClick={toggleDarkMode}
              className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all active:scale-90 text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pl-6 border-l border-slate-100 dark:border-slate-900 cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-blue-950 dark:text-white tracking-tight leading-none mb-1">{profile?.nombre_completo || user?.usuario || 'Usuario'}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{profile?.rol?.replace('_', ' ') || 'Cargando...'}</p>
            </div>
            <div className="relative group">
              <img 
                alt="Avatar" 
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-50 dark:ring-slate-900 group-hover:ring-blue-500/50 transition-all duration-300" 
                src={profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.usuario || 'nexus'}`} 
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-950"></div>
            </div>
          </div>
        </div>
      </div>

      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </header>
  );
}
