const fs = require('fs');
let c = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

if (!c.includes('ShoppingCart')) {
    c = c.replace("import { Box, Send", "import { Box, Send, Trash2, PlusCircle, ShoppingCart");
    c = c.replace("import { Modal } from '../components/ui/Modal';", "import { Modal } from '../components/ui/Modal';\nimport { CategoryDrillDownModal } from '../components/ui/CategoryDrillDownModal';");
}

let activeTabReplace = `  const [activeTab, setActiveTab] = useState<'stock' | 'recepcion' | 'historial' | 'solicitar'>('stock');`;
if (!c.includes(`'solicitar'`)) {
    c = c.replace(/const \[activeTab, setActiveTab\] = useState<\'stock\' \| \'recepcion\'>\(\'stock\'\);/, activeTabReplace);
}

if (!c.includes('solicitudCart')) {
    c = c.replace("const [bajaCantidad, setBajaCantidad] = useState(1);", 
`const [bajaCantidad, setBajaCantidad] = useState(1);

  // States for Solicitudes
  const [solicitudCart, setSolicitudCart] = useState<any[]>([]);
  const [catalogCategorias, setCatalogCategorias] = useState<any[]>([]);
  const [catalogProductos, setCatalogProductos] = useState<any[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);`);
}

if (!c.includes('openCatalog')) {
    c = c.replace(`const currentSectorObj = depositos.find(d => d.id.toString() === sectorSeleccionado);`,
`const currentSectorObj = depositos.find(d => d.id.toString() === sectorSeleccionado);

  const openCatalog = async () => {
      try {
          const res = await executeAWSQuery(\`
              SELECT c.id as cat_id, c.nombre as cat_name, 
                     f.id as fam_id, f.nombre as fam_name, 
                     p.id as prod_id, p.nombre as prod_name, p.codigo_sku as prod_sku, p.requiere_lote,
                     v.id as var_id, v.nombre_variante as var_name, v.codigo_barras as var_sku
              FROM Stock_Variantes v
              INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              INNER JOIN Stock_Familias f ON p.familia_id = f.id
              INNER JOIN Stock_Categorias c ON f.categoria_id = c.id
          \`);
          if (res) {
              const cats = Array.from(new Set(res.map((r:any) => JSON.stringify({ id: r.cat_id, nombre: r.cat_name })))).map((s:any) => JSON.parse(s));
              setCatalogCategorias(cats);
              setCatalogProductos(res);
              setIsCatalogOpen(true);
          }
      } catch (e: any) {
          toast.error("Error cargando catálogo global: " + e.message);
      }
  };

  const handleCatalogSelection = (item: any) => {
      if (!solicitudCart.find(c => c.var_id === item.var_id)) {
          setSolicitudCart([...solicitudCart, { ...item, cantidad: 1 }]);
          toast.success("Agregado a la solicitud");
      } else {
          toast.error("Variante ya agregada en la solicitud actual");
      }
      setIsCatalogOpen(false); // Can stay open if preferred, but simpler to close
  };

  const enviarSolicitud = async () => {
      if (solicitudCart.length === 0) return toast.error("El carrito está vacío");
      if (!sectorSeleccionado) return toast.error("Sin sector origen");

      setIsRequesting(true);
      try {
          const reqCode = 'REQ-' + Date.now().toString().slice(-6);
          let queries = [\`
             INSERT INTO wms_solicitudes (numeracion, deposito_solicitante_id, creado_por, estado)
             VALUES ('\${reqCode}', \${sectorSeleccionado}, '\${user?.id || 'Op'}', 'PENDIENTE');
             DECLARE @ReqId INT = SCOPE_IDENTITY();
          \`];

          for (const item of solicitudCart) {
              queries.push(\`
                 INSERT INTO wms_solicitudes_items (solicitud_id, variante_id, cantidad_solicitada)
                 VALUES (@ReqId, \${item.var_id}, \${item.cantidad});
              \`);
          }

          await executeAWSQuery(\`BEGIN TRY BEGIN TRANSACTION; \${queries.join('\\n')} COMMIT TRANSACTION; END TRY BEGIN CATCH ROLLBACK TRANSACTION; THROW; END CATCH\`);
          toast.success("¡Solicitud enviada a la Central Logística!");
          setSolicitudCart([]);
          setActiveTab('recepcion' as any);
      } catch (err:any) {
          toast.error("Fallo al enviar solicitud: " + err.message);
      } finally {
          setIsRequesting(false);
      }
  };
`);
}

fs.writeFileSync('src/pages/InventarioOperativo.tsx', c);
console.log('Script patched base structure safely.');
