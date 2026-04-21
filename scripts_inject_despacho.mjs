import fs from 'fs';

let content = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. imports
if (!content.includes('DespachoEgresos')) {
    content = content.replace(
        "import { CategoryDrillDownModal } from '../components/ui/CategoryDrillDownModal';",
        "import { CategoryDrillDownModal } from '../components/ui/CategoryDrillDownModal';\nimport { DespachoEgresos } from '../components/DespachoEgresos';"
    );
}

// 2. tabs
// Look for { id: 'catalogo', label: 'Catálogo de Artículos', icon: Search }
const searchStr = "{ id: 'recepcion', label: 'Recepción y Auditoría', icon: PackagePlus }";
if (content.includes(searchStr) && !content.includes("{ id: 'despacho', label: 'Egresos y Traslados'")) {
    content = content.replace(
        searchStr,
        searchStr + ",\n          { id: 'despacho', label: 'Egresos y Traslados', icon: Truck }"
    );
}

// Ensure Truck is imported if needed, actually we can just use `Box` or `Package` which is already imported to be safe. Let's use `Network` because I imported `Network` recently.
content = content.replace("{ id: 'despacho', label: 'Egresos y Traslados', icon: Truck }", "{ id: 'despacho', label: 'Egresos y Traslados', icon: Network }");

// 3. Tab Body
const recepcionBlockEnd = "</div>\n          )}"; // A bit dangerous to parse, let's find the exact string
const marker = "{/* PANEL INGRESOS RECIENTES */}";
const newBlock = `          {activeTab === 'despacho' && (
            <div className="mt-8">
               <DespachoEgresos />
            </div>
          )}
          
`;
if (content.includes(marker) && !content.includes('activeTab === \'despacho\'')) {
    content = content.replace(marker, newBlock + marker);
}

fs.writeFileSync('src/pages/InventarioGerencial.tsx', content);
console.log("InventarioGerencial patched with Despacho component");
