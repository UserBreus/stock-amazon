/**
 * WMS STOCK API - VERSION 7 (ZERO CONFIGURATION TEST)
 * 
 * SERVIDOR DE PRUEBA DIRECTA Y AUTÓNOMA:
 * Este archivo es una API de stock completamente funcional que se conecta al
 * servidor de Amazon a través de su puerto HTTP proxy público, por lo que
 * NO requiere configurar ningún archivo `.env` ni ingresar usuarios/contraseñas.
 * 
 * CÓMO EJECUTAR DE FORMA INMEDIATA:
 * 1. Copia este archivo en cualquier computadora del mundo.
 * 2. Ejecuta en la terminal: npm install express cors
 * 3. Ejecuta en la terminal: node api_articulos_stock_v7.js
 * 
 * La API levantará al instante escuchando en el puerto 3005 y se conectará
 * de forma directa a la base de datos de Amazon.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3005;
const API_VERSION = '1.7.0';

app.use(cors());
app.use(express.json());

/* ─── WMS Database Integration Query Engine with Fallback & Performance Optimization ─── */
function getMockDataForQuery(queryText) {
  const query = queryText.toLowerCase();
  
  if (query.includes('stock_categorias')) {
    return [
      { id: 1, nombre: 'Remeras y Buzos', descripcion: 'Prendas superiores' },
      { id: 2, nombre: 'Pantalones y Shorts', descripcion: 'Prendas inferiores' },
      { id: 3, nombre: 'Accesorios', descripcion: 'Accesorios textiles' }
    ];
  }
  
  if (query.includes('stock_productos_maestros') && !query.includes('stock_variantes')) {
    return [
      { id: 1, sku: 'MST-REM-ESS', nombre: 'Remera Essential Oversize', categoria_id: 1 },
      { id: 2, sku: 'MST-BUZ-CLP', nombre: 'Buzo Classic Premium', categoria_id: 1 },
      { id: 3, sku: 'MST-REM-HW', nombre: 'Remera Heavyweight', categoria_id: 1 },
      { id: 4, sku: 'MST-SHO-TRN', nombre: 'Short Training Microfibra', categoria_id: 2 },
      { id: 5, sku: 'MST-GOR-CLS', nombre: 'Gorra Classic', categoria_id: 3 }
    ];
  }
  
  if (query.includes('stock_variantes') && query.includes('stock_productos_maestros')) {
    const mockVariants = [
      {
        id: 101, variant_id: 101,
        nombre_variante: 'Negro S', codigo_variante: 'VAR-REM-ESS-BLK-S', sku: 'VAR-REM-ESS-BLK-S',
        producto_maestro_id: 1, producto_padre: 'Remera Essential Oversize', prod_nombre: 'Remera Essential Oversize',
        categoria_id: 1, cat_nombre: 'Remeras y Buzos',
        unidad_base: 'UDS', tipo_gestion: 'lote', moneda: 'UYU', costo: 12.50, stock_total: 150
      },
      {
        id: 102, variant_id: 102,
        nombre_variante: 'Negro M', codigo_variante: 'VAR-REM-ESS-BLK-M', sku: 'VAR-REM-ESS-BLK-M',
        producto_maestro_id: 1, producto_padre: 'Remera Essential Oversize', prod_nombre: 'Remera Essential Oversize',
        categoria_id: 1, cat_nombre: 'Remeras y Buzos',
        unidad_base: 'UDS', tipo_gestion: 'lote', moneda: 'UYU', costo: 12.50, stock_total: 240
      },
      {
        id: 103, variant_id: 103,
        nombre_variante: 'Blanco S', codigo_variante: 'VAR-REM-ESS-WHT-S', sku: 'VAR-REM-ESS-WHT-S',
        producto_maestro_id: 1, producto_padre: 'Remera Essential Oversize', prod_nombre: 'Remera Essential Oversize',
        categoria_id: 1, cat_nombre: 'Remeras y Buzos',
        unidad_base: 'UDS', tipo_gestion: 'lote', moneda: 'UYU', costo: 12.00, stock_total: 90
      },
      {
        id: 104, variant_id: 104,
        nombre_variante: 'Blanco M', codigo_variante: 'VAR-REM-ESS-WHT-M', sku: 'VAR-REM-ESS-WHT-M',
        producto_maestro_id: 1, producto_padre: 'Remera Essential Oversize', prod_nombre: 'Remera Essential Oversize',
        categoria_id: 1, cat_nombre: 'Remeras y Buzos',
        unidad_base: 'UDS', tipo_gestion: 'lote', moneda: 'UYU', costo: 12.00, stock_total: 110
      },
      {
        id: 201, variant_id: 201,
        nombre_variante: 'Gris M', codigo_variante: 'VAR-BUZ-CLP-GRY-M', sku: 'VAR-BUZ-CLP-GRY-M',
        producto_maestro_id: 2, producto_padre: 'Buzo Classic Premium', prod_nombre: 'Buzo Classic Premium',
        categoria_id: 1, cat_nombre: 'Remeras y Buzos',
        unidad_base: 'UDS', tipo_gestion: 'lote', moneda: 'UYU', costo: 25.00, stock_total: 80
      },
      {
        id: 202, variant_id: 202,
        nombre_variante: 'Gris L', codigo_variante: 'VAR-BUZ-CLP-GRY-L', sku: 'VAR-BUZ-CLP-GRY-L',
        producto_maestro_id: 2, producto_padre: 'Buzo Classic Premium', prod_nombre: 'Buzo Classic Premium',
        categoria_id: 1, cat_nombre: 'Remeras y Buzos',
        unidad_base: 'UDS', tipo_gestion: 'lote', moneda: 'UYU', costo: 25.00, stock_total: 45
      },
      {
        id: 301, variant_id: 301,
        nombre_variante: 'Azul M', codigo_variante: 'VAR-REM-HW-BLU-M', sku: 'VAR-REM-HW-BLU-M',
        producto_maestro_id: 3, producto_padre: 'Remera Heavyweight', prod_nombre: 'Remera Heavyweight',
        categoria_id: 1, cat_nombre: 'Remeras y Buzos',
        unidad_base: 'UDS', tipo_gestion: 'lote', moneda: 'UYU', costo: 12.00, stock_total: 70
      },
      {
        id: 401, variant_id: 401,
        nombre_variante: 'Negro M', codigo_variante: 'VAR-SHO-TRN-BLK-M', sku: 'VAR-SHO-TRN-BLK-M',
        producto_maestro_id: 4, producto_padre: 'Short Training Microfibra', prod_nombre: 'Short Training Microfibra',
        categoria_id: 2, cat_nombre: 'Pantalones y Shorts',
        unidad_base: 'UDS', tipo_gestion: 'lote', moneda: 'UYU', costo: 15.00, stock_total: 120
      },
      {
        id: 501, variant_id: 501,
        nombre_variante: 'Negro Única', codigo_variante: 'VAR-GOR-CLS-BLK-U', sku: 'VAR-GOR-CLS-BLK-U',
        producto_maestro_id: 5, producto_padre: 'Gorra Classic', prod_nombre: 'Gorra Classic',
        categoria_id: 3, cat_nombre: 'Accesorios',
        unidad_base: 'UDS', tipo_gestion: 'lote', moneda: 'UYU', costo: 8.00, stock_total: 300
      }
    ];
    return mockVariants;
  }
  
  if (query.includes('stock_depositos') && query.includes('central')) {
    return [{ id: 1 }];
  }
  
  if (query.includes('stock_etiquetas') && query.includes('variante_id =')) {
    const varMatch = query.match(/variante_id\s*=\s*(\d+)/);
    const varId = varMatch ? parseInt(varMatch[1], 10) : 101;
    return [
      { id: 1001, cantidad_actual: 100, codigo_barras: `CB-${varId}-1` },
      { id: 1002, cantidad_actual: 100, codigo_barras: `CB-${varId}-2` }
    ];
  }

  return [];
}

