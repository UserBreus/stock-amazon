import fs from 'fs';

let content = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Add state for compras and handle selection
const stateHooks = `  const [isLabelCompraModalOpen, setIsLabelCompraModalOpen] = useState(false);
  const [comprasPendientes, setComprasPendientes] = useState<any[]>([]);
  const [selectedCompraId, setSelectedCompraId] = useState<string>('');`;

content = content.replace("  const [isLabelCompraModalOpen, setIsLabelCompraModalOpen] = useState(false);", stateHooks);

// 2. Fetch compras pendientes in fetchData
const oldFetchData = `      const deps = await executeAWSQuery("SELECT * FROM Stock_Depositos WHERE nombre LIKE '%central%' OR tipo='central' ORDER BY id ASC");
      setDepositos(deps || []);
      
      setLoading(false);`;

const newFetchData = `      const deps = await executeAWSQuery("SELECT * FROM Stock_Depositos WHERE nombre LIKE '%central%' OR tipo='central' ORDER BY id ASC");
      setDepositos(deps || []);

      const comps = await executeAWSQuery("SELECT c.*, p.nombre as proveedor_nombre FROM Stock_Compras c LEFT JOIN Stock_Proveedores p ON c.proveedor_id = p.id WHERE c.estado = 'pendiente' ORDER BY c.fecha_creacion DESC");
      setComprasPendientes(comps || []);
      
      setLoading(false);`;

content = content.replace(oldFetchData, newFetchData);

// 3. Add handleGenerateCompraLabels function
const compileLabelsFn = `  const handleGenerateCompraLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedCompraId) return toast.error('Selecciona una orden de compra');
    try {
       toast.loading('Generando etiquetas pre-impresas para WMS...', { id: 'l_c' });
       // Get compra details
       const details = await executeAWSQuery(\`SELECT d.*, v.codigo_variante as sku, pm.nombre + ' ' + v.nombre_variante as full_nombre FROM Stock_Compras_Detalle d INNER JOIN Stock_Variantes v ON d.variante_id = v.id INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id WHERE d.compra_id = '\${selectedCompraId}'\`);
       if(!details || details.length === 0) throw new Error("La orden está vacía o es inválida.");

       let insertEtiquetas = '';
       let etiquetasToPrint = [];

       for (const item of details) {
           const qty = item.cantidad; // Assuming 1 box per unit for now since standard
           const prefix = item.sku || 'PROD';
           for(let i=0; i<qty; i++) {
               const codigo_barras = \`\${prefix}-OC\${selectedCompraId.slice(-4)}-\${Date.now().toString().slice(-6)}-\${i+1}\`;
               insertEtiquetas += \`
                 INSERT INTO Stock_Etiquetas (variante_id, deposito_id, compra_id, codigo_barras, cantidad_inicial, cantidad_actual, estado)
                 VALUES ('\${item.variante_id}', \${depositos[0]?.id || 1}, '\${selectedCompraId}', '\${codigo_barras}', 1, 1, 'impreso_pendiente');
               \`;
               etiquetasToPrint.push({
                   producto_nombre: item.full_nombre,
                   codigo_barras,
                   fecha_creacion: new Date().toISOString()
               });
           }
       }

       await executeAWSQuery(insertEtiquetas);
       setIsLabelCompraModalOpen(false);
       toast.success('Etiquetas generadas en BD (Pendientes de Recepción Físicament en Depósito)', { id: 'l_c' });
       
       setPrintProduct({ producto_nombre: 'Lote de Orden ' + selectedCompraId.split('-')[0] });
       setPrintEtiquetas(etiquetasToPrint);

       fetchData();
    } catch(e: any) {
       toast.error("Error: " + e.message, { id: 'l_c' });
    }
  };

  const openEgresoModal`;

content = content.replace("  const openEgresoModal", compileLabelsFn);


// 4. Inyect modalities
const renderModal = `
      <Modal isOpen={isLabelCompraModalOpen} onClose={() => setIsLabelCompraModalOpen(false)} title="Generar Etiquetas de Orden de Compra">
         <form className="space-y-6" onSubmit={handleGenerateCompraLabels}>
             <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Órdenes Pendientes</label>
                 <select 
                    className="input-nexus" 
                    required
                    value={selectedCompraId} 
                    onChange={e => setSelectedCompraId(e.target.value)}
                 >
                    <option value="">Selecciona Orden de Compra...</option>
                    {comprasPendientes.map(c => (
                       <option key={c.id} value={c.id}>OC-{c.id.split('-')[0].toUpperCase()} ({c.proveedor_nombre}) - {c.cantidad_articulos} arts</option>
                    ))}
                 </select>
                 <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-3 text-center">Las etiquetas se generarán unitariamente y quedarán listas para el escáner del WMS.</p>
             </div>
             <button type="submit" className="w-full btn-primary py-4 mt-6">Pre-Generar e Imprimir Orden</button>
         </form>
      </Modal>

      <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Generar e Ingresar Etiquetas Manuales">
`;

content = content.replace(`<Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Generar e Ingresar Etiquetas">`, renderModal);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', content);
console.log("InventarioGerencial.tsx successfully modified for Order Labels.");
