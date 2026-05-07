import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { UserRole } from '../types';


export interface UserProfile {
  id: string;
  usuario: string;
  rol: UserRole;
  sucursal_activa_id?: number;
  sucursal_activa_nombre?: string;
  permisos?: string[];
  avatar?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  isGerente: boolean;
  isAdminStock: boolean;
  isOperario: boolean;
  isOperarioStock: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  login: (usuarioStr: string, profileData: UserProfile, sucursalId?: number, sucursalNombre?: string) => void;
  logout: () => void;
  hasToolAccess: (moduleId: string, allowedRoles?: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('nexus-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('nexus-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    // Revisar si existe sesión custom guardada
    const checkSession = async () => {
      const stored = localStorage.getItem('nexus_custom_user');
      if (stored) {
        try {
          const parsed: UserProfile = JSON.parse(stored);
          
          if (parsed.permisos && typeof parsed.permisos === 'string') {
              try {
                  const p = JSON.parse(parsed.permisos);
                  if (p.version === 2) {
                      parsed.permisos = p;
                  }
              } catch (e) {
                  // Legacy string array ignores
              }
          }
          
          if (parsed.permisos && typeof parsed.permisos === 'object' && !Array.isArray(parsed.permisos)) {
              const v2 = parsed.permisos as any;
              if (v2.version === 2) {
                  if (!v2.apps || !v2.apps.includes('stock')) {
                      localStorage.removeItem('nexus_custom_user');
                      window.location.href = '/?error=Acceso Denegado a Stock';
                      return;
                  }
              }
          }
          
          setUser(parsed);
        } catch (e) {
          console.error("Error parsing stored user", e);
          localStorage.removeItem('nexus_custom_user');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = (usuarioStr: string, profileData: UserProfile, sucursalId?: number, sucursalNombre?: string) => {
    const enrichedData = {
      ...profileData,
      sucursal_activa_id: sucursalId,
      sucursal_activa_nombre: sucursalNombre
    };
    setUser(enrichedData);
    localStorage.setItem('nexus_custom_user', JSON.stringify(enrichedData));
  };

  const hasToolAccess = (moduleId: string, allowedRoles?: string[]) => {
      if (!user) return false;
      const isAdmin = user.rol === 'admin' || user.rol === 'administrador';
      if (isAdmin) return true;

      const p = user.permisos as any;
      if (p && p.version === 2) {
          const stockTools = p.stock_tools || [];
          if (moduleId === 'sidebar_dashboard') return stockTools.includes('dashboard');
          if (moduleId === 'sidebar_inventario') return stockTools.includes('inventario');
          if (moduleId === 'sidebar_sectores') return stockTools.includes('sectores') || stockTools.includes('remitos');
          if (moduleId === 'sidebar_compras') return stockTools.includes('compras');
          if (moduleId === 'sidebar_sistema') return stockTools.includes('sistema');
          return stockTools.includes(moduleId);
      } else if (p && Array.isArray(p)) {
          return p.includes(moduleId);
      }
      
      if (allowedRoles && user.rol) {
          return allowedRoles.includes(user.rol);
      }
      return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexus_custom_user');
    window.location.href = '/';
  };

  const value = {
    user,
    profile: user,
    loading,
    isGerente: user?.rol === 'gerente_stock',
    isAdminStock: user?.rol === 'administrativo_stock' || user?.rol === 'admin',
    isOperario: user?.rol === 'operario',
    isOperarioStock: user?.rol === 'operario_stock' || user?.rol === 'atencion',
    darkMode,
    toggleDarkMode,
    login,
    logout,
    hasToolAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
