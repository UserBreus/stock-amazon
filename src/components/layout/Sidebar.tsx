import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus, 
  Network,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { supabase } from '../../supabase';

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Form state
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('Inventario');
  const [reportDescription, setReportDescription] = useState('');

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'operario', 'operario_stock'] },
    { name: 'Inventario Gerencial', path: '/inventario-gerencial', icon: BarChart3, roles: ['admin', 'operario_stock'] },
    { name: 'Inventario Operativo', path: '/inventario-operativo', icon: Package, roles: ['admin', 'operario'] },
    { name: 'Importaciones', path: '/importaciones', icon: Truck, roles: ['admin'] },
    { name: 'Análisis de Proveedores', path: '/analisis-proveedores', icon: BarChart3, roles: ['admin'] },
  ];

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('reportes').insert([{
        titulo: reportTitle,
        prioridad: reportCategory,
        descripcion: reportDescription,
        creado_por: profile?.id
      }]);
      setIsReportModalOpen(false);
      setReportTitle('');
      setReportDescription('');
      alert('Reporte generado exitosamente');
    } catch (error) {
      console.error(error);
      alert('Error al general el reporte');
    }
  };

  return (
    <>
      {/* Fondo ocuro móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed md:sticky left-0 top-0 h-screen z-50 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 flex flex-col py-8 transition-all duration-300 ease-in-out shrink-0",
        isCollapsed ? "w-20" : "w-72",
        // En móviles: oculto (fuera de pantalla) a menos que se abra 
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="px-6 mb-10 flex items-center justify-between">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Network className="text-white w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-blue-950 dark:text-white leading-tight tracking-tighter">NEXUS</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Logistics Int.</p>
              </div>
            </motion.div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 mx-auto">
              <Network className="text-white w-6 h-6" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1.5">
          {menuItems.filter(item => !item.roles || (profile && item.roles.includes(profile.rol))).map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3.5 flex items-center gap-4 transition-all duration-300 rounded-2xl group relative",
                location.pathname === item.path 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-blue-900 dark:hover:text-blue-300"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                location.pathname === item.path ? "text-blue-900 dark:text-blue-400" : "text-slate-400 group-hover:text-blue-600"
              )} />
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              )}
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-blue-900 dark:bg-blue-400 rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-auto space-y-6">
          {!isCollapsed && (
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Reporte
            </button>
          )}
          
          <div className="pt-6 border-t border-slate-50 dark:border-slate-900">
            <button className="w-full text-left text-slate-500 dark:text-slate-400 px-4 py-3 flex items-center gap-4 hover:text-blue-900 dark:hover:text-blue-300 transition-colors group">
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              {!isCollapsed && <span className="text-sm font-bold tracking-tight">Configuración</span>}
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/login');
              }}
              className="w-full text-left text-slate-500 dark:text-slate-400 px-4 py-3 flex items-center gap-4 hover:text-red-600 transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              {!isCollapsed && <span className="text-sm font-bold tracking-tight">Cerrar Sesión</span>}
            </button>
          </div>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full py-2 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Crear Nuevo Reporte">
        <form className="space-y-6" onSubmit={handleCreateReport}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título del Reporte</label>
            <input 
              className="input-nexus" 
              placeholder="ej. Reporte de Stock Semanal" 
              type="text" 
              required 
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoría</label>
            <select 
              className="input-nexus"
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
            >
              <option>Inventario</option>
              <option>Operaciones</option>
              <option>Proveedores</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción</label>
            <textarea 
              className="input-nexus h-32 resize-none" 
              placeholder="Detalles del reporte..."
              required
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            ></textarea>
          </div>
          <button type="submit" className="w-full btn-primary py-4">Generar Reporte</button>
        </form>
      </Modal>
    </>
  );
}
