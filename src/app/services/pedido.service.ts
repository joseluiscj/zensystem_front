import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { Pedido } from '../../model/pedido';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

export interface ResumenVentas {
  totalVentas: number;
  totalPedidos: number;
  totalAtendidos: number;
  totalPendientes: number;
}

export interface VentaItem {
  idPedido: number;
  idMesa: number;
  mesa_nombre: string;
  nombreCliente: string;
  pagoCon: string;
  idCaja: number;
  caja_nombre: string;
  idCajero: number;
  cajero_nombre: string;
  montoTotal: string | number;
  montoEfectivo: string | number;
  montoVuelto: string | number;
  state: number;
  created_at: string;
  updated_at: string;
  items_count: number;
  resumen_productos: string;
}

export interface PedidoCompletoResponse {
  code: number;
  data: any;
  detalle: any[];
  cajas: any[];
  cajeros: any[];
  mesas: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService extends GenericService<Pedido> {
  private dataChange: Subject<Pedido[]> = new Subject<Pedido[]>();

  constructor(protected override http: HttpClient) { 
    super(http, `${environment.HOST}/pedido`);
  }

  setDataChange(data: Pedido[]) { 
    this.dataChange.next(data);
  }

  getDataChange() {
    return this.dataChange.asObservable();
  }

  listMesas() {
    return this.http.post<any>(`${this.url}/listMesas`, []);
  }

  listarVentas(filtros?: {
    fechaInicio?: string;
    fechaFin?: string;
    state?: string | number;
    pagoCon?: string;
    idMesa?: string | number;
    search?: string;
  }): Observable<{ code: number; data: VentaItem[]; resumen: ResumenVentas }> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
      if (filtros.state !== undefined && filtros.state !== null && filtros.state !== '') {
        params = params.set('state', String(filtros.state));
      }
      if (filtros.pagoCon) params = params.set('pagoCon', filtros.pagoCon);
      if (filtros.idMesa) params = params.set('idMesa', String(filtros.idMesa));
      if (filtros.search) params = params.set('search', filtros.search);
    }
    return this.http.get<{ code: number; data: VentaItem[]; resumen: ResumenVentas }>(this.url, { params });
  }

  obtenerPedidoCompleto(id: number): Observable<PedidoCompletoResponse> {
    return this.http.get<PedidoCompletoResponse>(`${this.url}/${id}`);
  }

  anularPedido(id: number): Observable<{ code: number; message: string }> {
    return this.http.delete<{ code: number; message: string }>(`${this.url}/${id}`);
  }
}
