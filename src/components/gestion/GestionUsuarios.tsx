import React, { useState, useEffect } from 'react';
import { executeAWSQuery } from '../../lib/aws-client';
import toast from 'react-hot-toast';
import { UserPlus, Edit2, Shield, Search, Key, ShieldCheck, CheckCircle, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

interface Usuario {
  id: string;
  pass: string;
  rol: string;
  nombre_completo: string;
  cedula: string;
  permisos?: string;
}

const MODULES = [
  { id: 'sidebar_dashboard', name: 'Panel de Control', desc: 'Métricas y reportes' },
  { id: 'sidebar_inventario', name: 'Inventario Global', desc: 'Visión completa y traslados' },
  { id: 'sidebar_sectores', name: 'Mi Sector', desc: 'Visión operativa y lote' },
  { id: 'sidebar_compras', name: 'Compras', desc: 'Ingreso de mercadería' },
  { id: 'sidebar_sistema', name: 'Gestión de Sistema', desc: 'Configuración y usuarios' }
];

const ROLES = [
  { id: 'gerente_stock', name: 'Gerente' },
  { id: 'admin', name: 'Administrador' },
  { id: 'administrativo_stock', name: 'Administrativo' },
  { id: 'operario_stock', name: 'Operario Stock' },
  { id: 'operario', name: 'Operario Básico' },
  { id: 'vendedor', name: 'Vendedor' },
  { id: 'atencion', name: 'Atención al Cliente' }
];

export function GestionUsuarios() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    pass: '',
    rol: 'operario',
    nombre_completo: '',
    cedula: ''
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await executeAWSQuery("SELECT id, pass, rol, nombre_completo, cedula, permisos FROM usuarios");
      if (res) {
        res.sort((a: any, b: any) => (a.nombre_completo || '').localeCompare(b.nombre_completo || ''));
        setUsers(res);
      }
    } catch (e: any) {
      toast.error('Error cargando usuarios: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user?: Usuario) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        id: user.id,
        pass: user.pass || '',
        rol: user.rol || 'operario',
        nombre_completo: user.nombre_completo || '',
        cedula: user.cedula || ''
      });
      
      let perms: string[] = [];
      if (user.permisos) {
        try { perms = JSON.parse(user.permisos); } catch(e) {}
      } else {
        // Fallback default based on role just for UI population if they don't have explicit permissions yet
        if (user.rol === 'admin' || user.rol === 'gerente_stock') perms = MODULES.map(m => m.id);
      }
      setSelectedModules(perms);
    } else {
      setEditingId(null);
      setFormData({ id: '', pass: '', rol: 'operario', nombre_completo: '', cedula: '' });
      setSelectedModules([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.pass || !formData.nombre_completo) {
      return toast.error("Por favor completa los campos requeridos.");
    }

    try {
      const idSafe = formData.id.replace(/'/g, "''").trim();
      const passSafe = formData.pass.replace(/'/g, "''");
      const nameSafe = formData.nombre_completo.replace(/'/g, "''");
      const cedulaSafe = formData.cedula.replace(/'/g, "''");
      const rolSafe = formData.rol;
      const permisosJSON = JSON.stringify(selectedModules).replace(/'/g, "''");

      if (editingId) {
        // UPDATE
        const query = `
          UPDATE usuarios 
          SET pass = '${passSafe}', rol = '${rolSafe}', nombre_completo = '${nameSafe}', cedula = '${cedulaSafe}', permisos = '${permisosJSON}'
          WHERE id = '${idSafe}'
        `;
        await executeAWSQuery(query);
        toast.success("Usuario actualizado correctamente.");
      } else {
        // INSERT
        // Check if exists
        const check = await executeAWSQuery(`SELECT id FROM usuarios WHERE id = '${idSafe}'`);
        if (check && check.length > 0) {
          return toast.error("Ya existe un usuario con este identificador.");
        }
        const query = `
          INSERT INTO usuarios (id, pass, rol, nombre_completo, cedula, permisos)
          VALUES ('${idSafe}', '${passSafe}', '${rolSafe}', '${nameSafe}', '${cedulaSafe}', '${permisosJSON}')
        `;
        await executeAWSQuery(query);
        toast.success("Usuario creado exitosamente.");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(search.toLowerCase()) || 
    (u.nombre_completo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Control de Acceso</h2>
            <p className="text-xs text-slate-500 font-medium">Gestiona cuentas, contraseñas y permisos granulares de visibilidad por módulo.</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar usuario..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button 
            onClick={() => openModal()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400"><div className="loader mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Identificador</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Nombre Completo</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Rol Base</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Módulos Permitidos</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredUsers.map(user => {
                  let perms: string[] = [];
                  if (user.permisos) {
                    try { perms = JSON.parse(user.permisos); } catch(e) {}
                  }
                  
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{user.nombre_completo}</div>
                        {user.cedula && <div className="text-[10px] text-slate-400 font-mono mt-0.5">CI: {user.cedula}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-600 dark:text-slate-400 rounded">
                          {ROLES.find(r => r.id === user.rol)?.name || user.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.permisos ? (
                          <div className="flex flex-wrap gap-1">
                            {perms.map(p => {
                              const m = MODULES.find(mod => mod.id === p);
                              return <span key={p} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 text-[9px] font-bold uppercase rounded border border-emerald-100 dark:border-emerald-800/50">{m?.name || p}</span>;
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Depende del rol (Legado)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-bold">No se encontraron usuarios.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Usuario" : "Crear Nuevo Usuario"} maxWidth="max-w-3xl">
        <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4"/> Datos Personales y de Acceso</h3>
            
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Usuario / ID (Para Login) *</label>
              <input 
                type="text" 
                required 
                disabled={!!editingId}
                value={formData.id} 
                onChange={e => setFormData({...formData, id: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 font-mono font-bold focus:border-indigo-500 outline-none disabled:opacity-50"
              />
              {editingId && <p className="text-[9px] text-amber-500 mt-1">El ID de usuario no se puede cambiar.</p>}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Contraseña *</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required 
                  value={formData.pass} 
                  onChange={e => setFormData({...formData, pass: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 font-mono font-bold focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Nombre Completo *</label>
              <input 
                type="text" 
                required 
                value={formData.nombre_completo} 
                onChange={e => setFormData({...formData, nombre_completo: e.target.value})} 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 font-bold focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Cédula</label>
                <input 
                  type="text" 
                  value={formData.cedula} 
                  onChange={e => setFormData({...formData, cedula: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 font-bold focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Rol Base</label>
                <select 
                  value={formData.rol} 
                  onChange={e => setFormData({...formData, rol: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-bold focus:border-indigo-500 outline-none"
                >
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase text-indigo-500 tracking-widest border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Permisos de Visibilidad (Módulos)</h3>
            <p className="text-[10px] text-slate-500 leading-tight mb-4">Selecciona exactamente a qué partes del menú lateral tendrá acceso este usuario. Esto sobreescribe la visibilidad por defecto del rol.</p>
            
            <div className="space-y-3">
              {MODULES.map(mod => {
                const isSelected = selectedModules.includes(mod.id);
                return (
                  <label key={mod.id} className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                    isSelected ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                  )}>
                    <div className={cn("mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors", isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800")}>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-bold text-sm", isSelected ? "text-indigo-900 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300")}>{mod.name}</p>
                      <p className="text-[10px] text-slate-500">{mod.desc}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedModules([...selectedModules, mod.id]);
                        else setSelectedModules(selectedModules.filter(id => id !== mod.id));
                      }}
                    />
                  </label>
                );
              })}
            </div>
            
            {selectedModules.length === 0 && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl text-[10px] font-bold text-rose-600 dark:text-rose-400">
                ⚠️ Cuidado: Este usuario no tendrá acceso a ningún módulo si no seleccionas al menos uno.
              </div>
            )}
          </div>

          <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" className="px-8 py-3 font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 rounded-xl transition-transform active:scale-95 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Guardar Perfil
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
