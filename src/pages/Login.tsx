import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network, User as UserIcon, Lock, ArrowRight, CheckCircle, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

export function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (error) {
      console.error('Login con Google falló:', error);
      setError('No se pudo iniciar sesión con Google.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if(!username || !password) {
        setError('Por favor completa todos los campos.');
        return;
      }

      // Convertir el nombre de usuario local en un formato de mail compatible con Supabase Auth
      let authEmail = username.trim().toLowerCase();
      if (!authEmail.includes('@')) {
        authEmail = `${authEmail}@nexus.com`;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
      if (error) throw error;
    } catch (error: any) {
      console.error('Login falló:', error);
      setError('Credenciales incorrectas o usuario no encontrado.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950 transition-colors duration-500">
      <main className="flex-1 flex items-center justify-center p-8 lg:p-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-blue-50 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[600px] h-[600px] bg-blue-100 dark:bg-blue-800/10 rounded-full blur-[120px] pointer-events-none opacity-40"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md z-10"
        >
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-900 flex items-center justify-center shadow-2xl shadow-blue-900/30">
                <Network className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter leading-none">NEXUS</h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Logistics Int.</p>
              </div>
            </div>
            <h2 className="text-5xl font-black text-blue-950 dark:text-white mb-4 tracking-tight leading-[1.1]">Gestión de <br/><span className="text-blue-600">Precisión.</span></h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Accede a la plataforma de control logístico global.</p>
          </div>

          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-2xl p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
            <div className="space-y-8">
              
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 w-5 h-5 transition-colors" />
                    <input 
                      className="input-nexus pl-12" 
                      placeholder="ej. user" 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                    <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Recuperar</button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 w-5 h-5 transition-colors" />
                    <input 
                      className="input-nexus pl-12" 
                      placeholder="••••••••" 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full btn-primary py-4 text-base flex items-center justify-center gap-3"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>Entrar al Sistema</span>
                </button>
              </form>
              
              <div className="space-y-4">                
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                  <span className="relative px-4 bg-white dark:bg-slate-900 text-[10px] font-black text-slate-300 uppercase tracking-widest">O acceso directo</span>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full btn-primary py-4 text-base bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center gap-3 border border-transparent shadow-none hover:shadow-lg dark:hover:bg-blue-900/50"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Entrar con Google</span>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
            Sistema de seguridad biométrica y encriptación AES-256 activa. 
            © 2026 Nexus Logistics.
          </p>
        </motion.div>
      </main>

      <aside className="hidden lg:flex w-[45%] bg-slate-950 relative overflow-hidden flex-col justify-end p-20">
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 2 }}
          alt="Logística" 
          className="absolute inset-0 w-full h-full object-cover" 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white text-[10px] font-black uppercase tracking-widest">Global Network Active</span>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-6xl font-black text-white leading-[0.9] tracking-tighter">THE FUTURE <br/>OF SUPPLY.</h3>
            <p className="text-slate-400 max-w-md text-xl font-medium leading-relaxed">
              Monitoreo en tiempo real, análisis predictivo y automatización de última milla.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 pt-12 border-t border-white/10">
            <div className="space-y-1">
              <div className="text-white text-4xl font-black tracking-tighter">24/7</div>
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Soporte Operativo</div>
            </div>
            <div className="space-y-1">
              <div className="text-white text-4xl font-black tracking-tighter">100%</div>
              <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Trazabilidad</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
