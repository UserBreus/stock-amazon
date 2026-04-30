const fs = require('fs');
let c = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

c = c.replace(/SELECT TOP 10[\s\S]*?ORDER BY total_movimiento DESC/, `SELECT TOP 10 
                v.nombre_variante, 
                (
                    ISNULL((SELECT SUM(m.cantidad_afectada) 
                            FROM Stock_Movimientos m 
                            INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id 
                            WHERE e.variante_id = v.id AND m.tipo_movimiento = 'consumo'), 0)
                    +
                    ISNULL((SELECT SUM(h.cantidad_consumida) 
                            FROM Stock_Consumo_Historico h 
                            WHERE h.variante_id = v.id), 0)
                ) as total_movimiento
            FROM Stock_Variantes v
            WHERE (
                    ISNULL((SELECT SUM(m.cantidad_afectada) 
                            FROM Stock_Movimientos m 
                            INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id 
                            WHERE e.variante_id = v.id AND m.tipo_movimiento = 'consumo'), 0)
                    +
                    ISNULL((SELECT SUM(h.cantidad_consumida) 
                            FROM Stock_Consumo_Historico h 
                            WHERE h.variante_id = v.id), 0)
                ) > 0
            ORDER BY total_movimiento DESC`);

c = c.replace(/sltimos 7 d.as\. Clic para ver historial detallado por mes y familia\./g, 'Histórico global y WMS. Clic para ver historial detallado por mes y familia.');
c = c.replace(/ltimos 7 d.as\. Clic para ver historial detallado por mes y familia\./g, 'Histórico global y WMS. Clic para ver historial detallado por mes y familia.');
c = c.replace(/sltimos 7 das\. Clic para ver historial detallado por mes y familia\./g, 'Histórico global y WMS. Clic para ver historial detallado por mes y familia.');

fs.writeFileSync('src/pages/Dashboard.tsx', c);
