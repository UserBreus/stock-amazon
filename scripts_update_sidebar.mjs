import fs from 'fs';

let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

c = c.replace(
  "import { useAuth } from '../../context/AuthContext';",
  "import { useAuth } from '../../context/AuthContext';\nimport { DynamicIcon } from '../../context/IconContext';"
);

c = c.replace(
  "{ name: 'Gestión de Catálogo', path: '/configuracion-maestros', icon: Settings, roles: ['gerente_stock', 'admin', 'administrativo_stock'] }",
  "{ id: 'sidebar_sistema', name: 'Gestión de Sistema', path: '/configuracion-maestros', icon: Settings, roles: ['gerente_stock', 'admin', 'administrativo_stock'] }"
);

c = c.replace(
    "{ name: 'Panel de Control', path: '/', icon: LayoutDashboard, roles: ['gerente_stock', 'admin', 'operario', 'operario_stock', 'administrativo_stock'] },\n    { name: 'Inventario Global', path: '/inventario-gerencial', icon: BarChart3, roles: ['gerente_stock', 'admin', 'operario_stock', 'administrativo_stock'] },\n    { name: 'Sectores y Traslados', path: '/inventario-operativo', icon: Package, roles: ['gerente_stock', 'admin', 'operario', 'operario_stock'] },\n    { name: 'Registro de Compras', path: '/ingresos', icon: Truck, roles: ['gerente_stock', 'admin', 'administrativo_stock'] },",
    "{ id: 'sidebar_dashboard', name: 'Panel de Control', path: '/', icon: LayoutDashboard, roles: ['gerente_stock', 'admin', 'operario', 'operario_stock', 'administrativo_stock'] },\n    { id: 'sidebar_inventario', name: 'Inventario Global', path: '/inventario-gerencial', icon: BarChart3, roles: ['gerente_stock', 'admin', 'operario_stock', 'administrativo_stock'] },\n    { id: 'sidebar_sectores', name: 'Sectores y Traslados', path: '/inventario-operativo', icon: Package, roles: ['gerente_stock', 'admin', 'operario', 'operario_stock'] },\n    { id: 'sidebar_compras', name: 'Registro de Compras', path: '/ingresos', icon: Truck, roles: ['gerente_stock', 'admin', 'administrativo_stock'] },"
);

c = c.replace(
  `              <item.icon className={cn(`,
  `              <DynamicIcon id={item.id} fallback={item.icon} className={cn(`
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', c);
console.log("Sidebar dynamic icons injected!");
