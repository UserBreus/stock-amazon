const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Add state for selectedModalSol
const statesTarget = `  const [egresoEtiquetas, setEgresoEtiquetas] = useState<any[]>([]);`;
if (code.includes(statesTarget) && !code.includes('selectedModalSol')) {
  code = code.replace(
    statesTarget,
    statesTarget + `\n  const [selectedModalSol, setSelectedModalSol] = useState<any | null>(null);`
  );
  console.log('Added selectedModalSol state.');
}

// 2. Add openSolModal function
const expandSolTarget = `  const expandSolicitud = async (solId: number) => {`;
if (code.includes(expandSolTarget) && !code.includes('const openSolModal')) {
  code = code.replace(
    expandSolTarget,
    `  const openSolModal = async (sol: any) => {
    setSelectedModalSol(sol);
    if (solicitudItems[sol.id]) return; // ya cargados
    try {
      const res = await executeAWSQuery(\`
        SELECT si.*, v.nombre_variante, pm.nombre as producto_nombre
        FROM wms_solicitudes_items si
        LEFT JOIN Stock_Variantes v ON v.id = si.variante_id
        LEFT JOIN Stock_Productos_Maestros pm ON pm.id = v.producto_maestro_id
        WHERE si.solicitud_id = \${sol.id}
      \`);
      setSolicitudItems(prev => ({ ...prev, [sol.id]: res || [] }));
    } catch (e: any) {
      toast.error('Error cargando ítems de solicitud');
    }
  };

  const expandSolicitud = async (solId: number) => {`
  );
  console.log('Added openSolModal function.');
}

// 3. Update handleEnviarSolicitud to close modal
const closeModTarget = `setExpandedSol(prev => { const n = {...prev}; delete n[sol.id]; return n; });`;
if (code.includes(closeModTarget)) {
  code = code.replace(
    closeModTarget,
    closeModTarget + `\n      setSelectedModalSol(null);`
  );
  console.log('Added setSelectedModalSol(null) to handleEnviarSolicitud.');
}

fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
