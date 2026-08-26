import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class GlobalService extends GenericService<any>  {
  private sedeChange: Subject<any[]> = new Subject<any[]>();

  constructor(protected override http:HttpClient) { 
    super(http, `${environment.HOST}/global`);
  }

  getCboDialog(){
    return this.http.get<any>(`${this.url}/getCboDialog`, );
  }

  // getCboDelito(){
  //   return this.http.get<any>(`${this.url}/cbodetencion`, );
  // }
  
  // getUser(){
  //   return this.http.get<any>(`${this.url}/getUser`, );
  // }
  getCategoriaByTipo(id: number){
    return this.http.get<any>(`${this.url}/categoriaByTipo/${id}`);
  }
  getCategoria(){
    return this.http.get<any>(`${this.url}/getCategoria`);
  }
  listSucursal(){
    return this.http.get<any>(`${this.url}/listSucursal`);
  }



}
