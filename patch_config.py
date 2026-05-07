import os

file_path = "src/pages/ConfiguracionMaestros.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacement 1
old1 = """  const [varProdIds, setVarProdIds] = useState<string[]>([]);
  const [varNombre, setVarNombre] = useState('');
  const [varSku, setVarSku] = useState('');
  const [variantes, setVariantes] = useState<any[]>([]);"""

new1 = """  const [varProdIds, setVarProdIds] = useState<string[]>([]);
  const [varNombre, setVarNombre] = useState('');
  const [varSku, setVarSku] = useState('');
  const [variantes, setVariantes] = useState<any[]>([]);

  // Transferencia de Variantes
  const [varToDelete, setVarToDelete] = useState<any>(null);
  const [transferTargetVarId, setTransferTargetVarId] = useState('');
  const [isTransfering, setIsTransfering] = useState(false);"""

content = content.replace(old1, new1)

# Replacement 2
old2 = """  const deleteVariante = async (id: any) => {
      // Remover window.confirm porque el navegador puede estar bloqueándolo
      try {
          toast.loading('Eliminando variante...', { id: 'del-var' });
          await executeAWSQuery(`DELETE FROM Stock_Variantes WHERE id = '${id}'`);
          toast.success('Variante eliminada exitosamente.', { id: 'del-var' });
          fetchData();
      } catch (e: any) {
          toast.error('No se pudo eliminar. Puede tener stock o movimientos.', { id: 'del-var' });
          console.error(e);
      }
  };"""

new2 = """  const deleteVariante = async (id: any) => {
      try {
          toast.loading('Eliminando variante...', { id: 'del-var' });
          await executeAWSQuery(`DELETE FROM Stock_Variantes WHERE id = '${id}'`);
          toast.success('Variante eliminada exitosamente.', { id: 'del-var' });
          fetchData();
      } catch (e: any) {
          toast.dismiss('del-var');
          toast.error('La variante tiene registros o stock. Debe ser migrada.');
          const v = variantes.find(x => x.id === id);
          if (v) setVarToDelete(v);
      }
  };

  const executeTransfer = async () => {
      if(!transferTargetVarId) return toast.error("Selecciona un destino");
      setIsTransfering(true);
      try {
          const sql = `
BEGIN TRY
  BEGIN TRANSACTION;
  
  UPDATE i1
  SET cantidad = i1.cantidad + i2.cantidad
  FROM Stock_Inventario i1
  JOIN Stock_Inventario i2 ON i1.almacen_id = i2.almacen_id AND i2.variante_id = '${varToDelete.id}'
  WHERE i1.variante_id = '${transferTargetVarId}';
  
  UPDATE Stock_Inventario SET variante_id = '${transferTargetVarId}' WHERE variante_id = '${varToDelete.id}' AND almacen_id NOT IN (SELECT almacen_id FROM Stock_Inventario WHERE variante_id = '${transferTargetVarId}');
  DELETE FROM Stock_Inventario WHERE variante_id = '${varToDelete.id}';
  
  UPDATE Stock_Movimientos SET variante_id = '${transferTargetVarId}' WHERE variante_id = '${varToDelete.id}';
  
  IF OBJECT_ID('wms_remitos_internos_items', 'U') IS NOT NULL
    UPDATE wms_remitos_internos_items SET variante_id = '${transferTargetVarId}' WHERE variante_id = '${varToDelete.id}';
    
  IF OBJECT_ID('Stock_Compras_Detalles', 'U') IS NOT NULL
    UPDATE Stock_Compras_Detalles SET variante_id = '${transferTargetVarId}' WHERE variante_id = '${varToDelete.id}';

  IF OBJECT_ID('Stock_Alertas', 'U') IS NOT NULL
    UPDATE Stock_Alertas SET variante_id = '${transferTargetVarId}' WHERE variante_id = '${varToDelete.id}';
  
  DELETE FROM Stock_Variantes WHERE id = '${varToDelete.id}';

  COMMIT;
END TRY
BEGIN CATCH
  ROLLBACK;
  THROW;
END CATCH
          `;
          await executeAWSQuery(sql);
          toast.success("Historial migrado y variante eliminada.");
          setVarToDelete(null);
          setTransferTargetVarId('');
          fetchData();
      } catch (err: any) {
          toast.error("Error al traspasar datos: " + err.message);
      } finally {
          setIsTransfering(false);
      }
  };"""

content = content.replace(old2, new2)

# Replacement 3
old3 = """        {activeTab === 'costos_cero' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionCostosCero />
          </motion.div>
        )}

</div>
  );"""

new3 = """        {activeTab === 'costos_cero' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionCostosCero />
          </motion.div>
        )}

      {/* MODAL DE TRANSFERENCIA DE VARIANTE */}
      {varToDelete && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2"><ArchiveRestore className="w-6 h-6 text-indigo-500" /> Trasladar Registros y Eliminar</h3>
                <p className="text-sm font-bold text-slate-500 mb-6">La variante <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{varToDelete.nombre_variante}</span> no se puede eliminar porque tiene stock asociado o un historial de movimientos. Para borrarla, debes transferir todos sus registros a otra variante.</p>
                
                <div className="mb-6">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Variante Destino (Heredará todo):</label>
                    <select 
                       value={transferTargetVarId} 
                       onChange={e=>setTransferTargetVarId(e.target.value)}
                       className="w-full input-nexus bg-slate-50 dark:bg-slate-950 font-bold"
                    >
                       <option value="">-- Selecciona una variante destino --</option>
                       {variantes.filter(x => x.id !== varToDelete.id && x.producto_maestro_id === varToDelete.producto_maestro_id).map(v => (
                           <option key={v.id} value={v.id}>{v.nombre_variante} ({v.codigo_variante})</option>
                       ))}
                    </select>
                </div>
                
                <div className="flex gap-3 mt-8">
                   <button onClick={() => setVarToDelete(null)} className="btn-secondary flex-1 py-3 font-black text-sm">Cancelar</button>
                   <button onClick={executeTransfer} disabled={!transferTargetVarId || isTransfering} className="btn-primary flex-1 py-3 font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-all">
                       {isTransfering ? 'Migrando...' : 'Migrar y Eliminar'}
                   </button>
                </div>
             </div>
         </div>
      )}

</div>
  );"""

content = content.replace(old3, new3)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done patching.")
