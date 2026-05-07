const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/pages/ConfiguracionMaestros.tsx');
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
    "<'hub'|'categorias'|'titulos_base'|'diccionario'|'modelos'|'proveedores'|'rendimientos'|'iconos'|'almacenes'|'monedas'|'usuarios'|'historicos'>",
    "<'hub'|'categorias'|'titulos_base'|'diccionario'|'modelos'|'proveedores'|'rendimientos'|'iconos'|'almacenes'|'monedas'|'usuarios'|'historicos'|'tipos_facturas'|'alertas_stock'|'costos_cero'>"
);
fs.writeFileSync(p, c, 'utf8');
console.log('Fixed types');
