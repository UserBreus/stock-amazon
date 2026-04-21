-- SCRIPT DE MIGRACIÓN: TIPOS DE PRODUCTO Y MULTI-MONEDA

-- 1. Crear tabla de Tipos de Producto
CREATE TABLE IF NOT EXISTS public.tipos_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Insertar los tipos básicos solicitados (solo si no existen)
INSERT INTO public.tipos_producto (nombre) VALUES 
('Telas'), 
('Tintas'), 
('Productos Terminados'), 
('General') 
ON CONFLICT (nombre) DO NOTHING;

-- 3. Migrar las categorías dinámicamente
-- Insertaremos cualquier categoría existente en 'productos' que no esté en 'tipos_producto'
INSERT INTO public.tipos_producto (nombre)
SELECT DISTINCT categoria FROM public.productos WHERE categoria IS NOT NULL
ON CONFLICT (nombre) DO NOTHING;

-- 4. Modificar tabla productos para añadir la referencia y moneda
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS tipo_id UUID REFERENCES public.tipos_producto(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS moneda TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'UYU'));

-- 5. Vincular las categorías existentes con sus nuevos IDs
UPDATE public.productos p
SET tipo_id = t.id
FROM public.tipos_producto t
WHERE p.categoria = t.nombre
AND p.tipo_id IS NULL;

-- 6. (Opcional por seguridad: Eliminar columna de categoría si ya no se usa, pero por ahora la mantenemos hasta confirmar frontend)
-- ALTER TABLE public.productos DROP COLUMN categoria;
