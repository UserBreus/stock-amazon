import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DynamicIcon } from '../../context/IconContext';

import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const UserLogo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74.93 114.93" className={className}>
    <path fill="currentColor" d="M74.93,87.65h-26.09v-7.16c-2.6,2.6-5.75,4.61-9.47,6.01-3.71,1.41-7.34,2.11-10.9,2.11-8.06,0-14.64-2.5-19.72-7.48-3.39-3.39-5.7-7.1-6.92-11.09-1.22-4-1.83-8.65-1.83-13.96V0h26.72v52.5c0,4.41,1.15,7.5,3.46,9.31,2.31,1.8,4.73,2.7,7.28,2.7s4.98-.89,7.28-2.66c2.31-1.78,3.46-4.89,3.46-9.34V.01h26.72v87.65h0Z"/>
    <path fill="currentColor" d="M74.93,114.93H7.92c-4.38,0-7.92-3.55-7.92-7.92v-1.53c0-4.37,3.55-7.92,7.92-7.92h67.01v17.37h0Z"/>
  </svg>
);

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showEpicLogo, setShowEpicLogo] = useState(false);

  // Form state
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('Inventario');
  const [reportDescription, setReportDescription] = useState('');

  const menuItems = [
    { id: 'sidebar_dashboard', name: 'Panel de Control', path: '/', icon: LayoutDashboard, roles: ['gerente_stock', 'admin', 'operario', 'operario_stock', 'administrativo_stock', 'atencion'] },
    { id: 'sidebar_inventario', name: 'Inventario Global', path: '/inventario-gerencial', icon: BarChart3, roles: ['gerente_stock', 'admin', 'operario_stock', 'administrativo_stock', 'atencion'] },
    { id: 'sidebar_sectores', name: 'Mi Sector', path: '/inventario-operativo', icon: Package, roles: ['gerente_stock', 'admin', 'operario', 'operario_stock', 'atencion'] },
    { id: 'sidebar_compras', name: 'Compras', path: '/ingresos', icon: Truck, roles: ['gerente_stock', 'admin', 'administrativo_stock'] },
    { id: 'sidebar_sistema', name: 'Gestión de Sistema', path: '/configuracion-maestros', icon: Settings, roles: ['gerente_stock', 'admin', 'administrativo_stock'] },
  ];

  const handleEpicClick = () => {
    setShowEpicLogo(true);
    
    // Efecto "Estelar / Brillo Mágico" (Volumen más bajo para resaltar la voz)
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      const freqs = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.1, ctx.currentTime + 1.5);
        
        // Redujido drásticamente el gain máximo a 0.03 (antes 0.15)
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + i * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + 1.5);
      });
    } catch (e) {
      console.log('Audio disabled', e);
    }

    // Synthesis Voice diciendo "USER" hispanizado y fuerte
    setTimeout(() => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance("Iúser"); 
        utterance.rate = 0.9;
        utterance.pitch = 1.2; 
        utterance.volume = 1; // Volumen máximo
        utterance.lang = "es-ES";
        synth.speak(utterance);
    }, 100);

    setTimeout(() => {
        setShowEpicLogo(false);
    }, 1500);
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('reportes').insert([{
        titulo: reportTitle,
        prioridad: reportCategory,
        descripcion: reportDescription,
        creado_por: profile?.id
      }]);
      if (error) throw error;
      setIsReportModalOpen(false);
      setReportTitle('');
      setReportDescription('');
      toast.success('Reporte generado exitosamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el reporte');
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
        "print:hidden fixed md:sticky left-0 top-0 h-screen z-50 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 flex flex-col py-8 transition-all duration-300 ease-in-out shrink-0",
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
              <div 
                className="w-10 h-10 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                onClick={handleEpicClick}
              >
                <UserLogo className="w-7 h-auto text-black dark:text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-cyan-950 dark:text-white leading-tight tracking-tighter">USER</h2>
                <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-widest">Control de Stock</p>
              </div>
            </motion.div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors hidden md:block"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            if (!profile?.rol || !item.roles.includes(profile.rol)) return null;
            
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3.5 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 font-bold" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-500 rounded-r-full" 
                  />
                )}
                <DynamicIcon id={item.id} fallback={item.icon} className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")}/>
                {!isCollapsed && (
                  <span className="text-sm tracking-tight">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 mt-auto pt-6 border-t border-slate-100 dark:border-slate-900/50 space-y-2">
          {!isCollapsed && (
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl transition-all mb-4"
            >
              <AlertCircle className="w-4 h-4" />
              Reportar Problema
            </button>
          )}

          <button 
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 font-medium",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* REPORT MODAL */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Reportar Problema del Sistema">
        <form onSubmit={handleCreateReport} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título del Problema</label>
            <input 
              className="input-nexus" 
              placeholder="Ej: Falla en la carga de impresiones" 
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
          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-xl transition-all">Generar Reporte</button>
        </form>
      </Modal>

      {/* EPIC LOGO ANIMATION */}
      <AnimatePresence>
        {showEpicLogo && (
          <motion.div 
            initial={{ opacity: 0, backgroundColor: "#000000" }}
            animate={{ 
              opacity: 1,
              backgroundColor: ["#000000", "#00ffff10", "#ff00ff10", "#ffff0010", "#000000"]
            }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
            transition={{ duration: 1.5, times: [0, 0.2, 0.5, 0.8, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.1, opacity: 0, rotate: -20, filter: "drop-shadow(0 0 0px #000)" }}
              animate={{ 
                scale: [0.1, 1.2, 1], 
                opacity: [0, 1, 1], 
                rotate: [0, 0, 0],
                filter: [
                  "drop-shadow(0 0 50px rgba(0, 255, 255, 0.8))", // Cyan
                  "drop-shadow(0 0 80px rgba(255, 0, 255, 0.8))", // Magenta
                  "drop-shadow(0 0 50px rgba(255, 255, 0, 0.8))", // Yellow
                  "drop-shadow(0 0 100px rgba(255, 255, 255, 0.6))" // Blanco destello final
                ]
              }}
              transition={{ 
                duration: 1.5, 
                ease: [0.25, 0.1, 0.25, 1],
                times: [0, 0.4, 0.7, 1] 
              }}
              className="text-white relative"
            >
              <UserLogo className="w-96 h-auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
