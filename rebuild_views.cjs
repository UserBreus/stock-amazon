const queries = [
    `BEGIN TRY DROP VIEW Vista_Stock_Actual; END TRY BEGIN CATCH END CATCH;`,
    `BEGIN TRY DROP VIEW Vista_Capital_Activo; END TRY BEGIN CATCH END CATCH;`,
    `
    CREATE VIEW Vista_Stock_Actual AS
    SELECT 
        v.id as variante_id,
        v.nombre_variante as nombre_completo,
        p.id as producto_maestro_id,
        p.nombre as producto_nombre,
        p.sku,
        p.costo_unitario_base as costo,
        'USD' as moneda,
        p.unidad_base as unidad,
        c.nombre as categoria_nombre,
        ISNULL(SUM(e.cantidad_actual), 0) as cantidad_total,
        COUNT(e.id) as lotes_activos
    FROM Stock_Variantes v
    INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
    LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
    LEFT JOIN Stock_Etiquetas e ON e.variante_id = v.id AND e.cantidad_actual > 0
    GROUP BY v.id, v.nombre_variante, p.id, p.nombre, p.sku, p.costo_unitario_base, p.unidad_base, c.nombre;
    `,
    `
    CREATE VIEW Vista_Capital_Activo AS
    SELECT 
        'USD' as moneda,
        SUM(vsa.cantidad_total * vsa.costo) as capital_total
    FROM Vista_Stock_Actual vsa;
    `
];

async function runQueries() {
    for (const q of queries) {
        console.log("Running View Query");
        try {
            const r = await fetch('http://3.85.26.173:5005/sql', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ query: q }) 
            });
            const text = await r.text();
            console.log(text);
        } catch(e) {
            console.error("HTTP Err:", e);
        }
    }
}
runQueries();
