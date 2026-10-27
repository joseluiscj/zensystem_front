import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface CajaMovimientoItem {
  idCajaMovimiento: number;
  idCaja: number;
  caja_nombre: string;
  caja_moneda: string;
  idCajaDetalle?: number;
  tipo: 'I' | 'E';
  monto: number;
  descripcion: string;
  categoria: string;
  beneficiario: string;
  tipoComprobante: string;
  nroComprobante: string;
  metodoPago: string;
  fecha: string;
  active: number;
  status: number;
  usuario_nombre: string;
  created_at: string;
}

export interface KpisCajaMovimiento {
  totalIngresos: number;
  totalEgresos: number;
  balanceNeto: number;
  totalMovimientos: number;
  saldoTotalCajas: number;
}

export interface CajaCatalogo {
  id: number;
  nombre: string;
  saldo: number;
  moneda: string;
  state: string;
}

export interface RespuestaCajaMovimiento {
  code: number;
  data: CajaMovimientoItem[];
  kpis: KpisCajaMovimiento;
  catalogos: {
    cajas: CajaCatalogo[];
    categoriasGastos: string[];
    categoriasIngresos: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class CajaMovimientoService {
  private baseUrl = `${environment.HOST}/caja-movimientos`;

  constructor(private http: HttpClient) {}

  getMovimientos(filtros: {
    tipo?: string;
    idCaja?: string | number;
    metodoPago?: string;
    categoria?: string;
    search?: string;
    fechaInicio?: string;
    fechaFin?: string;
  } = {}): Observable<RespuestaCajaMovimiento> {
    let params = new HttpParams();

    if (filtros.tipo && filtros.tipo !== 'todos') {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros.idCaja && filtros.idCaja !== 'todos') {
      params = params.set('idCaja', filtros.idCaja.toString());
    }
    if (filtros.metodoPago && filtros.metodoPago !== 'todos') {
      params = params.set('metodoPago', filtros.metodoPago);
    }
    if (filtros.categoria && filtros.categoria !== 'todos') {
      params = params.set('categoria', filtros.categoria);
    }
    if (filtros.search) {
      params = params.set('search', filtros.search);
    }
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get<RespuestaCajaMovimiento>(this.baseUrl, { params });
  }

  registrarMovimiento(payload: {
    idCaja: number;
    tipo: 'I' | 'E';
    monto: number;
    descripcion: string;
    categoria?: string;
    beneficiario?: string;
    tipoComprobante?: string;
    nroComprobante?: string;
    metodoPago: string;
    fecha?: string;
  }): Observable<{ code: number; message: string; data?: any }> {
    return this.http.post<{ code: number; message: string; data?: any }>(this.baseUrl, payload);
  }

  anularMovimiento(id: number): Observable<{ code: number; message: string }> {
    return this.http.post<{ code: number; message: string }>(`${this.baseUrl}/${id}/anular`, {});
  }

  getDetalle(id: number): Observable<{ code: number; data: CajaMovimientoItem }> {
    return this.http.get<{ code: number; data: CajaMovimientoItem }>(`${this.baseUrl}/${id}`);
  }
}
