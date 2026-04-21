import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace("import { DespachoEgresos } from './pages/DespachoEgresos';\n", "");
const rx = /<Route path="\/egresos"[\s\S]*?<\/Route>/;
app = app.replace(rx, "");
fs.writeFileSync('src/App.tsx', app);

let side = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
side = side.replace("    { name: 'Motor de Despacho', path: '/egresos', icon: Truck, roles: ['gerente_stock', 'admin', 'operario_stock', 'administrativo_stock'] },\n", "");
fs.writeFileSync('src/components/layout/Sidebar.tsx', side);

console.log("Cleaned routes");
