const fs = require('fs');
let c = fs.readFileSync('src/components/TopMovimientosModal.tsx', 'utf8');

const start = c.indexOf('const fetchDatos =');
const endStr = 'setLoading(false);\n        }';
const end = c.indexOf(endStr, start) + endStr.length;

if(start !== -1 && end > start) {
    const newContent = `const fetchDatos = async () => {
        setLoading(true);
        try {
            let catFilter = catId === 'todas' ? '' : \`AND c.id = \${catId}\`;
            
            const query = \`
                SELECT 
                    v.id as variante_id,
                    v.nombre_variante, 
                    p.nombre as prod_nombre, 
                    c.nombre as categoria_nombre,
                    (
                        ISNULL((
                            SELECT SUM(m.cantidad_afectada)
                            FROM Stock_Movimientos m
                            INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
                            WHERE e.variante_id = v.id 
                              AND m.tipo_movimiento = 'consumo'
                              AND MONTH(m.fecha) = \${mes}
                              AND YEAR(m.fecha) = \${anio}
                        ), 0)
                        +
                        ISNULL((
                            SELECT SUM(h.cantidad_consumida)
                            FROM Stock_Consumo_Historico h
                            WHERE h.variante_id = v.id
                              AND h.mes = \${mes}
                              AND h.anio = \${anio}
                        ), 0)
                    ) as total_movimiento
                FROM Stock_Variantes v
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                WHERE 1=1 \${catFilter}
                  AND (
                        ISNULL((
                            SELECT SUM(m.cantidad_afectada)
                            FROM Stock_Movimientos m
                            INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
                            WHERE e.variante_id = v.id 
                              AND m.tipo_movimiento = 'consumo'
                              AND MONTH(m.fecha) = \${mes}
                              AND YEAR(m.fecha) = \${anio}
                        ), 0)
                        +
                        ISNULL((
                            SELECT SUM(h.cantidad_consumida)
                            FROM Stock_Consumo_Historico h
                            WHERE h.variante_id = v.id
                              AND h.mes = \${mes}
                              AND h.anio = \${anio}
                        ), 0)
                  ) > 0
                ORDER BY total_movimiento DESC
            \`;
            
            const data = await executeAWSQuery(query);
            
            const formatted = (data || []).map((d: any) => ({
                name: d.nombre_variante,
                product: d.prod_nombre,
                category: d.categoria_nombre || 'Sin Familia',
                consumo: d.total_movimiento
            }));
            
            setDatos(formatted);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }`;

    c = c.slice(0, start) + newContent + c.slice(end);
    fs.writeFileSync('src/components/TopMovimientosModal.tsx', c);
    console.log('Replaced successfully');
} else {
    console.log('Not found: ', start, end);
}
