-- ==========================================
-- SCRIPT DE MIGRACIÓN: MÓDULO IMPORTACIONES WMS
-- ==========================================

-- 1. Eliminar la tabla actual de importaciones (Ojo: Borra data test)
DROP TABLE IF EXISTS public.importacion_eventos CASCADE;
DROP TABLE IF EXISTS public.importacion_proveedores CASCADE;
DROP TABLE IF EXISTS public.importaciones CASCADE;

-- 2. Tabla Principal de Importaciones
CREATE TABLE public.importaciones (
    id TEXT PRIMARY KEY,
    puerto_origen TEXT NOT NULL,
    puerto_destino TEXT NOT NULL,
    fecha_compra TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_prometida TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_arribo_puerto TIMESTAMP WITH TIME ZONE,
    fecha_llegada_deposito TIMESTAMP WITH TIME ZONE,
    estado TEXT NOT NULL DEFAULT 'Planificado',
    tipo TEXT NOT NULL DEFAULT 'ocean',
    transportista TEXT NOT NULL,
    progreso NUMERIC NOT NULL DEFAULT 0,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Proveedores por Importación (Consolidado)
CREATE TABLE public.importacion_proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    importacion_id TEXT NOT NULL REFERENCES public.importaciones(id) ON DELETE CASCADE,
    nombre_proveedor TEXT NOT NULL,
    ciudad_origen TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Eventos / Trazabilidad Operativa
CREATE TABLE public.importacion_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    importacion_id TEXT NOT NULL REFERENCES public.importaciones(id) ON DELETE CASCADE,
    ubicacion TEXT NOT NULL,
    anotacion TEXT NOT NULL,
    usuario TEXT DEFAULT 'Sistema',
    fecha_evento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Seguridad: Habilitar Row Level Security (RLS) pero permitir uso abierto para nuestra Custom Auth
ALTER TABLE public.importaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.importacion_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.importacion_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Importaciones Open" ON public.importaciones FOR ALL USING (true);
CREATE POLICY "Importacion Proveedores Open" ON public.importacion_proveedores FOR ALL USING (true);
CREATE POLICY "Importacion Eventos Open" ON public.importacion_eventos FOR ALL USING (true);

-- 6. Insertar Datos de Prueba (Seed Data)
INSERT INTO public.importaciones (id, puerto_origen, puerto_destino, fecha_compra, fecha_prometida, fecha_arribo_puerto, fecha_llegada_deposito, estado, tipo, transportista, progreso) VALUES
('IMP-2026-001', 'Shanghai, CN', 'Montevideo, UY', '2026-03-01T10:00:00Z', '2026-04-12T10:00:00Z', NULL, NULL, 'En Tránsito', 'ocean', 'CMA CGM', 50),
('IMP-2026-002', 'Miami, US', 'Montevideo, UY', '2026-03-20T10:00:00Z', '2026-03-31T10:00:00Z', '2026-03-30T14:30:00Z', NULL, 'Aduana', 'air', 'DHL Cargo', 80)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.importacion_proveedores (importacion_id, nombre_proveedor, ciudad_origen) VALUES
('IMP-2026-001', 'Shenzhen Electronics', 'Shenzhen'),
('IMP-2026-001', 'Telas Globales', 'Guangzhou'),
('IMP-2026-002', 'Maquinaria Express US', 'Orlando');

INSERT INTO public.importacion_eventos (importacion_id, ubicacion, anotacion, fecha_evento) VALUES
('IMP-2026-001', 'Puerto de Shanghai', 'Consolidación de carga de dos proveedores completada.', '2026-03-08T12:00:00Z'),
('IMP-2026-001', 'Océano Pacífico', 'Crucerocero en ruta - Sin demoras.', '2026-03-25T12:00:00Z'),
('IMP-2026-002', 'Aeropuerto de Carrasco, MVD', 'Vuelo aterrizado. Carga en terminal de descargas.', '2026-03-30T14:30:00Z'),
('IMP-2026-002', 'Aduana Local (DNU)', 'Demora por leyes aduaneras uruguayas. Solicitan inspección fiscal en Canal Rojo.', '2026-03-31T09:15:00Z');
