import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable, Subject } from 'rxjs';
import { CajaDetalle } from '../../model/cajaDetalle';
import { CajaMovimiento } from '../../model/cajaMovimiento';

@Injectable({
  providedIn: 'root'
})
export class AperturaCajaService {
  private url = `${environment.HOST}/apertura-caja`;
  private dataChange = new Subject<CajaDetalle[]>();

  constructor(private http: HttpClient) {}

  setDataChange(data: CajaDetalle[]) {
    this.dataChange.next(data);
  }

  getDataChange(): Observable<CajaDetalle[]> {
    return this.dataChange.asObservable();
  }

  list(filters?: any): Observable<CajaDetalle[]> {
    return this.http.post<CajaDetalle[]>(`${this.url}/list`, filters || {});
  }

  getCajasDisponibles(): Observable<{code: number, data: any[]}> {
    return this.http.get<{code: number, data: any[]}>(`${this.url}/cajas-disponibles`);
  }

  aperturar(data: {idCaja: number, aMonto: number}): Observable<{code: number, message?: string, data?: any}> {
    return this.http.post<{code: number, message?: string, data?: any}>(`${this.url}/aperturar`, data);
  }

  cerrar(data: {idCajaDetalle: number, cMonto: number}): Observable<{code: number, message?: string}> {
    return this.http.post<{code: number, message?: string}>(`${this.url}/cerrar`, data);
  }

  getResumen(idCajaDetalle: number): Observable<{code: number, data: any, message?: string}> {
    return this.http.get<{code: number, data: any, message?: string}>(`${this.url}/resumen/${idCajaDetalle}`);
  }

  getMovimientos(idCajaDetalle: number): Observable<{code: number, data: CajaMovimiento[], message?: string}> {
    return this.http.get<{code: number, data: CajaMovimiento[], message?: string}>(`${this.url}/movimientos/${idCajaDetalle}`);
  }

  registrarMovimiento(data: {
    idCajaDetalle: number,
    tipo: 'I' | 'E',
    monto: number,
    descripcion: string,
    metodoPago: string
  }): Observable<{code: number, message?: string}> {
    return this.http.post<{code: number, message?: string}>(`${this.url}/movimiento`, data);
  }
}
