export interface ProductoStockBajo {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  costo: number;
  stockMinimo: number;
  controlStock: number;
  unidadMedida: string;
  stock: number;
  categoria: string;
  imgId: string;
  nivelAlerta: 'AGOTADO' | 'CRITICO';
  deficit: number;
}

export interface NotificacionTotales {
  totalNotificaciones: number;
  totalStockBajo: number;
}

export interface NotificacionData {
  rol?: string;
  totales: NotificacionTotales;
  stockBajo: ProductoStockBajo[];
}

export interface NotificacionResponse {
  code: number;
  data: NotificacionData;
  message?: string;
}
