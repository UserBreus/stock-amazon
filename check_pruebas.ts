import { executeAWSQuery } from './src/lib/aws-client';

async function checkPruebas() {
  try {
    const articulos = await executeAWSQuery("SELECT id, nombre_variante FROM Stock_Variantes WHERE nombre_variante LIKE '%prueba%'");
    console.log('--- ARTICULOS DE PRUEBA ---');
    console.table(articulos);

    if (articulos && articulos.length > 0) {
      const ids = articulos.map(a => a.id).join(',');
      const movs = await executeAWSQuery(`
        SELECT 
          m.tipo_movimiento,
          COUNT(*) as cantidad
        FROM Stock_Movimientos m
        INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
        WHERE e.variante_id IN (${ids})
        GROUP BY m.tipo_movimiento
      `);
      console.log('\n--- MOVIMIENTOS ASOCIADOS ---');
      console.table(movs);
    } else {
      console.log('No se encontraron artículos con el nombre "prueba".');
    }
  } catch (e) {
    console.error(e);
  }
}

checkPruebas();
