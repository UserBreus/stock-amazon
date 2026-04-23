import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { useSysIcons, DynamicIcon } from '../context/IconContext';
import { Search, UploadCloud, Save, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function IconManager() {
    const { icons, refreshIcons } = useSysIcons();
    const lucideKeys = Object.keys(LucideIcons).filter(k => k !== 'createLucideIcon' && k !== 'default');
    
    // Configurable Targets (Sidebar buttons are listed)
    const targets = [
        { id: 'sidebar_dashboard', label: 'Menú: Panel de Control' },
        { id: 'sidebar_inventario', label: 'Menú: Inventario Global' },
        { id: 'sidebar_sectores', label: 'Menú: Sectores y Traslados' },
        { id: 'sidebar_compras', label: 'Menú: Compras' },
        { id: 'sidebar_sistema', label: 'Menú: Gestión de Sistema' },
        { id: 'btn_ingreso_stock', label: 'Dashboard: Ingresar Stock' },
        { id: 'btn_traslado_stock', label: 'Dashboard: Trasladar' },
        { id: 'btn_retiro_stock', label: 'Dashboard: Retirar Stock' },
        { id: 'btn_etiquetas_stock', label: 'Dashboard: Etiquetas' },
    ];

    const [activeTarget, setActiveTarget] = useState(targets[0].id);
    const [searchTerm, setSearchTerm] = useState('');
    const [svgData, setSvgData] = useState('');

    const handleSaveLucide = async (iconName: string) => {
        try {
            await executeAWSQuery(`
                DELETE FROM WMS_Sys_Icons WHERE target_id = '${activeTarget}';
                INSERT INTO WMS_Sys_Icons (target_id, icon_type, icon_value) VALUES ('${activeTarget}', 'lucide', '${iconName}');
            `);
            toast.success("Icono asignado!");
            await refreshIcons();
        } catch(e:any) { toast.error("Error: " + e.message); }
    };

    const handleSaveSVG = async () => {
        if (!svgData.includes('<svg')) return toast.error("Formato inválido. Debe contener el tag <svg>");
        try {
            const cleanSvg = svgData.replace(/'/g, '"').replace(/\n/g, ' '); // simple escape
            await executeAWSQuery(`
                DELETE FROM WMS_Sys_Icons WHERE target_id = '${activeTarget}';
                INSERT INTO WMS_Sys_Icons (target_id, icon_type, icon_value) VALUES ('${activeTarget}', 'svg', '${cleanSvg}');
            `);
            toast.success("SVG Persistido correctamente");
            setSvgData('');
            await refreshIcons();
        } catch(e:any) { toast.error("Error guardando SVG: " + e.message); }
    };

    const handleReset = async () => {
        try {
            await executeAWSQuery(`DELETE FROM WMS_Sys_Icons WHERE target_id = '${activeTarget}';`);
            toast.success("Icono reseteado a predeterminado");
            await refreshIcons();
        } catch(e:any) {}
    }

    const filteredLucide = lucideKeys.filter(k => k.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Motor de Personalización Visual</h2>
            <p className="text-sm font-medium text-slate-500">Sobreescribe los íconos de cualquier botón maestro del sistema interactuando directamente con el core visual.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6">
                   <h3 className="font-black mb-4 uppercase text-[10px] tracking-widest text-slate-500">1. Botón a Alterar</h3>
                   <div className="space-y-2">
                       {targets.map(t => (
                           <button 
                               key={t.id} onClick={() => setActiveTarget(t.id)}
                               className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between text-sm font-bold transition-colors \${activeTarget === t.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                           >
                               {t.label}
                               {icons[t.id] && <CheckCircle2 className="w-4 h-4 text-emerald-400"/>}
                           </button>
                       ))}
                   </div>
               </div>

               <div className="lg:col-span-2 space-y-6">
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                             <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500 mb-1">Estado Visual Actual</h3>
                             <p className="text-xs font-medium text-slate-400">Si lo reseteas volverá a la forma original por defecto.</p>
                          </div>
                          {icons[activeTarget] && <button onClick={handleReset} className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-3 h-3"/> Restaurar Defecto</button>}
                      </div>
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center">
                          <DynamicIcon id={activeTarget} fallback={Search} className="w-10 h-10 text-indigo-500" />
                      </div>
                   </div>

                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                      <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500 mb-4">Galeria Lucide (+1300 Nativos)</h3>
                      <div className="relative mb-4">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                             type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                             placeholder="Buscar icono por nombre (ej. box, package, list...)"
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl h-12 pl-10 px-4 text-sm font-bold outline-none focus:border-indigo-500"
                         />
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 h-64 overflow-y-auto custom-scrollbar p-2 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                          {filteredLucide.map(key => {
                              const Ico = (LucideIcons as any)[key];
                              if(!Ico) return null;
                              return (
                                 <button 
                                     key={key} 
                                     onClick={() => handleSaveLucide(key)}
                                     title={key}
                                     className="aspect-square flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 hover:text-indigo-600 rounded-xl transition-colors border border-slate-100 shadow-sm"
                                 >
                                     <Ico className="w-5 h-5" />
                                 </button>
                              )
                          })}
                          {filteredLucide.length === 0 && <p className="col-span-full p-4 text-center text-xs font-bold text-slate-400">Sin resultados</p>}
                      </div>
                   </div>

                   <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-3xl p-6">
                      <h3 className="font-black uppercase text-[10px] tracking-widest text-indigo-500 mb-2 flex items-center gap-2"><UploadCloud className="w-4 h-4"/> Cargar Formato SVG Especial</h3>
                      <p className="text-xs font-medium text-indigo-900/60 dark:text-indigo-400/60 mb-4">Pega el código de tu archivo SVG. Recomendado: Lienzo 24x24 px, Stroke 2px, Color actualiza por clase CSS.</p>
                      
                      <textarea 
                          value={svgData} onChange={e=>setSvgData(e.target.value)}
                          placeholder="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>...</svg>"
                          className="w-full h-32 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-xs font-mono mb-4 outline-none focus:ring-2 ring-indigo-500/20"
                      />
                      <button onClick={handleSaveSVG} disabled={!svgData.trim()} className="w-full bg-indigo-600 disabled:opacity-50 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                          <Save className="w-5 h-5" /> Inyectar a la Base de Datos
                      </button>
                   </div>
               </div>
            </div>
        </div>
    )
}
