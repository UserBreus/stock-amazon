const fs = require('fs');
let s = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// Replace the activeTab useState definition to allow 'monedas'
// The error was: error TS2367: This comparison appears to be unintentional because the types '"categorias" | "hub" | "titulos_base" | "diccionario" | "modelos" | "proveedores" | "rendimientos" | "iconos" | "almacenes"' and '"monedas"' have no overlap.
// Usually this means it is defined as: const [activeTab, setActiveTab] = useState<'hub' | 'categorias' ...>

const regex = /useState<'hub'\s*\|\s*'categorias'\s*\|\s*'titulos_base'\s*\|\s*'diccionario'\s*\|\s*'modelos'\s*\|\s*'proveedores'\s*\|\s*'rendimientos'\s*\|\s*'iconos'\s*\|\s*'almacenes'>/g;
s = s.replace(regex, "useState<'hub'|'categorias'|'titulos_base'|'diccionario'|'modelos'|'proveedores'|'rendimientos'|'iconos'|'almacenes'|'monedas'>");

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', s);
console.log('Fixed tabs type');