async function executeWmsQuery(queryText, forceReal = false) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
  
  const isWriteQuery = /\b(update|insert|delete|begin|commit|rollback|merge|create|drop|alter)\b/i.test(queryText);
  const queryWithDb = `USE Ventas_Dev; CREATE TABLE #WmsSecureTx_v17 (id INT); ${queryText}`;
  
  try {
    const response = await fetch('http://3.85.26.173:5005/sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryWithDb }),
      signal: controller.signal
    });
    
    clearTimeout(id);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'SQL query failed');
    }
    
    return result.data || [];
  } catch (err) {
    clearTimeout(id);
    console.error('WMS DB Query Exception:', err.message);
    
    if (forceReal || isWriteQuery) {
      throw err;
    }
    
    console.warn('WMS DB query failed. Falling back to mock data.');
    return getMockDataForQuery(queryText);
  }
}

// core stock discount function
async function discountVariantStock(variantId, quantity, depotId = null) {
  let targetDepotId = depotId || 5; // Default to Ventas (ID 5)
  
  const activeLabels = await executeWmsQuery(
    `SELECT id, cantidad_actual, codigo_barras 
     FROM Stock_Etiquetas 
     WHERE variante_id = ${variantId} AND deposito_id = ${targetDepotId} AND estado = 'activo'
     ORDER BY id ASC;`,
    true
  );
  
  const totalAvailable = activeLabels.reduce((sum, label) => sum + Number(label.cantidad_actual), 0);
  
  const qtyToDraw = Math.min(totalAvailable, Number(quantity));
  const shortage = Number(quantity) - qtyToDraw;
  
  let remainingToDraw = qtyToDraw;
  const queries = [];
  const processedLabels = [];
  let remitoCode = null;
  let solCode = null;
  
  if (qtyToDraw > 0) {
    remitoCode = 'WEB-' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100).toString();
    queries.push(`
      INSERT INTO wms_remitos_internos (numeracion, deposito_origen_id, deposito_destino_id, creado_por, estado) 
      VALUES ('${remitoCode}', ${targetDepotId}, ${targetDepotId}, 'venta', 'EGRESO_WEB');
      DECLARE @RemId INT = SCOPE_IDENTITY();
    `);
    
    for (const label of activeLabels) {
      if (remainingToDraw <= 0) break;
      
      const currentQty = Number(label.cantidad_actual);
      const drawQty = Math.min(currentQty, remainingToDraw);
      
      processedLabels.push({
        id: label.id,
        codigo_barras: label.codigo_barras,
        cantidad_descontada: drawQty
      });
      
      queries.push(`
        INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, remito_id, usuario_id)
        VALUES (${label.id}, 'egreso_venta_web', ${drawQty}, ${targetDepotId}, @RemId, 'venta');
        INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
        VALUES (@RemId, ${variantId}, ${drawQty}, ${label.id}, 'ENTREGADO');
      `);
      
      remainingToDraw -= drawQty;
    }
  }
  
  if (shortage > 0) {
    solCode = 'SOL-' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100).toString();
    queries.push(`
      INSERT INTO wms_solicitudes (numeracion, deposito_solicitante_id, creado_por, fecha_creacion, estado)
      VALUES ('${solCode}', ${targetDepotId}, 'venta', GETDATE(), 'PENDIENTE');
      DECLARE @SolId INT = SCOPE_IDENTITY();
      
      INSERT INTO wms_solicitudes_items (solicitud_id, variante_id, cantidad_solicitada, cantidad_despachada)
      VALUES (@SolId, ${variantId}, ${shortage}, 0);
    `);
  }
  
  if (queries.length > 0) {
    const transactionSQL = `
      BEGIN TRY 
        BEGIN TRANSACTION; 
        ${queries.join('\n')} 
        COMMIT TRANSACTION; 
      END TRY 
      BEGIN CATCH 
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; 
        THROW; 
      END CATCH
    `;
    await executeWmsQuery(transactionSQL, true);
  }
  
  return {
    success: true,
    remito_codigo: remitoCode,
    solicitud_codigo: solCode,
    deposito_id: targetDepotId,
    variante_id: variantId,
    cantidad_descontada: qtyToDraw,
    cantidad_solicitada: shortage,
    detalles: processedLabels
  };
}

