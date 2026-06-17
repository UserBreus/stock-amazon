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
      const urlSucursalId = urlParams.get('sucursalId') || urlParams.get('sucursal_id');
      const urlSucursalNombre = urlParams.get('sucursalNombre') || urlParams.get('sucursal_nombre');
      
      if (embedId) {
        try {
            const cleanId = embedId.replace(/'/g, '');
            const res = await executeAWSQuery(`SELECT * FROM usuarios WHERE id = '${cleanId}'`);
            if (res && res.length > 0) {
               let parsedPermisos = {};
               try { parsedPermisos = typeof res[0].permisos === 'string' ? JSON.parse(res[0].permisos) : res[0].permisos; } catch(e){}
               const enrichedUser = { 
                   ...res[0], 
                   is_super_admin: res[0].rol === 'administrador' || res[0].is_super_admin || false, 
                   permisos_obj: parsedPermisos || { apps: ['stock'] },
                   sucursal_activa_id: urlSucursalId ? parseInt(urlSucursalId) : undefined,
                   sucursal_activa_nombre: urlSucursalNombre || undefined
               };
               setUser(enrichedUser as any);
               localStorage.setItem('nexus_custom_user', JSON.stringify(enrichedUser));
            }
        } catch(e){
            console.error(e);
        }
        setLoading(false);
        return;
      }

      const stored = localStorage.getItem('nexus_custom_user');
      if (stored) {
        try {
          const parsed: UserProfile = JSON.parse(stored);
          
          // Refresh session from DB to get the latest permissions from the general portal
          try {
            const cleanId = parsed.id.replace(/'/g, '');
            const res = await executeAWSQuery(`SELECT * FROM usuarios WHERE id = '${cleanId}'`);
            if (res && res.length > 0) {
                let parsedPermisos = null;
                try { parsedPermisos = typeof res[0].permisos === 'string' ? JSON.parse(res[0].permisos) : res[0].permisos; } catch(e){}
                const enrichedUser = { 
                    ...res[0], 
                    is_super_admin: res[0].rol === 'administrador' || res[0].is_super_admin || false, 
                    permisos_obj: parsedPermisos || { apps: ['stock'] },
                    sucursal_activa_id: urlSucursalId ? parseInt(urlSucursalId) : parsed.sucursal_activa_id,
                    sucursal_activa_nombre: urlSucursalNombre || parsed.sucursal_activa_nombre
                };
                
                if (!enrichedUser.is_super_admin) {
                    const p = enrichedUser.permisos_obj;
                    const hasStockAccess = Array.isArray(p)
                        ? p.some((x: string) => x.startsWith('sidebar_') || x === 'stock')
                        : Boolean(p?.apps?.includes('stock'));
                    
                    if (p && !hasStockAccess) {
                        localStorage.removeItem('nexus_custom_user');
                        window.location.href = '/?error=Acceso Denegado a Stock';
                        return;
                    }
                }
                
                setUser(enrichedUser as any);
                localStorage.setItem('nexus_custom_user', JSON.stringify(enrichedUser));
             } else {
                localStorage.removeItem('nexus_custom_user');
             }
          } catch (dbErr) {
             console.error("Error refreshing session from DB, using cached session:", dbErr);
             if (!parsed.is_super_admin) {
                 const p = parsed.permisos_obj;
                 const hasStockAccess = Array.isArray(p)
                     ? p.some((x: string) => x.startsWith('sidebar_') || x === 'stock')
                     : Boolean(p?.apps?.includes('stock'));
                     
                 if (p && !hasStockAccess) {
                     localStorage.removeItem('nexus_custom_user');
                     window.location.href = '/?error=Acceso Denegado a Stock';
                     return;
                 }
             }
             setUser(parsed);
          }
        } catch (e) {
          console.error("Error parsing stored user", e);
          localStorage.removeItem('nexus_custom_user');
        }
      } else {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost) {
          try {
            const res = await executeAWSQuery(`SELECT * FROM usuarios WHERE id = 'Martin'`);
            if (res && res.length > 0) {
               let parsedPermisos = {};
               try { parsedPermisos = typeof res[0].permisos === 'string' ? JSON.parse(res[0].permisos) : res[0].permisos; } catch(e){}
               const enrichedUser = { 
                   ...res[0], 
                   is_super_admin: res[0].rol === 'administrador' || res[0].is_super_admin || false, 
                   permisos_obj: parsedPermisos || { apps: ['stock'] },
                   sucursal_activa_id: urlSucursalId ? parseInt(urlSucursalId) : undefined,
                   sucursal_activa_nombre: urlSucursalNombre || undefined
               };
               setUser(enrichedUser as any);
               localStorage.setItem('nexus_custom_user', JSON.stringify(enrichedUser));
            } else {
              const fallbackUser: UserProfile = {
                id: "Martin",
                usuario: "Martin",
                nombre_completo: "Martin (Local Admin)",
                rol: "administrador",
                is_super_admin: true,
                permisos_obj: { apps: ["stock", "ventas"] },
                sucursal_activa_id: urlSucursalId ? parseInt(urlSucursalId) : undefined,
                sucursal_activa_nombre: urlSucursalNombre || undefined
              };
              setUser(fallbackUser);
              localStorage.setItem('nexus_custom_user', JSON.stringify(fallbackUser));
            }
          } catch(e) {
            console.error("Auto-login local falló, usando fallback local:", e);
            const fallbackUser: UserProfile = {
              id: "Martin",
              usuario: "Martin",
              nombre_completo: "Martin (Local Admin)",
              rol: "administrador",
              is_super_admin: true,
              permisos_obj: { apps: ["stock", "ventas"] },
              sucursal_activa_id: urlSucursalId ? parseInt(urlSucursalId) : undefined,
              sucursal_activa_nombre: urlSucursalNombre || undefined
            };
            setUser(fallbackUser);
            localStorage.setItem('nexus_custom_user', JSON.stringify(fallbackUser));
          }
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
      if (!p) {
          if (user.rol === 'administrador' || user.rol === 'admin') return "write";
          if (user.rol === 'encargado' || user.rol === 'gerente_stock') return "write";
          return "none";
      }

      if (Array.isArray(p)) {
          const cleanToolId = toolId.replace('sidebar_', '');
          const hasIt = p.includes(toolId) || p.includes(cleanToolId);
          return hasIt ? "write" : "none";
      }

      if (!p.apps?.includes('stock')) return "none";

      const tool = p.stock_tools?.[toolId] || p.stock_tools?.[toolId.replace('sidebar_', '')];
      if (!tool) {
          if (user.rol === 'administrador' || user.rol === 'admin') return "write";
          if (user.rol === 'encargado' || user.rol === 'gerente_stock') return "write";
          return "none";
      }
      
      if (tool.access === 'none') {
          // If parent access is denied, but the user has at least one active sub-permission, grant access to the main module
          const subVals = Object.values(tool.sub || {});
          if (subVals.some(v => v === 'write')) return "write";
          if (subVals.some(v => v === 'read')) return "read";
          return "none";
      }

      return tool.access;
  };

  const hasAccess = (toolId: string): AccessLevel => getToolAccess(toolId);

  const hasSubAccess = (toolId: string, subToolId: string): AccessLevel => {
      if (!user) return "none";
      if (user.is_super_admin) return "write";

      const p = user.permisos_obj;
      if (!p) {
          if (user.rol === 'administrador' || user.rol === 'admin') return "write";
          if (user.rol === 'encargado' || user.rol === 'gerente_stock') return "write";
          return "none";
      }

      if (Array.isArray(p)) {
          const cleanToolId = toolId.replace('sidebar_', '');
          const hasIt = p.includes(toolId) || p.includes(cleanToolId);
          return hasIt ? "write" : "none";
      }

      if (!p.apps?.includes('stock')) return "none";

      const tool = p.stock_tools?.[toolId] || p.stock_tools?.[toolId.replace('sidebar_', '')];
      if (!tool) {
          if (user.rol === 'administrador' || user.rol === 'admin') return "write";
          if (user.rol === 'encargado' || user.rol === 'gerente_stock') return "write";
          return "none";
      }

      if (subToolId) {
          const subAccess = tool.sub?.[subToolId];
          if (subAccess === 'none') return "none";
          if (subAccess) return subAccess;
          
          // If parent is blocked, do not inherit
          if (tool.access === 'none') return "none";

          if (user.rol === 'administrador' || user.rol === 'admin') return "write";
          if (user.rol === 'encargado' || user.rol === 'gerente_stock') return "write";
          return tool.access;
      }

      if (tool.access === 'none') {
          const subVals = Object.values(tool.sub || {});
          if (subVals.some(v => v === 'write')) return "write";
          if (subVals.some(v => v === 'read')) return "read";
          return "none";
      }

      return tool.access;
  };

  const hasToolAccess = (moduleId: string, allowedRoles?: string[]) => {
      if (!user) return false;
      if (user.is_super_admin) return true;
      
      const acc = getToolAccess(moduleId);
      if (acc === "write" || acc === "read") return true;

      const p = user.permisos_obj;
      // If there is an explicit permissions configuration (either array or object with the tool defined),
      // do NOT fall back to roles. Respect the explicit "none" access.
      if (p) {
          if (Array.isArray(p)) {
              // Array lists explicitly allowed modules. If it's not allowed, do not fall back.
              return false;
          }
          const cleanId = moduleId.replace('sidebar_', '');
          const toolConfig = p.stock_tools?.[moduleId] || p.stock_tools?.[cleanId];
          if (toolConfig) {
              // It was explicitly configured in the JSON (e.g., as "none"). Do not fall back.
              return false;
          }
      }

      // Fallback based on roles if no granular permissions exist in the portal JSON
      if (allowedRoles && user.rol) {
          const normalizedUserRol = user.rol.toLowerCase();
          return allowedRoles.some(r => {
              const normR = r.toLowerCase();
              if (normR === 'admin' && normalizedUserRol === 'administrador') return true;
              if (normR === 'gerente_stock' && normalizedUserRol === 'encargado') return true;
              if (normR === 'operario_stock' && normalizedUserRol === 'operario') return true;
              return normalizedUserRol.includes(normR) || normR.includes(normalizedUserRol);
          });
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
    isGerente: user?.is_super_admin || Boolean(user?.rol && (user.rol.includes('gerente') || user.rol.includes('admin') || user.rol.includes('encargado') || user.rol === 'encargado')),
    isAdminStock: user?.is_super_admin || Boolean(user?.rol && (user.rol.includes('admin') || user.rol.includes('administrador') || user.rol === 'administrador' || user.rol.includes('encargado') || user.rol === 'encargado')),
    isOperario: user?.rol === 'operario' || user?.rol === 'operario_stock',
    isOperarioStock: user?.rol === 'operario_stock' || user?.rol === 'atencion' || user?.rol === 'operario',
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
