export type UserRole = 'admin' | 'administrador' | 'gerente_stock' | 'administrativo_stock' | 'operario' | 'operario_stock' | 'atencion';

export interface UserProfile {
  id: string;
  email: string;
  nombre_completo?: string;
  rol: UserRole;
  fecha_creacion?: string;
}

export interface Deposito {
  id: string;
  nombre: string;
  tipo: 'general' | 'operativo';
  fecha_creacion: string;
}

export interface TipoProducto {
  id: string;
  nombre: string;
  fecha_creacion: string;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string; // Deprecated, will be removed later
  tipo_id: string;
  moneda: 'USD' | 'UYU';
  unidad: string;
  es_agrupable: boolean;
  costo: number;
  // JOIN
  tipos_producto?: TipoProducto;
}

export interface Etiqueta {
  id: string;
  codigo_barras: string;
  producto_id: string;
  deposito_id: string;
  cantidad_actual: number;
  estado: 'activo' | 'agotado' | 'cuarentena';
  fecha_creacion: string;
  // Campos extraídos vía JOIN
  productos?: Producto;
  depositos?: Deposito;
}

export interface Solicitud {
  id: string;
  deposito_id: string;
  producto_id: string;
  cantidad_solicitada: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  usuario_id: string;
  fecha_creacion: string;
  // Campos extraídos vía JOIN
  productos?: Producto;
  depositos?: Deposito;
}

export interface OperationLog {
  id: string;
  fecha_creacion: string;
  usuario_id: string;
  accion: string;
  detalles: string;
}

export interface ReportItem {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  creado_por: string;
  fecha_creacion: string;
}

export interface ImportacionProveedor {
  id: string;
  importacion_id: string;
  nombre_proveedor: string;
  ciudad_origen: string;
  fecha_creacion: string;
}

export interface ImportacionEvento {
  id: string;
  importacion_id: string;
  ubicacion: string;
  anotacion: string;
  usuario: string;
  fecha_evento: string;
}

export interface Importacion {
  id: string;
  puerto_origen: string;
  puerto_destino: string;
  fecha_compra: string;
  fecha_prometida: string;
  fecha_arribo_puerto: string | null;
  fecha_llegada_deposito: string | null;
  estado: string;
  tipo: 'ocean' | 'air' | 'road';
  transportista: string;
  progreso: number;
  usuario_id: string | null;
  fecha_creacion: string;
  // Joins
  importacion_proveedores?: ImportacionProveedor[];
  importacion_eventos?: ImportacionEvento[];
}
