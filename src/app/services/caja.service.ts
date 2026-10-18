import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Subject } from 'rxjs';
import { Caja } from '../../model/caja';

@Injectable({
  providedIn: 'root'
})
export class CajaService extends GenericService<Caja> {
    private dataChange: Subject<Caja[]> = new Subject<Caja[]>();
  
  constructor(protected override http: HttpClient) {
    super(http, `${environment.HOST}/caja`);
  }
  setDataChange(data :Caja[]){ 
    this.dataChange.next(data)
  }

  getDataChange(){
    return this.dataChange.asObservable();
  }

  // Apertura ya usa save de GenericService
  close(id: number, monto_cierre: number){
    return this.http.post(`${this.url}/${id}/close`, { monto_cierre });
  }
  listCbo(){
    return this.http.post(`${this.url}/listCbo`,[]);
  }

  deleteCaja(id: number){
    return this.http.post<{code: number, message?: string}>(`${this.url}/deleteCaja`, { id });
  }

}
