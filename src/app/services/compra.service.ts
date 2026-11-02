import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface CompraItem {
  idCompra: number;
  codigo: string;
  proveedorNombre: string;
  proveedorDocumento: string;
  tipoComprobante: string;
  nroComprobante: string;
  fechaCompra: string;
  idAlmacen: number;
  almacenNombre: string;
  idCaja: number | null;
  cajaNombre: string;
  metodoPago: string;
  nroOperacion: string;
  montoSubtotal: number;
  montoIgv: number;
  montoTotal: number;
  observaciones: string;
  estado: 'REGISTRADO' | 'ANULADO';
  usuarioNombre: string;
  totalItems: number;
  totalUnidades: number;
  created_at: string;
}

export interface CompraDetalleItem {
  idCompraDetalle: number;
  idProducto: number;
  productoCodigo: string;
  productoNombre: string;
  unidadMedida: string;
  categoriaNombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  actualizarCostoProducto: number;
}

export interface KpisCompra {
  totalCompras: number;
  montoTotal: number;
  totalUnidades: number;
  comprasActivas: number;
  comprasAnuladas: number;
}

export interface AlmacenCatalogo {
  idAlmacen: number;
  nombre: string;
  codigo: string;
  esPrincipal: number;
}

export interface CajaCatalogo {
  idCaja: number;
  nombre: string;
  saldo: number;
  moneda: string;
  principal: number;
  state: string;
}

export interface ProductoCatalogo {
  idProducto: number;
  codigo: string;
  nombre: string;
  costo: number;
  precio: number;
  stock: number;
  controlStock: number;
  unidadMedida: string;
  categoria: string;
}

export interface CatalogoApoyoCompra {
  almacenes: AlmacenCatalogo[];
  cajas: CajaCatalogo[];
  productos: ProductoCatalogo[];
  proximoCodigo: string;
}

export interface GuardarCompraPayload {
  proveedorNombre: string;
  proveedorDocumento?: string;
  tipoComprobante: string;
  nroComprobante?: string;
  fechaCompra: string;
  idAlmacen: number;
  idCaja?: number | null;
  metodoPago: string;
  nroOperacion?: string;
  observaciones?: string;
  detalles: {
    idProducto: number;
    cantidad: number;
    costoUnitario: number;
    actualizarCostoProducto?: boolean;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private baseUrl = `${environment.HOST}/compra`;

  constructor(private http: HttpClient) {}

  getCompras(filtros: {
    fechaInicio?: string;
    fechaFin?: string;
    idAlmacen?: string | number;
    estado?: string;
    metodoPago?: string;
    search?: string;
  } = {}): Observable<{ code: number; data: CompraItem[]; kpis: KpisCompra }> {
    let params = new HttpParams();

    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    if (filtros.idAlmacen && filtros.idAlmacen !== 'todos') params = params.set('idAlmacen', filtros.idAlmacen.toString());
    if (filtros.estado && filtros.estado !== 'todos') params = params.set('estado', filtros.estado);
    if (filtros.metodoPago && filtros.metodoPago !== 'todos') params = params.set('metodoPago', filtros.metodoPago);
    if (filtros.search) params = params.set('search', filtros.search.trim());

    return this.http.get<{ code: number; data: CompraItem[]; kpis: KpisCompra }>(this.baseUrl, { params });
  }

  getCatalogoApoyo(): Observable<{ code: number; data: CatalogoApoyoCompra }> {
    return this.http.get<{ code: number; data: CatalogoApoyoCompra }>(`${this.baseUrl}/catalogo-apoyo`);
  }

  getCompra(id: number): Observable<{ code: number; data: { compra: CompraItem; detalles: CompraDetalleItem[] } }> {
    return this.http.get<{ code: number; data: { compra: CompraItem; detalles: CompraDetalleItem[] } }>(`${this.baseUrl}/${id}`);
  }

  guardarCompra(payload: GuardarCompraPayload): Observable<{ code: number; message: string; data?: any }> {
    return this.http.post<{ code: number; message: string; data?: any }>(this.baseUrl, payload);
  }

  anularCompra(id: number): Observable<{ code: number; message: string }> {
    return this.http.post<{ code: number; message: string }>(`${this.baseUrl}/${id}/anular`, {});
  }
}
