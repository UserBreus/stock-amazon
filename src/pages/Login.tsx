import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network, User as UserIcon, Lock, ArrowRight, CheckCircle, Mail, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { executeAWSQuery } from '../lib/aws-client';

export function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [depositos, setDepositos] = useState<any[]>([]);
  const [selectedDeposito, setSelectedDeposito] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    executeAWSQuery('SELECT id, nombre, tipo FROM Stock_Depositos WHERE estado = \'activo\'')
      .then(data => setDepositos(data || []))
      .catch(err => console.error("Error loading depositos", err));
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if(!username || !password) {
        setError('Por favor completa todos los campos.');
        return;
      }

      if (!selectedDeposito) {
        setError('Debes seleccionar tu ubicación de trabajo actual.');
        return;
      }

      const depoRecord = depositos.find(d => d.id.toString() === selectedDeposito);

      // Consulta al Proxy de AWS
      const query = `SELECT id, rol, nombre_completo, cedula FROM usuarios WHERE id = '${username.replace(/'/g, "''").trim()}' AND pass = '${password.replace(/'/g, "''")}'`;
      const data = await executeAWSQuery(query);

      if (!data || data.length === 0) {
        throw new Error('No user found');
      }

      // Registrar sesión en auditoría
      try {
        await executeAWSQuery(`INSERT INTO Stock_Sesiones_Login (usuario_id, deposito_id) VALUES ('${data[0].id}', ${selectedDeposito})`);
      } catch(audErr) {
        console.error("No se pudo registrar la sesión de auditoría", audErr);
      }
      
      // Llamar al contexto manual para guardar sesión
      login(username.trim(), data[0], parseInt(selectedDeposito), depoRecord?.nombre);
      
    } catch (error: any) {
      console.error('Login falló:', error);
      setError('Usuario o contraseña incorrectos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-500">
      <main className="w-full max-w-md p-8 relative overflow-hidden">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full z-10"
        >
          <div className="mb-12 text-center">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Network className="text-black w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-cyan-950 dark:text-cyan-400 tracking-tighter leading-none mb-2">USER</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.3em]">Venta y Stock</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none">
            <div className="space-y-8">
              
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario del Sistema</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 w-5 h-5 transition-colors" />
                    <input 
                      className="input-nexus pl-12" 
                      placeholder="Identificador o usuario..." 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Token de Acceso</label>
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación Actual</label>
                  </div>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 w-5 h-5 transition-colors z-10" />
                    <select 
                      className="input-nexus pl-12 appearance-none w-full"
                      value={selectedDeposito}
                      onChange={(e) => setSelectedDeposito(e.target.value)}
                    >
                      <option value="" disabled>Seleccionar sucursal de turno...</option>
                      {depositos.map(d => (
                        <option key={d.id} value={d.id}>{d.nombre} ({d.tipo})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full btn-primary py-4 text-base flex items-center justify-center gap-3"
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span>Autorizar Entrada</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <p className="mt-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
            Sistema de seguridad biométrica y encriptación AES-256 activa. 
            © 2026 USER STOCK.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
