const fs = require('fs');

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const replacement = `  const updateVarianteInline = async (id: number, nuevoNombre: string, nuevoSku: string) => {
      try {
          await executeAWSQuery(\`UPDATE Stock_Variantes SET nombre_variante='\${nuevoNombre.replace(/'/g, "''")}', codigo_variante='\${nuevoSku.replace(/'/g, "''")}' WHERE id = \${id}\`);
          toast.success('Variante actualizada.');
          fetchData();
      } catch (e: any) {
          toast.error('Error al actualizar variante.');
          console.error(e);
      }
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
  };`;

const searchRegex = /  const updateVarianteInline = async.*?toast\.error\('Error al actualizar variante\.'\);\s*console\.error\(e\);\s*}\s*};/ms;

if (searchRegex.test(c)) {
    c = c.replace(searchRegex, replacement);
    fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
    console.log("Restored fetchData completely.");
} else {
    console.log("Regex not matched.");
}
