DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auto_crear_rol_usuario();

ALTER TABLE public.depositos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS public.roles_usuario CASCADE;

CREATE TABLE public.roles_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'operario',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.roles_usuario (usuario, password, rol) VALUES ('user', 'vilardebo2031', 'admin');

ALTER TABLE public.movimientos DROP CONSTRAINT IF EXISTS movimientos_usuario_id_fkey;
ALTER TABLE public.movimientos ADD CONSTRAINT movimientos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.roles_usuario(id) ON DELETE SET NULL;

ALTER TABLE public.solicitudes DROP CONSTRAINT IF EXISTS solicitudes_usuario_id_fkey;
ALTER TABLE public.solicitudes ADD CONSTRAINT solicitudes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.roles_usuario(id) ON DELETE SET NULL;

ALTER TABLE public.registros DROP CONSTRAINT IF EXISTS registros_usuario_id_fkey;
ALTER TABLE public.registros ADD CONSTRAINT registros_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.roles_usuario(id) ON DELETE SET NULL;

ALTER TABLE public.reportes DROP CONSTRAINT IF EXISTS reportes_creado_por_fkey;
ALTER TABLE public.reportes ADD CONSTRAINT reportes_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.roles_usuario(id) ON DELETE SET NULL;

