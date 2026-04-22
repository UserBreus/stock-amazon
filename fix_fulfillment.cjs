const fs = require('fs');
let c = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

const anchor = "if (isTransfer) { queries.push(`SELECT numeracion as rem_code FROM wms_remitos_internos WHERE id = @RemId;`); }";

const inject = `
          let reqIds = new Set();
          cart.forEach(c => { if(c.origin_req_id) reqIds.add(c.origin_req_id); });
          if(isTransfer && reqIds.size > 0) {
              reqIds.forEach(id => {
                  queries.push(\`UPDATE wms_solicitudes SET estado = 'ENVIADO' WHERE id = \${id};\`);
              });
          }

          if (isTransfer) { queries.push(\`SELECT numeracion as rem_code FROM wms_remitos_internos WHERE id = @RemId;\`); }`;

if (c.includes(anchor) && !c.includes("reqIds.add(c.origin_req_id)")) {
    c = c.replace(anchor, inject);
    fs.writeFileSync('src/components/DespachoEgresos.tsx', c);
    console.log('Fulfillment logic added');
} else {
    console.log('Anchor missing or already injected');
}
