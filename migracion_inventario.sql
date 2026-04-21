-- VACIADADO DE BASE DE DATOS
TRUNCATE TABLE movimientos CASCADE;
TRUNCATE TABLE etiquetas CASCADE;
TRUNCATE TABLE productos CASCADE;
TRUNCATE TABLE tipos_producto CASCADE;

-- INSERTAR CATEGORIAS
INSERT INTO tipos_producto (nombre) VALUES ('PAPELES');
INSERT INTO tipos_producto (nombre) VALUES ('TINTAS');
INSERT INTO tipos_producto (nombre) VALUES ('PET');
INSERT INTO tipos_producto (nombre) VALUES ('POLIAMIDA');
INSERT INTO tipos_producto (nombre) VALUES ('TELAS');
INSERT INTO tipos_producto (nombre) VALUES ('LONAS, VINILOS, OTROS');
INSERT INTO tipos_producto (nombre) VALUES ('TPU');
INSERT INTO tipos_producto (nombre) VALUES ('ARTICULOS');

-- INSERTAR PRODUCTOS Y ETIQUETAS
WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL RESPALDO 1,80 (20g)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL RESPALDO 1,80 (20g)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 12, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL RESPALDO 1,80 (40g)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL RESPALDO 1,80 (40g)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
SELECT 1; -- No stock para PAPEL RESPALDO 1,80 (40g)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL RESPALDO 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL RESPALDO 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
SELECT 1; -- No stock para PAPEL RESPALDO 1,60

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL 1,83 M (1000 Mts) (52g)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL 1,83 M (1000 Mts) (52g)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 8, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL 1,83 M (1500 Mts) (29g)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL 1,83 M (1500 Mts) (29g)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
SELECT 1; -- No stock para PAPEL 1,83 M (1500 Mts) (29g)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL 1,83 M (1000 Mts) Br', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL 1,83 M (1000 Mts) Br', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 11, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL 1,83 M (300 Mts)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL 1,83 M (300 Mts)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 36, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL 1,60 M (100 Mts)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL 1,60 M (100 Mts)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
SELECT 1; -- No stock para PAPEL 1,60 M (100 Mts)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL 1,83 M (1000 Mts) (29g)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL 1,83 M (1000 Mts) (29g)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
SELECT 1; -- No stock para PAPEL 1,83 M (1000 Mts) (29g)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL 1,83 M (2000 Mts) (29g)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL 1,83 M (2000 Mts) (29g)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 64, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL SUBL 100m 914mm 90gsm', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL SUBL 100m 914mm 90gsm', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 200, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL SUBL 100m 1118mm 90gsm', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL SUBL 100m 1118mm 90gsm', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 100, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PAPEL SUBL 100m 1600mm 90gsm', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PAPEL SUBL 100m 1600mm 90gsm', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PAPELES'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 117, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI AD C', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI AD C', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 62, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI AD M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI AD M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 59, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI AD Y', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI AD Y', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 53, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI AD K', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI AD K', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 60, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'liquido de limpieza sublimacion', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('liquido de limpieza sublimacion', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 12, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF BLANCA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF BLANCA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 1016, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF C', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF C', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 56, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 35, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF Y', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF Y', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 25, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF K', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF K', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 38, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Liquido de Limpieza DTF', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Liquido de Limpieza DTF', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 111, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Liquido de Limpieza DTF Fuerte', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Liquido de Limpieza DTF Fuerte', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 16, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF UV BLANCA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF UV BLANCA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 16, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF UV C', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF UV C', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 27, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF UV M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF UV M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 22, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF UV Y', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF UV Y', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 27, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF UV K', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF UV K', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 28, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Liquido Limpieza DTF UV', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Liquido Limpieza DTF UV', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 10, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'BARNIZ', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('BARNIZ', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 38, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-F- UV C', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-F- UV C', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 108, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-F- UV M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-F- UV M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 118, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-F- UV Y', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-F- UV Y', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 104, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-F- UV K', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-F- UV K', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 107, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-ECO S C', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-ECO S C', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 61, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-ECO S M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-ECO S M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 76, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-ECO S Y', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-ECO S Y', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 62, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-ECO S K', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-ECO S K', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 67, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Liquido Limpieza ECO SOLVENTE', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Liquido Limpieza ECO SOLVENTE', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 11, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI C Directa', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI C Directa', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 24, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI M Directa', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI M Directa', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 60, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI Y Directa', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI Y Directa', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 60, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI K Directa', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI K Directa', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 72, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T- SUBLI FLUORESCENTE M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T- SUBLI FLUORESCENTE M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T- SUBLI FLUORESCENTE M

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T- SUBLI FLUORESCENTE Y', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T- SUBLI FLUORESCENTE Y', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T- SUBLI FLUORESCENTE Y

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF FLUORESCENTE M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF FLUORESCENTE M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T-DTF FLUORESCENTE M

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF FLUORESCENTE Y', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF FLUORESCENTE Y', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T-DTF FLUORESCENTE Y

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF FLUORESCENTE O', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF FLUORESCENTE O', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T-DTF FLUORESCENTE O

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-DTF FLUORESCENTE G', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-DTF FLUORESCENTE G', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T-DTF FLUORESCENTE G

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MIMAKI T- C', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MIMAKI T- C', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 6, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MIMAKI T- M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MIMAKI T- M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 7, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MIMAKI T- Y', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MIMAKI T- Y', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 6, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MIMAKI T- K', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MIMAKI T- K', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 5, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'ECO T - C', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('ECO T - C', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para ECO T - C

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'ECO T - M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('ECO T - M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para ECO T - M

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'ECO T - Y', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('ECO T - Y', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para ECO T - Y

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-UV -TEXTIL-SUPER SOFT BARNIZ', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-UV -TEXTIL-SUPER SOFT BARNIZ', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 48, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-UV -TEXTIL-SUPER SOFT-CYAN', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-UV -TEXTIL-SUPER SOFT-CYAN', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 30, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-UV -TEXTIL-SUPER SOFT-MAGENTA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-UV -TEXTIL-SUPER SOFT-MAGENTA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 30, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-UV -TEXTIL-SUPER SOFT-AMARILLO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-UV -TEXTIL-SUPER SOFT-AMARILLO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 30, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-UV -TEXTIL-SUPER SOFT-NEGRO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-UV -TEXTIL-SUPER SOFT-NEGRO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 30, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-UV -TEXTIL-SUPER SOFT-BLANCA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-UV -TEXTIL-SUPER SOFT-BLANCA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 116, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Liquido Pre Tratamiento', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Liquido Pre Tratamiento', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 40, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Liquido de limpieza de impresion directa', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Liquido de limpieza de impresion directa', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para Liquido de limpieza de impresion directa

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI AD C PRUEBA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI AD C PRUEBA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T-SUBLI AD C PRUEBA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI AD M PRUEBA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI AD M PRUEBA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T-SUBLI AD M PRUEBA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI AD Y PRUEBA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI AD Y PRUEBA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T-SUBLI AD Y PRUEBA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'T-SUBLI AD K PRUEBA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('T-SUBLI AD K PRUEBA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TINTAS'
  RETURNING id
)
SELECT 1; -- No stock para T-SUBLI AD K PRUEBA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM COMUN', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM COMUN', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM COMUN

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM HOT X2', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM HOT X2', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 406, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM 120X100 HOT', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM 120X100 HOT', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 100, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM LUMINISCENTE', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM LUMINISCENTE', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM LUMINISCENTE

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM PLATEADO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM PLATEADO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM PLATEADO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM DORADO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM DORADO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM DORADO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM GLITTER', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM GLITTER', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM GLITTER

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM TORNASOLADO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM TORNASOLADO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM TORNASOLADO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM CAMALEON', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM CAMALEON', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM CAMALEON

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM REFLECTIVO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM REFLECTIVO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM REFLECTIVO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM UV', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM UV', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM UV

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM COMUN FRIO X4 (30CMX100CM)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM COMUN FRIO X4 (30CMX100CM)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para FILM COMUN FRIO X4 (30CMX100CM)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM HOT X4 (30CMX100CM)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM HOT X4 (30CMX100CM)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 87, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Film uv DTF Blanco (60CMX100CM)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Film uv DTF Blanco (60CMX100CM)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para Film uv DTF Blanco (60CMX100CM)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Film uv DTF Blanco (30CMX100CM)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Film uv DTF Blanco (30CMX100CM)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para Film uv DTF Blanco (30CMX100CM)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'film uv DTF Transparente 60cm', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('film uv DTF Transparente 60cm', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 13, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'film uv DTF Transparente 30cm', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('film uv DTF Transparente 30cm', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'PET'
  RETURNING id
)
SELECT 1; -- No stock para film uv DTF Transparente 30cm

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'POLIAMIDA BLANCA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('POLIAMIDA BLANCA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'POLIAMIDA'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 519, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'POLIAMIDA BLANCA ESPECIAL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('POLIAMIDA BLANCA ESPECIAL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'POLIAMIDA'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 60, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'POLIAMIDA NEGRA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('POLIAMIDA NEGRA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'POLIAMIDA'
  RETURNING id
)
SELECT 1; -- No stock para POLIAMIDA NEGRA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DRY 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DRY 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 535, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DRY 1,70', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DRY 1,70', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para DRY 1,70

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'ADIS 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('ADIS 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para ADIS 1,60

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'ADIS ELASTIZADO 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('ADIS ELASTIZADO 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 11, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'BANDERA COMÚN 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('BANDERA COMÚN 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 31, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'BANDERA COMÚN 3,20', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('BANDERA COMÚN 3,20', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para BANDERA COMÚN 3,20

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'BANDERA FINA 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('BANDERA FINA 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 12, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'BANDERA MESH 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('BANDERA MESH 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 29, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DEPORTIVO 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DEPORTIVO 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 16, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DRY LISO 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DRY LISO 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para DRY LISO 1,80

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DRY LISO 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DRY LISO 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para DRY LISO 1,60

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DRY POROSO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DRY POROSO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 3, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FORRO SATEN 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FORRO SATEN 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para FORRO SATEN 1,60

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'HEXAGONAL 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('HEXAGONAL 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 244, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'JACQUARD 1,', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('JACQUARD 1,', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 60, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'JACQUARD 1,', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('JACQUARD 1,', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 80, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MICROFIBRA 1,', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MICROFIBRA 1,', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 60, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MICROPOLAR 1,', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MICROPOLAR 1,', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 60, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MODAL 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MODAL 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 50, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MYKONOS 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MYKONOS 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para MYKONOS 1,60

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MYKONOS 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MYKONOS 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 34, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PANAMA 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PANAMA 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 61, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DRY PRO 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DRY PRO 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para DRY PRO 1,60

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'POLAR 1,50', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('POLAR 1,50', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 17, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'LYCRA 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('LYCRA 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 12, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'TOALLA 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('TOALLA 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 102, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'TOALLA 1,50', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('TOALLA 1,50', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 2, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'NÁUTICA 1,50', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('NÁUTICA 1,50', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para NÁUTICA 1,50

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'JACQUARD ELITE 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('JACQUARD ELITE 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 30, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'JACQUARD SUPREME 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('JACQUARD SUPREME 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 1, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'JACQUARD CHARRUA 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('JACQUARD CHARRUA 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para JACQUARD CHARRUA 1,80

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'RIB JACQUARD 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('RIB JACQUARD 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 25, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SCUBA 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SCUBA 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 146, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DRY PRO 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DRY PRO 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para DRY PRO 1,80

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DRY EXCLUSIVE 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DRY EXCLUSIVE 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 1, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'ADIS ELASTIZADO 1,50', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('ADIS ELASTIZADO 1,50', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 5, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'INTERLOCK 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('INTERLOCK 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 52, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'modal 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('modal 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 39, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'PIQUE 1,80', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('PIQUE 1,80', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 102, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SUPLEX 1,60', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SUPLEX 1,60', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para SUPLEX 1,60

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'CAJA BANDERAS X100 1,50 X 0,90', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('CAJA BANDERAS X100 1,50 X 0,90', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
SELECT 1; -- No stock para CAJA BANDERAS X100 1,50 X 0,90

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'CAJA BANDERAS X100 1,50 X 0,85', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('CAJA BANDERAS X100 1,50 X 0,85', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 6, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Jacquard City', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Jacquard City', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 19, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Dry Milan', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Dry Milan', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 1, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Microfibra RV Waterproof', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Microfibra RV Waterproof', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 22, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Microfibra Short', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Microfibra Short', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 16, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'INTERLOCK  Grueso', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('INTERLOCK  Grueso', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 18, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'DELTA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('DELTA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 54, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'GRID', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('GRID', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 83, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'NAGASAKI', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('NAGASAKI', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TELAS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 24, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH BRI 1,60 (Reverso blanco)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH BRI 1,60 (Reverso blanco)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para FRONTLIGTH BRI 1,60 (Reverso blanco)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH MAT1,60 (Reverso blanco)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH MAT1,60 (Reverso blanco)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para FRONTLIGTH MAT1,60 (Reverso blanco)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH BRI 1,60 (Reverso gris)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH BRI 1,60 (Reverso gris)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para FRONTLIGTH BRI 1,60 (Reverso gris)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH MAT1,60 (Reverso gris)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH MAT1,60 (Reverso gris)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para FRONTLIGTH MAT1,60 (Reverso gris)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH MAT 3,20 (Reverso blanco)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH MAT 3,20 (Reverso blanco)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 2, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH BRI 3,20 (Reverso blanco)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH BRI 3,20 (Reverso blanco)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 41, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH MAT 3,20 (Reverso gris)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH MAT 3,20 (Reverso gris)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para FRONTLIGTH MAT 3,20 (Reverso gris)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH BRI 3,20 (Reverso gris)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH BRI 3,20 (Reverso gris)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para FRONTLIGTH BRI 3,20 (Reverso gris)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH BRI 3,20 (Reverso Negro)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH BRI 3,20 (Reverso Negro)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 22, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH MAT 3,20 (Reverso Negro)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH MAT 3,20 (Reverso Negro)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 17, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH MAT1,60 (Reverso Negro)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH MAT1,60 (Reverso Negro)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 14, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FRONTLIGTH BRI 1,60 (Reverso Negro)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FRONTLIGTH BRI 1,60 (Reverso Negro)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para FRONTLIGTH BRI 1,60 (Reverso Negro)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'LONA FRONT 3.20 BRILLO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('LONA FRONT 3.20 BRILLO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 112, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'LONA FRONT 3.20 MATE', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('LONA FRONT 3.20 MATE', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 44, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'LONA FRONT 3.20 BACKLIGHT', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('LONA FRONT 3.20 BACKLIGHT', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 9, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'LONA MESH 3.20', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('LONA MESH 3.20', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 9, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'LONA PU 3.20', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('LONA PU 3.20', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 9, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'VINILO BRILLANTE', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('VINILO BRILLANTE', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 129, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'VINILO MATE', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('VINILO MATE', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 58, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'VINILO MICROPERFORADO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('VINILO MICROPERFORADO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 9, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Canvas 0,91', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Canvas 0,91', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Canvas 0,91

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Canvas 1,27', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Canvas 1,27', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Canvas 1,27

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Brillo R/Blanco x50m (1,52)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Brillo R/Blanco x50m (1,52)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 19, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Brillo R/Blanco x50m (0,91)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Brillo R/Blanco x50m (0,91)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 64, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Mate R/Blanco x50m (1,52)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Mate R/Blanco x50m (1,52)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Vinilo Mate R/Blanco x50m (1,52)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Mate R/Blanco x50m (0,91)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Mate R/Blanco x50m (0,91)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Vinilo Mate R/Blanco x50m (0,91)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Banner Pet semibrillo x50m (0,91)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Banner Pet semibrillo x50m (0,91)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Banner Pet semibrillo x50m (0,91)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Banner Pet mate x50m (0,91)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Banner Pet mate x50m (0,91)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Banner Pet mate x50m (0,91)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Back Pet x50m (0,915)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Back Pet x50m (0,915)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 22, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Vehicular x58m (1,52)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Vehicular x58m (1,52)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Vinilo Vehicular x58m (1,52)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Brillo A/Gris x50m (1,37)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Brillo A/Gris x50m (1,37)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 48, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Brillo A/Gris x50m (1,52)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Brillo A/Gris x50m (1,52)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Vinilo Brillo A/Gris x50m (1,52)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Brillo A/Transparente x50m (1,37)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Brillo A/Transparente x50m (1,37)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Vinilo Brillo A/Transparente x50m (1,37)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Brillo A/Transparente x50m (1,52)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Brillo A/Transparente x50m (1,52)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Vinilo Brillo A/Transparente x50m (1,52)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Mate A/Gris x50m (1,52)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Mate A/Gris x50m (1,52)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Vinilo Mate A/Gris x50m (1,52)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Microperforado (Reverso Negro) (0,98 m)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Microperforado (Reverso Negro) (0,98 m)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 5, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Vinilo Microperforado  (Reverso Negro) (1,52 m)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Vinilo Microperforado  (Reverso Negro) (1,52 m)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
SELECT 1; -- No stock para Vinilo Microperforado  (Reverso Negro) (1,52 m)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Papel de Foto  x30m (0,91)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Papel de Foto  x30m (0,91)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 48, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'CAR FLAG POLE 80X200', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('CAR FLAG POLE 80X200', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 34, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'STEEL ROLL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('STEEL ROLL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'LONAS, VINILOS, OTROS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 20, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'WHITE MATTE/SHINY TPU', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('WHITE MATTE/SHINY TPU', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TPU'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 939, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'HOT MELT TPU FILM', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('HOT MELT TPU FILM', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TPU'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 248, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM GOLD TPU', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM GOLD TPU', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TPU'
  RETURNING id
)
SELECT 1; -- No stock para FILM GOLD TPU

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM SILVER TPU', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM SILVER TPU', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TPU'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 625, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM PROTECTOR TPU', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM PROTECTOR TPU', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TPU'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 341, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'FILM LOCALIZADOR TPU', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('FILM LOCALIZADOR TPU', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'TPU'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 787, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MEDIA ANTIDESLIZANTE NEGRA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MEDIA ANTIDESLIZANTE NEGRA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para MEDIA ANTIDESLIZANTE NEGRA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MEDIA ANTIDESLIZANTE BLANCO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MEDIA ANTIDESLIZANTE BLANCO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para MEDIA ANTIDESLIZANTE BLANCO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MEDIA ANTIDESLIZANTE AZUL FRANCIA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MEDIA ANTIDESLIZANTE AZUL FRANCIA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para MEDIA ANTIDESLIZANTE AZUL FRANCIA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MEDIA ANTIDESLIZANTE AZUL MARINO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MEDIA ANTIDESLIZANTE AZUL MARINO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para MEDIA ANTIDESLIZANTE AZUL MARINO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MEDIA ANTIDESLIZANTE ROJO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MEDIA ANTIDESLIZANTE ROJO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para MEDIA ANTIDESLIZANTE ROJO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MEDIA ANTIDESLIZANTE AMARILLO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MEDIA ANTIDESLIZANTE AMARILLO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para MEDIA ANTIDESLIZANTE AMARILLO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MEDIA ANTIDESLIZANTE VERDE', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MEDIA ANTIDESLIZANTE VERDE', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para MEDIA ANTIDESLIZANTE VERDE

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'CAÑA NEGRA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('CAÑA NEGRA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para CAÑA NEGRA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'CAÑA BLANCA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('CAÑA BLANCA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para CAÑA BLANCA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'CAÑA AZUL FRANCIA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('CAÑA AZUL FRANCIA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para CAÑA AZUL FRANCIA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'CAÑA AZUL MARINO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('CAÑA AZUL MARINO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para CAÑA AZUL MARINO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'CAÑA ROJO', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('CAÑA ROJO', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para CAÑA ROJO

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'CAÑA VERDE', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('CAÑA VERDE', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para CAÑA VERDE

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO S', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO S', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT NEGRO S

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT NEGRO M

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO L', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO L', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT NEGRO L

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO XL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO XL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT NEGRO XL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO XXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO XXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT NEGRO XXL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO XXXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO XXXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT NEGRO XXXL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO 6', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO 6', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT NEGRO 6

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO 8', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO 8', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT NEGRO 8

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO 10', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO 10', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT NEGRO 10

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO 12', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO 12', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 96, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO 14', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO 14', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 227, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT NEGRO 16', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT NEGRO 16', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 60, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO S', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO S', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 173, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 67, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO  L', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO  L', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 77, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO XL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO XL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT BLANCO XL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO XXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO XXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT BLANCO XXL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO XXXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO XXXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT BLANCO XXXL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO 6', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO 6', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT BLANCO 6

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO 8', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO 8', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT BLANCO 8

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO 10', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO 10', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT BLANCO 10

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO 12', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO 12', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 373, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO 14', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO 14', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 232, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT BLANCO 16', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT BLANCO 16', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 391, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO S', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO S', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 148, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 407, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO L', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO L', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 529, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO XL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO XL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT AZUL MARINO XL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO XXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO XXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT AZUL MARINO XXL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO XXXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO XXXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT AZUL MARINO XXXL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO 6', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO 6', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT AZUL MARINO 6

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO 8', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO 8', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT AZUL MARINO 8

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO 10', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO 10', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT AZUL MARINO 10

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO 12', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO 12', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 298, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO 14', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO 14', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 155, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL MARINO 16', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL MARINO 16', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 273, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA S', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA S', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 59, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 17, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA L', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA L', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 31, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA XL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA XL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 23, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA XXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA XXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT AZUL FRANCIA XXL

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA XXXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA XXXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 1, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA 6', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA 6', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 19, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA 8', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA 8', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 24, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA 10', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA 10', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT AZUL FRANCIA 10

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA 12', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA 12', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 65, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA 14', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA 14', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 209, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT AZUL FRANCIA 16', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT AZUL FRANCIA 16', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 110, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO S', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO S', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 199, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 77, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO L', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO L', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 128, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO XL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO XL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 186, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO XXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO XXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 211, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO XXXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO XXXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 206, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO 6', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO 6', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 118, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO 8', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO 8', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 184, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO 10', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO 10', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 124, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO 12', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO 12', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 80, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO 14', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO 14', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 253, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT ROJO 16', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT ROJO 16', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 447, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE S', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE S', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 233, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE M', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE M', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 377, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE L', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE L', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 257, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE XL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE XL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 2980, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE XXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE XXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 20, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE XXXL', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE XXXL', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 5, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE 6', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE 6', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 34, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE 8', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE 8', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT VERDE 8

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE 10', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE 10', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT VERDE 10

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE 12', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE 12', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para SHORT VERDE 12

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 14, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'SHORT VERDE', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('SHORT VERDE', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
INSERT INTO etiquetas (producto_id, codigo_barras, cantidad_actual, estado, deposito_id)
SELECT id, 'LOTE-' || floor(random() * 100000) || '-' || floor(random() * 1000), 16, 'activo', 
(SELECT id FROM depositos WHERE tipo = 'general' LIMIT 1)
FROM ins;

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'MAQUINA PATILLERA', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('MAQUINA PATILLERA', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para MAQUINA PATILLERA

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Estructuras Roll Up Fuerte 80x200 cm', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Estructuras Roll Up Fuerte 80x200 cm', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para Estructuras Roll Up Fuerte 80x200 cm

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Estructuras Roll Up común de aluminio 80x200 cm', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Estructuras Roll Up común de aluminio 80x200 cm', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para Estructuras Roll Up común de aluminio 80x200 cm

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Backing Pop Up (Soporte para Tela)', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Backing Pop Up (Soporte para Tela)', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para Backing Pop Up (Soporte para Tela)

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Palo de Bandera para Auto CAJAS', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Palo de Bandera para Auto CAJAS', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para Palo de Bandera para Auto CAJAS

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Auriculares', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Auriculares', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para Auriculares

WITH ins AS (
  INSERT INTO productos (nombre, costo, moneda, unidad, es_agrupable, tipo_id, sku)
  SELECT 
    'Gorras de invierno', 0, 'USD', 'ud', false, t.id, UPPER(SUBSTRING(REGEXP_REPLACE('Gorras de invierno', '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 8))
  FROM tipos_producto t WHERE t.nombre = 'ARTICULOS'
  RETURNING id
)
SELECT 1; -- No stock para Gorras de invierno