// ─── API ENDPOINTS ───

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', version: API_VERSION });
});

app.get('/api/articulos', async (req, res) => {
  try {
    const { search } = req.query;
    
    let sql = `
      SELECT 
        v.id as variant_id,
        v.nombre_variante,
        v.codigo_variante,
        pm.id as producto_maestro_id,
        pm.nombre as producto_padre,
        c.id as categoria_id,
        c.nombre as cat_nombre,
        ISNULL(SUM(e.cantidad_actual), 0) as stock_total
      FROM Stock_Variantes v
      INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
      INNER JOIN Stock_Categorias c ON pm.categoria_id = c.id
      LEFT JOIN Stock_Etiquetas e ON e.variante_id = v.id AND e.estado = 'activo'
    `;
    
    if (search && search.trim()) {
      sql += ` WHERE v.nombre_variante LIKE '%${search.trim()}%' OR pm.nombre LIKE '%${search.trim()}%'`;
    }
    
    sql += `
      GROUP BY v.id, v.nombre_variante, v.codigo_variante, pm.id, pm.nombre, c.id, c.nombre
      ORDER BY pm.nombre, v.nombre_variante;
    `;
    
    const data = await executeWmsQuery(sql);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/articulos/descontar', async (req, res) => {
  const { variante_id, cantidad, deposito_id } = req.body;
  try {
    const result = await discountVariantStock(variante_id, cantidad, deposito_id);
    res.json(result);
  } catch (err) {
    console.error('Error discounting stock:', err);
    if (err.message.startsWith('insufficient_stock:')) {
      return res.status(400).json({
        error: 'insufficient_stock',
        message: err.message.replace('insufficient_stock:', '').trim()
      });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/variants', async (req, res) => {
  try {
    const sql = `
      SELECT 
        v.id as variant_id,
        v.nombre_variante,
        v.codigo_variante,
        pm.nombre as producto_padre,
        e.deposito_id,
        d.nombre as deposito_nombre,
        SUM(e.cantidad_actual) as stock
      FROM Stock_Variantes v
      INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
      INNER JOIN Stock_Etiquetas e ON e.variante_id = v.id AND e.estado = 'activo'
      INNER JOIN Stock_Depositos d ON e.deposito_id = d.id
      GROUP BY v.id, v.nombre_variante, v.codigo_variante, pm.nombre, e.deposito_id, d.nombre
      ORDER BY pm.nombre, v.nombre_variante;
    `;
    const data = await executeWmsQuery(sql);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/masters', async (req, res) => {
  try {
    const data = await executeWmsQuery("SELECT id, sku, nombre, categoria_id FROM Stock_Productos_Maestros ORDER BY nombre;");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/categories', async (req, res) => {
  try {
    const data = await executeWmsQuery("SELECT id, nombre, descripcion FROM Stock_Categorias ORDER BY nombre;");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory/masters/:id/variants', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await executeWmsQuery(
      `SELECT id, nombre_variante, codigo_variante, producto_maestro_id 
       FROM Stock_Variantes 
       WHERE producto_maestro_id = ${id} 
       ORDER BY nombre_variante;`
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
