import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { Inicio } from '../../model/inicio';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DashboardData } from '../../model/dashboard';

@Injectable({
  providedIn: 'root'
})
export class InicioService extends GenericService<Inicio> {
  private inicioChange: Subject<Inicio[]> = new Subject<Inicio[]>();

  constructor(protected override http: HttpClient) { 
    super(http, `${environment.HOST}/inicio`);
  }

  setInicioChange(data: Inicio[]) {
    this.inicioChange.next(data);
  }

  getInicioChange() {
    return this.inicioChange.asObservable();
  }

  getResumenDashboard(fechaInicio?: string, fechaFin?: string): Observable<{ code: number; data: DashboardData }> {
    let params = new HttpParams();
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }
    return this.http.get<{ code: number; data: DashboardData }>(`${environment.HOST}/dashboard/resumen`, { params });
  }
}
