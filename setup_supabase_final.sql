-- CREACIÓN DE TABLAS EN ESPAÑOL PARA NEXUS LOGISTICS

-- Limpieza de esquema antiguo en inglés (opcional, en caso de estar en la misma base de datos)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;

-- Extensión para IDs únicos automáticos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios (roles_usuario)
CREATE TABLE public.roles_usuario (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL DEFAULT 'operario', -- Puede ser 'admin', 'operario_stock', 'operario'
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurando que la tabla puede ser consultada por usuarios logueados
ALTER TABLE public.roles_usuario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios pueden ver todos los roles" ON public.roles_usuario
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuarios pueden autoconfigurarse" ON public.roles_usuario
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Tabla de Inventario
CREATE TABLE public.inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    cantidad NUMERIC NOT NULL DEFAULT 0,
    unidad TEXT NOT NULL DEFAULT 'Kg',
    costo NUMERIC NOT NULL DEFAULT 0,
    ubicacion TEXT,
    categoria TEXT DEFAULT 'General',
    estado TEXT NOT NULL DEFAULT 'optimo', -- optimo, reorden, critico
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cualquier usuario autenticado puede ver el inventario" ON public.inventario
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Cualquier usuario autenticado puede modificar el inventario" ON public.inventario
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Tabla de Logs (Registros)
CREATE TABLE public.registros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accion TEXT NOT NULL,
    detalles TEXT,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados pueden ver y crear registros" ON public.registros
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Tabla de Reportes
CREATE TABLE public.reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    prioridad TEXT NOT NULL DEFAULT 'Media',
    creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados pueden gestionar sus reportes" ON public.reportes
    FOR ALL USING (auth.role() = 'authenticated');

-- Triggers automáticos para mantener estado sincronizado con la cantidad:
CREATE OR REPLACE FUNCTION actualizar_estado_inventario()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cantidad > 100 THEN
    NEW.estado = 'optimo';
  ELSIF NEW.cantidad > 20 THEN
    NEW.estado = 'reorden';
  ELSE
    NEW.estado = 'critico';
  END IF;
  NEW.ultima_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_estado_inventario
BEFORE INSERT OR UPDATE ON public.inventario
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_inventario();

-- Trigger automático para crear usuario al registrarse en Supabase Auth
CREATE OR REPLACE FUNCTION auto_crear_rol_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.roles_usuario (id, email, rol)
  VALUES (
    NEW.id,
    NEW.email,
    -- Le asignamos 'admin' al usuario user@nexus.com automáticamente o a tu propio correo, el resto será 'operario'
    CASE 
      WHEN NEW.email = 'user@nexus.com' THEN 'admin'
      ELSE 'operario'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- El trigger se dispara cada vez que se crea un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE auto_crear_rol_usuario();

-- 5. Tabla de Importaciones
CREATE TABLE public.importaciones (
    id TEXT PRIMARY KEY,
    origen TEXT NOT NULL,
    destino TEXT NOT NULL,
    eta TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Planificado',
    tipo TEXT NOT NULL DEFAULT 'ocean',
    transportista TEXT NOT NULL,
    progreso NUMERIC NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.importaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados ven importaciones" ON public.importaciones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins gestionan importaciones" ON public.importaciones FOR ALL USING (auth.role() = 'authenticated');

-- 6. Tabla de Proveedores (Analisis)
CREATE TABLE public.proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    sla NUMERIC NOT NULL DEFAULT 0,
    costo NUMERIC NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados ven proveedores" ON public.proveedores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins gestionan proveedores" ON public.proveedores FOR ALL USING (auth.role() = 'authenticated');

-- 7. Tabla Dashboard Metricas
CREATE TABLE public.dashboard_metricas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mes TEXT UNIQUE NOT NULL,
    envios NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.dashboard_metricas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autenticados ven metricas" ON public.dashboard_metricas FOR SELECT USING (auth.role() = 'authenticated');

-- ==========================================
-- SEED DATA (DATOS INICIALES DE PRUEBA)
-- ==========================================
INSERT INTO public.importaciones (id, origen, destino, eta, estado, tipo, transportista, progreso) VALUES
('SHP-1240', 'Shanghai, CN', 'Valparaíso, CL', '2026-04-12', 'En Tránsito', 'ocean', 'Oceanic Alliance', 65),
('SHP-1245', 'Miami, US', 'Santiago, CL', '2026-03-31', 'Aduana', 'air', 'AirExpress', 90),
('SHP-1249', 'Hamburg, DE', 'San Antonio, CL', '2026-05-02', 'Planificado', 'ocean', 'Global Logistics', 10),
('SHP-1250', 'São Paulo, BR', 'Santiago, CL', '2026-04-05', 'En Tránsito', 'road', 'FastTrack', 45)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.proveedores (nombre, sla, costo) VALUES
('Global Logistics', 85, 60),
('FastTrack', 70, 90),
('Oceanic All.', 40, 55),
('AirExpress', 95, 40)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.dashboard_metricas (mes, envios) VALUES
('Ene', 400), ('Feb', 300), ('Mar', 550), ('Abr', 480), ('May', 600), ('Jun', 750)
ON CONFLICT (mes) DO NOTHING;

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
