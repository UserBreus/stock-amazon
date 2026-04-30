const fs = require('fs');
let c = fs.readFileSync('src/components/gestion/GestionHistoricos.tsx', 'utf8');

c = c.replace("import { ModalSelector } from '../ui/ModalSelector';", "import { CategoryDrillDownModal } from '../ui/CategoryDrillDownModal';");

c = c.replace(/const \[variantes, setVariantes\] = useState<any\[\]>\(\[\]\);/, "const [catalogCategorias, setCatalogCategorias] = useState<any[]>([]);\n    const [catalogProductos, setCatalogProductos] = useState<any[]>([]);");

const newQuery = `            // Fetch categorias and productos
            const catRes = await executeAWSQuery("SELECT id, nombre FROM Stock_Categorias ORDER BY nombre");
            const prodRes = await executeAWSQuery(\`
                SELECT v.id, 
                       v.nombre_variante,
                       v.nombre_variante as nombre,
                       v.codigo_variante,
                       pm.id as producto_maestro_id, pm.nombre as producto_nombre, pm.categoria_id,
                       pm.tipo_gestion,
                       0 as stock_total
                FROM Stock_Variantes v
                INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
            \`);
            if (catRes) setCatalogCategorias(catRes);
            if (prodRes) setCatalogProductos(prodRes);`;

c = c.replace(/\/\/ Fetch variantes[\s\S]*?if \(varRes\) setVariantes\(varRes\);/, newQuery);

const oldModal = `<ModalSelector
                title="Selecciona el Artículo"
                isOpen={isVarianteModalOpen}
                onClose={() => setIsVarianteModalOpen(false)}
                options={variantes.map(v => ({ id: v.id, title: v.producto_nombre, subtitle: \`\${v.nombre_variante} | \${v.codigo_variante}\` }))}
                onSelect={(id) => {
                    setVarianteSelected(variantes.find(v => v.id === id));
                    setIsVarianteModalOpen(false);
                }}
                searchPlaceholder="Buscar por nombre o código..."
            />`;

const newModal = `<CategoryDrillDownModal 
                isOpen={isVarianteModalOpen} 
                onClose={() => setIsVarianteModalOpen(false)} 
                title="Selección Manual: Artículo" 
                categorias={catalogCategorias} 
                productos={catalogProductos} 
                onSelect={(id) => {
                    setVarianteSelected(catalogProductos.find(v => v.id.toString() === id.toString()));
                    setIsVarianteModalOpen(false);
                }} 
                closeOnSelect={true}
            />`;

c = c.replace(oldModal, newModal);

fs.writeFileSync('src/components/gestion/GestionHistoricos.tsx', c);
