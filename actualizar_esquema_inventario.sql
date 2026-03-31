-- NUEVO ESQUEMA DE INVENTARIO WMS

-- 1. Depósitos (Almacenes y Sectores)
CREATE TABLE IF NOT EXISTS public.depositos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('general', 'operativo')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Productos (Catálogo Base)
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    categoria TEXT DEFAULT 'General',
    unidad TEXT NOT NULL DEFAULT 'ud',
    es_agrupable BOOLEAN NOT NULL DEFAULT false,
    costo NUMERIC NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Etiquetas (Objetos/Instancias Físicas)
CREATE TABLE IF NOT EXISTS public.etiquetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_barras TEXT UNIQUE NOT NULL,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    deposito_id UUID NOT NULL REFERENCES public.depositos(id) ON DELETE CASCADE,
    cantidad_actual NUMERIC NOT NULL DEFAULT 1,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'agotado', 'cuarentena')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para auto-agotar etiquetas sin saldo
CREATE OR REPLACE FUNCTION revisar_cantidad_etiqueta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cantidad_actual <= 0 THEN
    NEW.estado = 'agotado';
    NEW.cantidad_actual = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_cantidad_etiqueta ON public.etiquetas;
CREATE TRIGGER trigger_check_cantidad_etiqueta
BEFORE INSERT OR UPDATE ON public.etiquetas
FOR EACH ROW
EXECUTE FUNCTION revisar_cantidad_etiqueta();

-- 4. Movimientos (Historial)
CREATE TABLE IF NOT EXISTS public.movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    etiqueta_id UUID NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso', 'transferencia', 'consumo')),
    cantidad NUMERIC NOT NULL,
    deposito_origen_id UUID REFERENCES public.depositos(id) ON DELETE CASCADE,
    deposito_destino_id UUID REFERENCES public.depositos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Solicitudes (Desde operativo a general)
CREATE TABLE IF NOT EXISTS public.solicitudes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposito_id UUID NOT NULL REFERENCES public.depositos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    cantidad_solicitada NUMERIC NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- DROP ANTIGUA TABLA
DROP TABLE IF EXISTS public.inventario CASCADE;

-- Habilitar RLS
ALTER TABLE public.depositos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

-- Evitar conflictos silenciosos, eliminamos politicas si ya existen para recrearlas simple
DO $$
BEGIN
    DROP POLICY IF EXISTS "Todo usuario autenticado" ON public.depositos;
    DROP POLICY IF EXISTS "Todo usuario autenticado" ON public.productos;
    DROP POLICY IF EXISTS "Todo usuario autenticado" ON public.etiquetas;
    DROP POLICY IF EXISTS "Todo usuario autenticado" ON public.movimientos;
    DROP POLICY IF EXISTS "Todo usuario autenticado" ON public.solicitudes;
END $$;

CREATE POLICY "Todo usuario autenticado" ON public.depositos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Todo usuario autenticado" ON public.productos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Todo usuario autenticado" ON public.etiquetas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Todo usuario autenticado" ON public.movimientos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Todo usuario autenticado" ON public.solicitudes FOR ALL USING (auth.role() = 'authenticated');

-- SEED DATA DE INYECCION
INSERT INTO public.depositos (nombre, tipo) VALUES
('Almacén Central', 'general'),
('Operaciones Móviles', 'general'),
('Mesa de Corte 1', 'operativo'),
('Ensamblaje A', 'operativo')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.productos (sku, nombre, categoria, unidad, es_agrupable, costo) VALUES
('TELA-ALG', 'Rollo Algodón Blanco', 'Materia Prima', 'mt', false, 1500),
('TINTA-CYAN', 'Pack 12 Tintas Cyan', 'Insumos', 'ud', true, 12000),
('AGUJ-IND', 'Caja Agujas Industriales', 'Herramientas', 'caja', true, 5000)
ON CONFLICT (sku) DO NOTHING;
