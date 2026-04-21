import { createContext, useState, useEffect, useContext, ReactNode } from 'react';


export interface UserProfile {
  id: string;
  usuario: string;
  rol: string;
  sucursal_activa_id?: number;
  sucursal_activa_nombre?: string;
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexus_custom_user');
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
