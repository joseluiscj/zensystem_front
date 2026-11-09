import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface KpisDinero {
  totalVentas: number;
  cantidadVentas: number;
  totalCompras: number;
  cantidadCompras: number;
  otrosIngresos: number;
  otrosEgresos: number;
  totalAperturas?: number;
  totalIngresos: number;
  totalEgresos: number;
  balanceNeto: number;
}

export interface FlujoDiarioItem {
  fecha_dia: string;
  ventas: number;
  compras: number;
  otros_ingresos: number;
  otros_egresos: number;
  neto_dia: number;
}

export interface FlujoMensualItem {
  mes_anio: string;
  ventas: number;
  compras: number;
  otros_ingresos: number;
  otros_egresos: number;
  total_ingresos: number;
  total_egresos: number;
  neto_mes: number;
}

export interface TransaccionMonetariaItem {
  fecha: string;
  concepto: string;
  flujo: 'INGRESO' | 'EGRESO';
  documento: string;
  entidad: string;
  metodo_pago: string;
  caja_nombre: string;
  monto: number;
}

export interface ReporteDineroData {
  kpis: KpisDinero;
  metodosPago: {
    ventas: {
      efectivo: number;
      tarjeta: number;
      otros: number;
    };
    compras: {
      efectivo: number;
      tarjeta: number;
      transferencia: number;
      credito: number;
    };
    consolidado: {
      efectivoTotal: number;
      tarjetaTotal: number;
      transferenciaTotal: number;
    };
  };
  flujoDiario: FlujoDiarioItem[];
  flujoMensual?: FlujoMensualItem[];
  transacciones: TransaccionMonetariaItem[];
  catalogos: {
    cajas: Array<{ idCaja: number; nombre: string }>;
  };
}

export interface KpisProductos {
  totalUnidadesVendidas: number;
  totalRecaudado: number;
  productoMasVendido: string;
  unidadesMasVendido: number;
  categoriaLider: string;
  valorCostoInventario: number;
  valorVentaInventario: number;
  productosBajoStock: number;
  productosAgotados: number;
  totalProductosCatalogo: number;
}

export interface RankingProductoItem {
  idProducto: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  costo: number;
  stock: number;
  stockMinimo: number;
  controlStock: number;
  total_unidades: number;
  total_recaudado: number;
  ganancia_estimada: number;
  porcentaje_participacion: number;
}

export interface VentasCategoriaItem {
  categoria: string;
  total_unidades: number;
  total_recaudado: number;
  porcentaje: number;
}

export interface ProductoCriticoItem {
  idProducto: number;
  codigo: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  costo: number;
  precio: number;
  nivel_alerta: 'AGOTADO' | 'BAJO';
}

export interface ReporteProductosData {
  kpis: KpisProductos;
  ranking: RankingProductoItem[];
  ventasPorCategoria: VentasCategoriaItem[];
  productosCriticos: ProductoCriticoItem[];
  catalogos: {
    categorias: Array<{ id: number; f_nombre: string }>;
    almacenes: Array<{ id: number; nombre: string; codigo: string }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private url = `${environment.HOST}/reporte`;

  constructor(private http: HttpClient) {}

  getReporteDinero(filtros: {
    fechaInicio?: string;
    fechaFin?: string;
    idCaja?: string;
  }): Observable<{ code: number; data: ReporteDineroData }> {
    let params = new HttpParams();
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    if (filtros.idCaja && filtros.idCaja !== 'todos') params = params.set('idCaja', filtros.idCaja);

    return this.http.get<{ code: number; data: ReporteDineroData }>(`${this.url}/dinero`, { params });
  }

  getReporteProductos(filtros: {
    fechaInicio?: string;
    fechaFin?: string;
    idCategoria?: string;
    idAlmacen?: string;
  }): Observable<{ code: number; data: ReporteProductosData }> {
    let params = new HttpParams();
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    if (filtros.idCategoria && filtros.idCategoria !== 'todos') params = params.set('idCategoria', filtros.idCategoria);
    if (filtros.idAlmacen && filtros.idAlmacen !== 'todos') params = params.set('idAlmacen', filtros.idAlmacen);

    return this.http.get<{ code: number; data: ReporteProductosData }>(`${this.url}/productos`, { params });
  }
}
