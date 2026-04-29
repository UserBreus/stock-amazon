const q = "SELECT e.id, e.variante_id, e.cantidad_inicial, e.estado, p.nombre as producto, p.tipo_gestion FROM Stock_Etiquetas e INNER JOIN Stock_Variantes v ON e.variante_id = v.id INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id WHERE e.compra_id IN (SELECT id FROM Stock_Compras WHERE referencia_factura = 'gffjhgf34546654') ORDER BY e.variante_id, e.id";

fetch('http://localhost:3001/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q })
})
.then(r => r.json())
.then(d => {
    console.log('Total filas:', d.data?.length ?? 0);
    if (d.data) {
        const grupos = {};
        for (const e of d.data) {
            const k = e.producto + ' [' + e.tipo_gestion + ']';
            if (!grupos[k]) grupos[k] = [];
            grupos[k].push({ id: e.id, cant: e.cantidad_inicial });
        }
        for (const k of Object.keys(grupos)) {
            const v = grupos[k];
            console.log('  ' + k + ': ' + v.length + ' etiquetas -> IDs: ' + v.map(x => x.id).join(', '));
        }
    } else {
        console.log('Sin datos:', d);
    }
})
.catch(e => console.error(e));
