const fs = require('fs');

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const missingBlock = `      }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [cats, provs, prods, vars] = await Promise.all([
        executeAWSQuery("SELECT * FROM Stock_Categorias ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_Proveedores ORDER BY nombre"),
        executeAWSQuery("SELECT p.*, c.nombre as cat_nombre FROM Stock_Productos_Maestros p LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id ORDER BY p.nombre"),
        executeAWSQuery("SELECT v.*, p.nombre as prod_nombre FROM Stock_Variantes v INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id ORDER BY p.nombre, v.nombre_variante")
      ]);
      if(cats) setCategorias(cats);
      if(provs) setProveedores(provs);
      if(prods) setProductos(prods);
      if(vars) setVariantes(vars);
    } catch(e) { console.error(e); }
  };

  const createCategoria = async (e: React.FormEvent) => {`;

const targetStr = `      }
  };

  const createCategoria = async (e: React.FormEvent) => {`;

if (c.indexOf(targetStr) !== -1) {
    c = c.replace(targetStr, missingBlock);
    fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
    console.log("Injected fetchData!");
} else {
    // try ignoring carriage returns
    if (c.replace(/\\r/g, '').indexOf(targetStr.replace(/\\r/g, '')) !== -1) {
         c = c.replace(/\\r/g, '').replace(targetStr.replace(/\\r/g, ''), missingBlock.replace(/\\r/g, ''));
         fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
         console.log("Injected fetchData! (ignored CR)");
    } else {
         console.log("Failed to find injection target.");
    }
}
