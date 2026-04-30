import React, { useState, useEffect, useRef } from 'react';
import { executeAWSQuery } from '../../lib/aws-client';
import toast from 'react-hot-toast';
import { User as UserIcon, Camera, Key, Mail, Shield, CheckCircle, Users, X, Smile } from 'lucide-react';
import { Modal } from './Modal';
import { useAuth, UserProfile } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { GestionUsuarios } from '../gestion/GestionUsuarios';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserLogo = ({ className, color }: { className?: string, color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74.93 114.93" className={className} style={{ color }}>
    <path fill="currentColor" d="M74.93,87.65h-26.09v-7.16c-2.6,2.6-5.75,4.61-9.47,6.01-3.71,1.41-7.34,2.11-10.9,2.11-8.06,0-14.64-2.5-19.72-7.48-3.39-3.39-5.7-7.1-6.92-11.09-1.22-4-1.83-8.65-1.83-13.96V0h26.72v52.5c0,4.41,1.15,7.5,3.46,9.31,2.31,1.8,4.73,2.7,7.28,2.7s4.98-.89,7.28-2.66c2.31-1.78,3.46-4.89,3.46-9.34V.01h26.72v87.65h0Z"/>
    <path fill="currentColor" d="M74.93,114.93H7.92c-4.38,0-7.92-3.55-7.92-7.92v-1.53c0-4.37,3.55-7.92,7.92-7.92h67.01v17.37h0Z"/>
  </svg>
);

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { profile, login, user } = useAuth();
  const isAdmin = profile?.rol === 'admin' || profile?.rol === 'gerente_stock';
  const [activeTab, setActiveTab] = useState<'perfil' | 'equipo'>('perfil');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    id: profile?.id || '',
    nombre_completo: profile?.nombre_completo || '',
    pass: ''
  });
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(profile?.avatar || null);
  
  // Custom Avatar Creator State
  const [creatorSeed, setCreatorSeed] = useState(profile?.id || 'nexus');
  const [avatarProps, setAvatarProps] = useState({
    top: 'shortFlat',
    hairColor: '2c1b18',
    accessories: '',
    accessoriesColor: '262e33',
    facialHair: '',
    facialHairColor: '2c1b18',
    clothing: 'blazerAndShirt',
    skinColor: 'edb98a',
    logoColor: '#ffffff'
  });

  // Construct URL dynamically to avoid sending empty params which crashes the API
  const buildPreviewUrl = (style = 'circle', format = 'png', specificProps = avatarProps, bgTransparent = false) => {
    const params = new URLSearchParams({
      seed: creatorSeed,
      style: style,
      accessoriesProbability: specificProps.accessories ? '100' : '0',
      facialHairProbability: specificProps.facialHair ? '100' : '0'
    });
    
    if (bgTransparent) {
      params.append('backgroundColor', 'transparent');
    } else {
      params.append('backgroundColor', 'b6e3f4,c0aede,d1d4f9,ffdfbf');
    }
    
    if (specificProps.top) params.append('top', specificProps.top);
    if (specificProps.hairColor) params.append('hairColor', specificProps.hairColor);
    if (specificProps.accessories) params.append('accessories', specificProps.accessories);
    if (specificProps.accessoriesColor) params.append('accessoriesColor', specificProps.accessoriesColor);
    if (specificProps.facialHair) params.append('facialHair', specificProps.facialHair);
    if (specificProps.facialHairColor) params.append('facialHairColor', specificProps.facialHairColor);
    if (specificProps.clothing) params.append('clothing', specificProps.clothing);
    if (specificProps.skinColor) params.append('skinColor', specificProps.skinColor);

    return `https://api.dicebear.com/7.x/avataaars/${format}?${params.toString()}`;
  };

  const previewUrl = buildPreviewUrl('circle', 'svg');

  const AVATAR_OPTIONS = {
    top: [
      // Modern & Detailed
      { id: 'shavedSides', name: 'Laterales Rapados' },
      { id: 'theCaesarAndSidePart', name: 'César con Raya' },
      { id: 'shortCurly', name: 'Corto Rizado' },
      { id: 'shortRound', name: 'Corto Redondo' },
      { id: 'shortWaved', name: 'Corto Ondulado' },
      { id: 'shaggy', name: 'Desaliñado' },
      { id: 'shaggyMullet', name: 'Mullet Moderno' },
      { id: 'sides', name: 'Solo Laterales' },
      { id: 'dreads01', name: 'Dreads Finas' },
      { id: 'dreads02', name: 'Dreads Gruesas' },
      { id: 'frizzle', name: 'Frizz Abundante' },
      { id: 'curvy', name: 'Ondulado Largo' },
      { id: 'straightAndStrand', name: 'Lacio con Mechón' },
      { id: 'longButNotTooLong', name: 'Largo Medio' },
      { id: 'bigHair', name: 'Volumen Alto' },
      { id: 'frida', name: 'Trenzas Arriba' },
      { id: 'fro', name: 'Afro Grande' },
      { id: 'froBand', name: 'Afro con Banda' },
      { id: 'miaWallace', name: 'Bob Recto' },
      { id: 'straight02', name: 'Lacio Capas' },
      // Classics
      { id: 'shortFlat', name: 'Corto Liso' },
      { id: 'theCaesar', name: 'César' },
      { id: 'straight01', name: 'Largo Lacio' },
      { id: 'curly', name: 'Largo Rizado' },
      { id: 'bob', name: 'Corte Bob' },
      { id: 'bun', name: 'Moño' },
      { id: 'dreads', name: 'Rastas' },
      { id: 'hat', name: 'Sombrero' },
      { id: 'winterHat1', name: 'Gorro Invierno' },
      { id: 'winterHat02', name: 'Gorro Orejero' },
      { id: 'winterHat03', name: 'Gorro Pompón' },
      { id: 'winterHat04', name: 'Gorro Caído' },
      { id: 'hijab', name: 'Hijab' },
      { id: 'turban', name: 'Turbante' }
    ],
    accessories: [
      { id: '', name: 'Ninguno' },
      { id: 'prescription01', name: 'Lentes Clásicos' },
      { id: 'prescription02', name: 'Lentes Finos' },
      { id: 'round', name: 'Redondos' },
      { id: 'sunglasses', name: 'Gafas de Sol' },
      { id: 'wayfarers', name: 'Estilo Wayfarer' },
      { id: 'eyepatch', name: 'Parche' }
    ],
    facialHair: [
      { id: '', name: 'Sin Barba' },
      { id: 'beardMedium', name: 'Barba Media' },
      { id: 'beardLight', name: 'Barba Ligera' },
      { id: 'beardMajestic', name: 'Barba Majestuosa' },
      { id: 'moustacheFancy', name: 'Bigote Fino' },
      { id: 'moustacheMagnum', name: 'Bigote Grueso' }
    ],
    clothing: [
      { id: 'blazerAndShirt', name: 'Traje y Camisa' },
      { id: 'blazerAndSweater', name: 'Traje y Suéter' },
      { id: 'collarAndSweater', name: 'Suéter con Cuello' },
      { id: 'graphicShirt', name: 'Camiseta Gráfica' },
      { id: 'hoodie', name: 'Sudadera' },
      { id: 'overall', name: 'Overol' },
      { id: 'shirtCrewNeck', name: 'Camiseta Casual' }
    ],
    skinColor: [
      { id: 'ffdbb4', name: 'Pálida' },
      { id: 'edb98a', name: 'Clara' },
      { id: 'f8d25c', name: 'Amarilla' },
      { id: 'd08b5b', name: 'Bronceada' },
      { id: 'ae5d29', name: 'Castaña' },
      { id: '614335', name: 'Oscura' }
    ],
    hairColor: [
      { id: '2c1b18', name: 'Negro' },
      { id: '4a312c', name: 'Marrón Oscuro' },
      { id: 'a55728', name: 'Castaño' },
      { id: 'd6b370', name: 'Rubio' },
      { id: 'c93305', name: 'Pelirrojo' },
      { id: 'e8e1e1', name: 'Gris' },
      { id: 'f59797', name: 'Rosa' }
    ],
    accessoriesColor: [
      { id: '262e33', name: 'Negro Mate' },
      { id: 'e6e6e6', name: 'Plata / Blanco' },
      { id: 'ffdeb5', name: 'Dorado Metalizado' },
      { id: '5199e4', name: 'Azul Espejo' },
      { id: 'ff488e', name: 'Rosa Neón' },
      { id: 'ff5c5c', name: 'Rojo Fuego' }
    ],
    logoColor: [
      { id: '#ffffff', name: 'Blanco' },
      { id: '#000000', name: 'Negro' },
      { id: '#4f46e5', name: 'Índigo' },
      { id: '#ef4444', name: 'Rojo' },
      { id: '#22c55e', name: 'Verde' },
      { id: '#eab308', name: 'Amarillo' }
    ]
  };

  const handleStampAvatar = async () => {
    try {
      toast.loading('Estampando logo...', { id: 'stamp' });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = buildPreviewUrl('circle', 'png') + '&size=512';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      ctx.drawImage(img, 0, 0, 512, 512);

      const svgLogo = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74.93 114.93" width="64" height="64">
          <path fill="${avatarProps.logoColor}" d="M74.93,87.65h-26.09v-7.16c-2.6,2.6-5.75,4.61-9.47,6.01-3.71,1.41-7.34,2.11-10.9,2.11-8.06,0-14.64-2.5-19.72-7.48-3.39-3.39-5.7-7.1-6.92-11.09-1.22-4-1.83-8.65-1.83-13.96V0h26.72v52.5c0,4.41,1.15,7.5,3.46,9.31,2.31,1.8,4.73,2.7,7.28,2.7s4.98-.89,7.28-2.66c2.31-1.78,3.46-4.89,3.46-9.34V.01h26.72v87.65h0Z"/>
          <path fill="${avatarProps.logoColor}" d="M74.93,114.93H7.92c-4.38,0-7.92-3.55-7.92-7.92v-1.53c0-4.37,3.55-7.92,7.92-7.92h67.01v17.37h0Z"/>
        </svg>
      `;
      const svgBlob = new Blob([svgLogo], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const logoImg = new Image();
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        logoImg.src = svgUrl;
      });

      // Draw Logo on chest (lower position)
      ctx.drawImage(logoImg, 256 - 32, 420, 64, 64);
      
      const finalBase64 = canvas.toDataURL('image/png', 0.9);
      setAvatarBase64(finalBase64);
      setIsAvatarCreatorOpen(false);
      toast.success('Avatar y Logo estampados. ¡No olvides guardar tu perfil!', { id: 'stamp' });
    } catch (e) {
      console.error(e);
      toast.error('Error al estampar logo', { id: 'stamp' });
    }
  };



  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: profile?.id || '',
        nombre_completo: profile?.nombre_completo || '',
        pass: ''
      });
      setAvatarBase64(profile?.avatar || null);
      if (activeTab === 'equipo') {
        fetchAllUsers();
      }
    }
  }, [isOpen, profile, activeTab]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const res = await executeAWSQuery("SELECT id, rol, nombre_completo, avatar FROM usuarios");
      if (res) {
        res.sort((a: any, b: any) => (a.nombre_completo || '').localeCompare(b.nombre_completo || ''));
        setUsers(res);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Error cargando equipo: ' + e.message);
    } finally {
      setLoading(false);
    }
  };



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.nombre_completo) {
      return toast.error('El nombre y el usuario son obligatorios.');
    }

    setLoading(true);
    try {
      const idSafe = formData.id.replace(/'/g, "''").trim();
      const nombreSafe = formData.nombre_completo.replace(/'/g, "''").trim();
      
      let updateQuery = `UPDATE usuarios SET id = '${idSafe}', nombre_completo = '${nombreSafe}'`;
      
      if (formData.pass.trim()) {
         updateQuery += `, pass = '${formData.pass.replace(/'/g, "''")}'`;
      }
      if (avatarBase64) {
         updateQuery += `, avatar = '${avatarBase64}'`;
      }
      
      updateQuery += ` WHERE id = '${profile?.id}'`;

      await executeAWSQuery(updateQuery);
      toast.success('Perfil actualizado correctamente.');

      // Update local AuthContext so the user doesn't have to log out
      if (user && profile) {
          const updatedProfile: UserProfile = {
              ...profile,
              id: formData.id,
              usuario: formData.id, // AuthContext maps usuario to id visually sometimes
              nombre_completo: formData.nombre_completo,
              avatar: avatarBase64 || profile.avatar
          };
          login(formData.id, updatedProfile, profile.sucursal_activa_id, profile.sucursal_activa_nombre);
      }
      
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Mi Perfil" maxWidth="max-w-2xl">
      <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
        <button
          onClick={() => setActiveTab('perfil')}
          className={cn(
            "px-4 py-4 text-sm font-black tracking-widest uppercase transition-colors relative",
            activeTab === 'perfil' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          )}
        >
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" /> Mis Datos
          </div>
          {activeTab === 'perfil' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400" />}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('equipo')}
            className={cn(
              "px-4 py-4 text-sm font-black tracking-widest uppercase transition-colors relative",
              activeTab === 'equipo' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Personal
            </div>
            {activeTab === 'equipo' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400" />}
          </button>
        )}
      </div>

      <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
        {activeTab === 'perfil' ? (
          <form id="profileForm" onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative group cursor-pointer" onClick={() => setIsAvatarCreatorOpen(true)}>
                <img 
                  src={avatarBase64 || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || 'nexus'}`} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-3xl object-cover ring-4 ring-slate-50 dark:ring-slate-900 group-hover:ring-indigo-500/50 shadow-xl transition-all duration-300"
                />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Smile className="w-4 h-4" />
                </div>
              </div>
              
              <div className="flex gap-2 mt-5">
                <button type="button" onClick={() => setIsAvatarCreatorOpen(true)} className="px-5 py-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95">
                  <Camera className="w-4 h-4" /> Cargar y Editar Avatar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuario (ID Login)</label>
                <input 
                  type="text" 
                  required 
                  value={formData.id} 
                  onChange={e => setFormData({...formData, id: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-mono font-bold focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre Completo</label>
                <input 
                  type="text" 
                  required 
                  value={formData.nombre_completo} 
                  onChange={e => setFormData({...formData, nombre_completo: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nueva Contraseña (Opcional)</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder="Dejar en blanco para no cambiar..."
                    value={formData.pass} 
                    onChange={e => setFormData({...formData, pass: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 font-mono font-bold focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 mt-6 flex items-center gap-3">
              <Shield className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Rol asignado: {profile?.rol}</p>
                <p className="text-[10px] text-slate-500">Para cambiar tu rol u otros permisos avanzados, contacta con un administrador del sistema.</p>
              </div>
            </div>
          </form>
        ) : (
          isAdmin ? (
            <div className="-mx-6 -mt-6">
              <GestionUsuarios />
            </div>
          ) : (
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center p-10"><div className="loader"></div></div>
              ) : (
                users.map((u, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <img 
                      src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-slate-950"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-none mb-1">{u.nombre_completo || u.id}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{u.rol}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cerrar</button>
        {activeTab === 'perfil' && (
          <button 
            type="submit" 
            form="profileForm"
            disabled={loading}
            className="px-6 py-2.5 font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 rounded-xl transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" /> Guardar Cambios
          </button>
        )}
      </div>

      {isAvatarCreatorOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800">
            
            {/* Preview Area */}
            <div className="bg-slate-50 dark:bg-slate-950 p-8 flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 relative">
              <h2 className="absolute top-6 left-6 font-black text-xl text-slate-800 dark:text-slate-200">Creador de Avatar</h2>
              <button onClick={() => setIsAvatarCreatorOpen(false)} className="absolute top-6 right-6 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-64 h-64 rounded-3xl overflow-hidden shadow-2xl ring-8 ring-white dark:ring-slate-800 mt-8 md:mt-0 relative group bg-white">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <UserLogo className="w-8 h-8 absolute left-1/2 -translate-x-1/2 top-[82%] drop-shadow-md transition-colors" color={avatarProps.logoColor} />
              </div>
            </div>

            {/* Controls Area */}
            <div className="p-8 flex-1 flex flex-col justify-start space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
              
              {/* Ajustes Generales */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-wrap gap-6 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Tono de Piel</label>
                  <div className="flex gap-1.5">
                    {AVATAR_OPTIONS.skinColor.map(o => (
                      <button key={o.id} onClick={() => setAvatarProps({...avatarProps, skinColor: o.id})} className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", avatarProps.skinColor === o.id ? "border-indigo-600 scale-110 ring-2 ring-indigo-200 dark:ring-indigo-900" : "border-slate-200 dark:border-slate-700")} style={{ backgroundColor: `#${o.id}` }} title={o.name} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Color Logo</label>
                  <div className="flex gap-1.5">
                    {AVATAR_OPTIONS.logoColor.map(o => (
                      <button key={o.id} onClick={() => setAvatarProps({...avatarProps, logoColor: o.id})} className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", avatarProps.logoColor === o.id ? "border-indigo-600 scale-110 ring-2 ring-indigo-200 dark:ring-indigo-900" : "border-slate-200 dark:border-slate-700")} style={{ backgroundColor: o.id }} title={o.name} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Cabello Visual */}
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block m-0">Cabello / Sombrero</label>
                  <div className="flex gap-1">
                    {AVATAR_OPTIONS.hairColor.map(o => (
                      <button key={o.id} onClick={() => setAvatarProps({...avatarProps, hairColor: o.id})} className={cn("w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700 transition-transform", avatarProps.hairColor === o.id && "scale-125 ring-1 ring-indigo-500")} style={{ backgroundColor: `#${o.id}` }} title={o.name} />
                    ))}
                  </div>
                </div>
                <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar pr-4">
                  {AVATAR_OPTIONS.top.map(o => (
                    <button key={o.id} onClick={() => setAvatarProps({...avatarProps, top: o.id})} className={cn("shrink-0 w-16 h-16 border-2 rounded-2xl transition-all overflow-hidden relative", avatarProps.top === o.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700")}>
                      <img className="w-full h-full object-cover scale-[1.7] translate-y-3" src={buildPreviewUrl('default', 'svg', {...avatarProps, top: o.id, accessories: '', facialHair: ''}, true)} alt={o.name} title={o.name} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Barba Visual */}
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block m-0">Barba / Bigote</label>
                  <div className="flex gap-1">
                    {AVATAR_OPTIONS.hairColor.map(o => (
                      <button key={o.id} onClick={() => setAvatarProps({...avatarProps, facialHairColor: o.id})} className={cn("w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700 transition-transform", avatarProps.facialHairColor === o.id && "scale-125 ring-1 ring-indigo-500")} style={{ backgroundColor: `#${o.id}` }} title={o.name} />
                    ))}
                  </div>
                </div>
                <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar pr-4">
                  {AVATAR_OPTIONS.facialHair.map(o => (
                    <button key={o.id} onClick={() => setAvatarProps({...avatarProps, facialHair: o.id})} className={cn("shrink-0 w-16 h-16 border-2 rounded-2xl transition-all overflow-hidden relative flex items-center justify-center", avatarProps.facialHair === o.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700")}>
                      {o.id ? <img className="w-full h-full object-cover scale-[2] -translate-y-2" src={buildPreviewUrl('default', 'svg', {...avatarProps, top: 'shortFlat', facialHair: o.id, accessories: ''}, true)} alt={o.name} title={o.name} /> : <div className="font-bold text-[10px] text-slate-400">Ninguna</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lentes Visual */}
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block m-0">Gafas / Lentes</label>
                  <div className="flex gap-1">
                    {AVATAR_OPTIONS.accessoriesColor.map(o => (
                      <button key={o.id} onClick={() => setAvatarProps({...avatarProps, accessoriesColor: o.id})} className={cn("w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700 transition-transform", avatarProps.accessoriesColor === o.id && "scale-125 ring-1 ring-indigo-500")} style={{ backgroundColor: `#${o.id}` }} title={o.name} />
                    ))}
                  </div>
                </div>
                <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar pr-4">
                  {AVATAR_OPTIONS.accessories.map(o => (
                    <button key={o.id} onClick={() => setAvatarProps({...avatarProps, accessories: o.id})} className={cn("shrink-0 w-16 h-16 border-2 rounded-2xl transition-all overflow-hidden relative flex items-center justify-center", avatarProps.accessories === o.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700")}>
                      {o.id ? <img className="w-full h-full object-cover scale-[2] -translate-y-1" src={buildPreviewUrl('default', 'svg', {...avatarProps, accessories: o.id, top: 'shortFlat', facialHair: ''}, true)} alt={o.name} title={o.name} /> : <div className="font-bold text-[10px] text-slate-400">Ninguno</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ropa Visual */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Ropa / Atuendo</label>
                <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar pr-4">
                  {AVATAR_OPTIONS.clothing.map(o => (
                    <button key={o.id} onClick={() => setAvatarProps({...avatarProps, clothing: o.id})} className={cn("shrink-0 w-16 h-16 border-2 rounded-2xl transition-all overflow-hidden relative", avatarProps.clothing === o.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" : "border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700")}>
                      <img className="w-full h-full object-cover scale-[2] -translate-y-7" src={buildPreviewUrl('default', 'svg', {...avatarProps, clothing: o.id, top: 'shortFlat', accessories: '', facialHair: ''}, true)} alt={o.name} title={o.name} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Modificar Semilla Base (Rasgos)</label>
                <input 
                  type="text" 
                  value={creatorSeed} 
                  onChange={e => setCreatorSeed(e.target.value)} 
                  placeholder="Escribe tu nombre para cambiar rostro..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                <button 
                  onClick={handleStampAvatar} 
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Usar este Avatar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </Modal>
  );
}
