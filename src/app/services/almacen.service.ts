import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface StockAlmacenDetalle {
  idProducto: number;
  idAlmacen: number;
  almacen_nombre: string;
  almacen_codigo: string;
  stock: number;
  stockMinimo: number;
  ubicacion: string;
}

export interface ProductoAlmacen {
  idProducto: number;
  idCategoria: number;
  categoria_nombre: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  imgId?: string;
  precio: number;
  costo: number;
  stock: number;
  stockMinimo: number;
  unidadMedida: string;
  ubicacion: string;
  valor_total: number;
  estado_stock: 'normal' | 'bajo' | 'agotado';
  stocks_almacenes?: StockAlmacenDetalle[];
}

export interface ResumenAlmacenKpi {
  idAlmacen: number;
  almacen_nombre: string;
  almacen_codigo: string;
  totalProductos: number;
  totalUnidades: number;
  valorTotal: number;
}

export interface KpisAlmacen {
  totalProductos: number;
  valorTotalInventario: number;
  totalUnidadesStock: number;
  totalAgotados: number;
  totalStockBajo: number;
  totalStockNormal: number;
  resumenPorAlmacen?: ResumenAlmacenKpi[];
}

export interface MovimientoAlmacen {
  idMovimiento: number;
  idAlmacen: number;
  almacen_nombre: string;
  idProducto: number;
  producto_nombre: string;
  producto_codigo: string;
  unidadMedida: string;
  tipo: 'E' | 'S' | 'A';
  motivo: string;
  cantidad: number;
  costoUnitario: number;
  stockAnterior: number;
  stockActual: number;
  documento: string;
  observacion: string;
  usuario_nombre: string;
  created_at: string;
}

export interface AlmacenItem {
  idAlmacen: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  responsable: string;
  ubicacion: string;
  productosConStock: number;
  unidadesTotales: number;
  valorTotal: number;
  created_at?: string;
}

export interface RespuestaAlmacen {
  code: number;
  data: ProductoAlmacen[];
  kpis: KpisAlmacen;
  catalogos: {
    categorias: { id: number; f_nombre: string }[];
    almacenes: { id: number; nombre: string; codigo: string; responsable: string; ubicacion?: string; descripcion?: string }[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AlmacenService {
  private baseUrl = `${environment.HOST}/almacen`;

  constructor(private http: HttpClient) {}

  getProductos(filtros: { search?: string; idCategoria?: string | number; estadoStock?: string; idAlmacen?: string | number } = {}): Observable<RespuestaAlmacen> {
    let params = new HttpParams();
    if (filtros.search) {
      params = params.set('search', filtros.search);
    }
    if (filtros.idCategoria && filtros.idCategoria !== 'todos') {
      params = params.set('idCategoria', filtros.idCategoria.toString());
    }
    if (filtros.estadoStock && filtros.estadoStock !== 'todos') {
      params = params.set('estadoStock', filtros.estadoStock);
    }
    if (filtros.idAlmacen && filtros.idAlmacen !== 'todos') {
      params = params.set('idAlmacen', filtros.idAlmacen.toString());
    }

    return this.http.get<RespuestaAlmacen>(`${this.baseUrl}/productos`, { params });
  }

  getAlmacenes(): Observable<{ code: number; data: AlmacenItem[] }> {
    return this.http.get<{ code: number; data: AlmacenItem[] }>(`${this.baseUrl}/almacenes`);
  }

  guardarAlmacen(payload: {
    idAlmacen?: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
    responsable?: string;
    ubicacion?: string;
  }): Observable<{ code: number; message: string; data?: any }> {
    return this.http.post<{ code: number; message: string; data?: any }>(`${this.baseUrl}/almacen`, payload);
  }

  realizarTraspaso(payload: {
    idProducto: number;
    idAlmacenOrigen: number;
    idAlmacenDestino: number;
    cantidad: number;
    motivo?: string;
    observacion?: string;
  }): Observable<{ code: number; message: string; data?: any }> {
    return this.http.post<{ code: number; message: string; data?: any }>(`${this.baseUrl}/traspaso`, payload);
  }

  getMovimientos(filtros: { idProducto?: string | number; idAlmacen?: string | number; tipo?: string; fechaInicio?: string; fechaFin?: string } = {}): Observable<{ code: number; data: MovimientoAlmacen[] }> {
    let params = new HttpParams();
    if (filtros.idProducto && filtros.idProducto !== 'todos') {
      params = params.set('idProducto', filtros.idProducto.toString());
    }
    if (filtros.idAlmacen && filtros.idAlmacen !== 'todos') {
      params = params.set('idAlmacen', filtros.idAlmacen.toString());
    }
    if (filtros.tipo && filtros.tipo !== 'todos') {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get<{ code: number; data: MovimientoAlmacen[] }>(`${this.baseUrl}/movimientos`, { params });
  }

  registrarMovimiento(payload: {
    idAlmacen: number;
    idProducto: number;
    tipo: 'E' | 'S' | 'A';
    cantidad: number;
    costoUnitario?: number;
    motivo: string;
    documento?: string;
    observacion?: string;
  }): Observable<{ code: number; message: string; data?: any }> {
    return this.http.post<{ code: number; message: string; data?: any }>(`${this.baseUrl}/movimiento`, payload);
  }

  actualizarParametros(id: number, payload: {
    codigo?: string;
    stockMinimo?: number;
    costo?: number;
    unidadMedida?: string;
    ubicacion?: string;
  }): Observable<{ code: number; message: string; data?: any }> {
    return this.http.put<{ code: number; message: string; data?: any }>(`${this.baseUrl}/producto/${id}`, payload);
  }
}
