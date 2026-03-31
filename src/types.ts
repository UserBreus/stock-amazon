export type UserRole = 'admin' | 'operario' | 'operario_stock';

export interface UserProfile {
  id: string;
  email: string;
  rol: UserRole;
  fecha_creacion?: string;
}

export interface Deposito {
  id: string;
  nombre: string;
  tipo: 'general' | 'operativo';
  fecha_creacion: string;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidad: string;
  es_agrupable: boolean;
  costo: number;
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
