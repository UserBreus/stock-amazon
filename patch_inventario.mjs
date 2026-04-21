import fs from 'fs';

let content = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');

// 1. Update query
const oldQuery = `SELECT e.*, p.nombre as producto_nombre, v.nombre_variante as producto_sku, p.unidad_base as unidad 
          FROM Stock_Etiquetas e
          INNER JOIN Stock_Variantes v ON e.variante_id = v.id
          INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
          WHERE e.deposito_id = \${sectorSeleccionado} AND (e.estado = 'activo' OR e.estado IS NULL)`;

const newQuery = `SELECT e.*, p.nombre as producto_nombre, v.nombre_variante as producto_sku, p.unidad_base as unidad, m.gramos_por_metro_lineal 
          FROM Stock_Etiquetas e
          INNER JOIN Stock_Variantes v ON e.variante_id = v.id
          INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
          LEFT JOIN wms_equivalencias_metricas m ON p.id = m.producto_maestro_id
          WHERE e.deposito_id = \${sectorSeleccionado} AND (e.estado = 'activo' OR e.estado IS NULL)`;

content = content.replace(oldQuery, newQuery);

// 2. Update UI
const oldUi = `<td className="px-8 py-6 text-right font-black text-xl text-blue-600 dark:text-blue-400">
                    {et.cantidad_actual}
                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{et.unidad}</span>
                  </td>`;

const newUi = `<td className="px-8 py-6 text-right font-black text-xl text-blue-600 dark:text-blue-400">
                    <div>
                      {et.cantidad_actual}
                      <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{et.unidad}</span>
                    </div>
                    {et.gramos_por_metro_lineal && et.unidad === 'kg' && (
                      <div className="text-[10px] font-black tracking-[0.1em] text-emerald-500 mt-1 dark:text-emerald-400">
                        ≈ {(et.cantidad_actual / (et.gramos_por_metro_lineal / 1000)).toFixed(2)} Mts
                      </div>
                    )}
                  </td>`;

content = content.replace(oldUi, newUi);

fs.writeFileSync('src/pages/InventarioOperativo.tsx', content);
console.log("InventarioOperativo.tsx patched!");
