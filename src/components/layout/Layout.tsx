import React, { ReactNode, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export function Layout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex transition-colors duration-500 relative">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <TopBar onMenuToggle={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:px-8 md:pt-4 md:pb-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

const PATHS_MAP: Record<string, string> = {
  'sidebar_dashboard': '/',
  'sidebar_inventario': '/inventario-gerencial',
  'sidebar_sectores': '/inventario-operativo',
  'sidebar_compras': '/ingresos',
  'sidebar_sistema': '/configuracion-maestros'
};

export function ProtectedRoute({ children, roles, moduleId }: { children: ReactNode, roles?: UserRole[], moduleId?: string }) {
  const { user, profile, loading, hasToolAccess } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Cargando aplicación...</div>;
  if (!user) {
      window.location.href = '/';
      return <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Redirigiendo al portal...</div>;
  }
  
  if (profile && moduleId) {
      if (!hasToolAccess(moduleId, roles)) {
          return <div className="h-screen w-screen flex items-center justify-center p-8 text-center text-slate-500 font-bold">Acceso Denegado. Contacta a un administrador.</div>;
      }
  }

  return <>{children}</>;
}
