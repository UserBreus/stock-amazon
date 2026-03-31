import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../supabase';
import { UserProfile } from '../types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOperario: boolean;
  isOperarioStock: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (currentUser: User) => {
    let { data, error } = await supabase
      .from('roles_usuario')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    // Si no lo encuentra, esperamos un instante por si el trigger está procesando
    if (!data) {
      await new Promise(r => setTimeout(r, 600));
      const retry = await supabase.from('roles_usuario').select('*').eq('id', currentUser.id).single();
      data = retry.data;
    }

    if (data) {
      setProfile(data as UserProfile);
    } else {
      // Fallback seguro en memoria si falla la BD
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        rol: currentUser.email === 'user@nexus.com' ? 'admin' : 'operario'
      });
    }
    setLoading(false);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.rol === 'admin',
    isOperario: profile?.rol === 'operario',
    isOperarioStock: profile?.rol === 'operario_stock',
    darkMode,
    toggleDarkMode,
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
