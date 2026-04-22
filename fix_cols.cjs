const fs = require('fs');
const file = 'src/components/DespachoEgresos.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/INSERT INTO wms_remitos_internos \(codigo_remito, destino_id, usuario_id\)/g, 
              'INSERT INTO wms_remitos_internos (numeracion, deposito_origen_id, deposito_destino_id, creado_por, estado)');

// Just replacing the values string block completely
let oldValues = "VALUES ('${remitoCode}', ${destClean}, '${(user as any)?.id || ''}');";
let newValues = "VALUES ('${remitoCode}', ${origenFijoSQL}, ${destClean}, '${(user as any)?.id || ''}', 'EN_TRANSITO');";
c = c.replace(oldValues, newValues);

c = c.replace(/SELECT codigo_remito as rem_code FROM wms_remitos_internos WHERE id = @RemId;/g,
              'SELECT numeracion as rem_code FROM wms_remitos_internos WHERE id = @RemId;');

fs.writeFileSync(file, c);
console.log('Fixed names');
