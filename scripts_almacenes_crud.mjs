import fs from 'fs';

let content = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// Add states for Almacenes
const stateRegex = /const \[proveedores, setProveedores\] = useState<any\[\]>\(\[\]\);/;
if (content.match(stateRegex)) {
  content = content.replace(stateRegex, \`const [proveedores, setProveedores] = useState<any[]>([]);
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [almName, setAlmName] = useState('');
  const [almUbicacion, setAlmUbicacion] = useState('');
  const [editAlmId, setEditAlmId] = useState<number | null>(null);\`);
}

// Add fetch function inside existing `fetchMaestros` or `useEffect`
const fetchRegex = /if \(activeTab === 'proveedores'\) \{.*?fetchProveedores\(\);.*?}/s;
const newFetch = \`if (activeTab === 'proveedores') {
      fetchProveedores();
    }
    if (activeTab === 'almacenes') {
      fetchAlmacenes();
    }\`;
if (content.match(/if \(activeTab === 'proveedores'\) \{(?:.|\\n)*?\}/)) {
    content = content.replace(/if \(activeTab === 'proveedores'\) \{(?:.|\\n)*?\}/, newFetch);
}

// Also wait, I don't know exactly what the fetchProveedores call looks like.
// Let's just create a completely independent useEffect that reacts to \`activeTab === 'almacenes'\`
const useEfectRegex = /(useEffect\(\(\) => \{.+?fetchProveedores\(\);\s*\}\s*\}, \[activeTab\]\);)/s;


// I will append functions right before \`return (\`:
const logicHooks = \`
  // --- LÓGICA ALMACENES ---
  const fetchAlmacenes = async () => {
     try {
         // Create table just in case it doesn't exist
         await executeAWSQuery(\\\`IF OBJECT_ID('Stock_Depositos', 'U') IS NULL BEGIN CREATE TABLE Stock_Depositos (id INT IDENTITY(1,1) PRIMARY KEY, nombre VARCHAR(100) NOT NULL, ubicacion VARCHAR(255)); END\\\`);
         const deps = await executeAWSQuery("SELECT * FROM Stock_Depositos ORDER BY id ASC");
         if (deps) setAlmacenes(deps);
     } catch (e) {
         console.error("Error cargando almacenes:", e);
     }
  };

  useEffect(() => {
     if (activeTab === 'almacenes') {
         fetchAlmacenes();
     }
  }, [activeTab]);

  const saveAlmacen = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!almName.trim()) return;
     try {
         if (editAlmId) {
            await executeAWSQuery(\\\`UPDATE Stock_Depositos SET nombre = '\${almName}', ubicacion = '\${almUbicacion}' WHERE id = \${editAlmId}\\\`);
            toast.success("Almacén modificado correctamente");
         } else {
             // Handle case where ubicacion might not exist yet by trying to add it
            try { await executeAWSQuery("ALTER TABLE Stock_Depositos ADD ubicacion VARCHAR(255)"); } catch(e){}
            
            await executeAWSQuery(\\\`INSERT INTO Stock_Depositos (nombre, ubicacion) VALUES ('\${almName}', '\${almUbicacion}')\\\`);
            toast.success("Almacén creado correctamente");
         }
         
         setAlmName('');
         setAlmUbicacion('');
         setEditAlmId(null);
         fetchAlmacenes();
     } catch (e) {
         console.error(e);
         toast.error("Error de base de datos saving almacen");
     }
  };

  const startEditAlmacen = (a: any) => {
      setAlmName(a.nombre || '');
      setAlmUbicacion(a.ubicacion || '');
      setEditAlmId(a.id);
  };
  
  const cancelEditAlm = () => {
      setAlmName('');
      setAlmUbicacion('');
      setEditAlmId(null);
  }

  const deleteAlmacen = async (id: number) => {
      if(!window.confirm("¿Seguro que deseas eliminar este almacén?")) return;
      try {
          await executeAWSQuery(\\\`DELETE FROM Stock_Depositos WHERE id = \${id}\\\`);
          toast.success("Eliminado");
          fetchAlmacenes();
      } catch (e) {
          toast.error("No se puede eliminar (en uso)");
      }
  };
\`;

content = content.replace('  return (', logicHooks + '\\n  return (');

// Now replace the stubborn UI layout with the interactive one using the state logic:
const oldUIRegex = /\{activeTab === 'almacenes' && \([\s\S]*?\}\)/;

const newUIElem = \`{activeTab === 'almacenes' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-5xl mx-auto mt-10">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3"><ArchiveRestore className="w-6 h-6 text-rose-500"/> Almacenes y Sectores</h3>
            <p className="text-slate-500 font-medium mb-10">Creación lógica de locaciones de stock.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 sticky top-10">
                  <div className="flex items-center justify-between mb-4">
                      <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">{editAlmId ? 'Editar Almacén' : 'Añadir Nuevo'}</h4>
                      {editAlmId && <button onClick={cancelEditAlm} className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-100/50 px-2 py-1 rounded">Cancelar Edición</button>}
                  </div>
                  
                  <form className="space-y-4" onSubmit={saveAlmacen}>
                     <input required value={almName} onChange={e=>setAlmName(e.target.value)} placeholder="Nombre del Almacén (Ej: Depósito Central)" className="input-nexus w-full bg-white dark:bg-slate-900" />
                     <input value={almUbicacion} onChange={e=>setAlmUbicacion(e.target.value)} placeholder="Ubicación Física (Ej: Pasillo A)" className="input-nexus w-full bg-white dark:bg-slate-900" />
                     <button className={\`\${editAlmId ? 'bg-indigo-600 hover:bg-indigo-700' : 'btn-primary'} w-full py-3.5 mt-2 font-black text-white rounded-xl\`} type="submit">{editAlmId ? 'Actualizar Almacén' : 'Guardar Almacén'}</button>
                  </form>
               </div>
               
               <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl bg-white dark:bg-slate-900 h-full max-h-[600px] overflow-y-auto custom-scrollbar">
                   <h4 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-4">Directorio Actual</h4>
                   
                   {almacenes.length === 0 ? (
                       <div className="text-center py-10 text-slate-400 font-bold">Base de Datos de Almacenes Vacía</div>
                   ) : (
                       <div className="flex flex-col gap-3">
                           {almacenes.map(a => (
                               <div key={a.id} className={\`p-4 rounded-xl border flex items-center justify-between group transition-colors \${editAlmId === a.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 bg-slate-50 dark:bg-slate-950'}\`}>
                                   <div>
                                       <p className="font-black text-slate-900 dark:text-white">{a.nombre}</p>
                                       {a.ubicacion && <p className="text-xs font-bold text-slate-500 mt-0.5"><span className="text-blue-500">📍</span> {a.ubicacion}</p>}
                                   </div>
                                   
                                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={()=>startEditAlmacen(a)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" title="Editar">
                                           <Edit3 className="w-4 h-4"/>
                                       </button>
                                       <button onClick={()=>deleteAlmacen(a.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Eliminar">
                                           <Trash2 className="w-4 h-4"/>
                                       </button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
            </div>
        </motion.div>
      )}\`;

content = content.replace(oldUIRegex, newUIElem);

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', content);
