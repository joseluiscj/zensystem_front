import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Mesa } from '../../model/mesa';

@Injectable({
  providedIn: 'root'
})
export class MesaService extends GenericService<Mesa> {
  private dataChange: Subject<Mesa[]> = new Subject<Mesa[]>();

  constructor(protected override http:HttpClient) { 
    super(http, `${environment.HOST}/mesa`);
  }

  setDataChange(data :Mesa[]){ 
    this.dataChange.next(data)
  }

  getDataChange(){
    return this.dataChange.asObservable();
  }

  listMesas(){
    return this.http.post<any>(`${this.url}/listMesas`,[] );
  }
  deleteMesa(data: any) {
    return this.http.post<any>(`${this.url}/deleteMesa`,data );
  }
  findByIdDetail(id:number){
    return this.http.get<any>(`${this.url}/findByIdDetail/${id}`);
  }
  liberar(data: any) {
    return this.http.post<any>(`${this.url}/liberar`,data );
  }
  anular(data: any) {
    return this.http.post<any>(`${this.url}/anular`,data );
  }
}
