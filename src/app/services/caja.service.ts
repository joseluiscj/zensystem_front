import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Subject } from 'rxjs';
import { Caja } from '../../model/caja';

// export interface Caja {
//   id?: number;
//   user_id?: number;
//   estado?: string;
//   monto_inicial?: number;
//   monto_cierre?: number;
//   opened_at?: string;
//   closed_at?: string;
// }

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
}
