const fs = require('fs');

try {
    let despCode = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

    const tDesp1 = 'UPDATE Stock_Etiquetas SET deposito_id = ${destinoId} WHERE id = ${loteId};';
    const rDesp1 = "UPDATE Stock_Etiquetas SET deposito_id = ${destinoId}, estado = 'trasladando' WHERE id = ${loteId};";
    despCode = despCode.replace(tDesp1, rDesp1);

    const tDesp2 = "VALUES ('${newCode}', ${info.variante_id}, ${destinoId}, ${allocQty}, ${allocQty}, 'activo');";
    const rDesp2 = "VALUES ('${newCode}', ${info.variante_id}, ${destinoId}, ${allocQty}, ${allocQty}, 'trasladando');";
    despCode = despCode.replace(tDesp2, rDesp2);

    fs.writeFileSync('src/components/DespachoEgresos.tsx', despCode);
    console.log('Patched DespachoEgresos');
} catch (e) { console.error(e) }
