import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { UserRole } from '../types';
import { executeAWSQuery } from '../lib/aws-client';


export type AccessLevel = "none" | "read" | "write";

export interface UserProfile {
  id: string;
  usuario: string;
  nombre_completo?: string;
  rol: UserRole;
  sucursal_activa_id?: number;
  sucursal_activa_nombre?: string;
  permisos?: any;
  permisos_obj?: any;
  is_super_admin?: boolean;
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
  hasAccess: (toolId: string) => AccessLevel;
  hasSubAccess: (toolId: string, subToolId: string) => AccessLevel;
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
      const urlParams = new URLSearchParams(window.location.search);
      const embedId = urlParams.get('embedUserId');
      
      if (embedId) {
        try {
            const res = await executeAWSQuery(`SELECT * FROM usuarios WHERE id = ${embedId}`);
            if (res && res.length > 0) {
               setUser({ ...res[0], is_super_admin: false, permisos_obj: {} } as any);
            }
        } catch(e){}
        setLoading(false);
        return;
      }

      const stored = localStorage.getItem('nexus_custom_user');
      if (stored) {
        try {
          const parsed: UserProfile = JSON.parse(stored);
          
          if (!parsed.is_super_admin) {
              const p = parsed.permisos_obj;
              if (p && (!p.apps || !p.apps.includes('stock'))) {
                  localStorage.removeItem('nexus_custom_user');
                  window.location.href = '/?error=Acceso Denegado a Stock';
                  return;
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

  const getToolAccess = (toolId: string): AccessLevel => {
      if (!user) return "none";
      if (user.is_super_admin) return "write";
      
      const p = user.permisos_obj;
      if (!p) return "none";
      if (!p.apps?.includes('stock')) return "none";

      const tool = p.stock_tools?.[toolId] || p.stock_tools?.[toolId.replace('sidebar_', '')];
      if (!tool || tool.access === 'none') return "none";

      return tool.access;
  };

  const hasAccess = (toolId: string): AccessLevel => getToolAccess(toolId);

  const hasSubAccess = (toolId: string, subToolId: string): AccessLevel => {
      if (!user) return "none";
      if (user.is_super_admin) return "write";

      const p = user.permisos_obj;
      if (!p) return "none";
      if (!p.apps?.includes('stock')) return "none";

      const tool = p.stock_tools?.[toolId] || p.stock_tools?.[toolId.replace('sidebar_', '')];
      if (!tool || tool.access === 'none') return "none";

      if (subToolId) {
          const subAccess = tool.sub?.[subToolId];
          if (subAccess === 'none') return "none";
          if (subAccess) return subAccess;
          return "none"; // Si no está explícito en el JSON, asume 'none' igual que la UI del Portal
      }

      return tool.access;
  };

  const hasToolAccess = (moduleId: string, allowedRoles?: string[]) => {
      if (!user) return false;
      if (user.is_super_admin) return true;
      
      const acc = getToolAccess(moduleId);
      return acc === "write" || acc === "read";
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
    isGerente: user?.is_super_admin || user?.rol === 'gerente_stock',
    isAdminStock: user?.is_super_admin || user?.rol === 'administrativo_stock' || user?.rol === 'admin',
    isOperario: user?.rol === 'operario',
    isOperarioStock: user?.rol === 'operario_stock' || user?.rol === 'atencion',
    darkMode,
    toggleDarkMode,
    login,
    logout,
    hasToolAccess,
    hasAccess,
    hasSubAccess,
  } as AuthContextType;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
