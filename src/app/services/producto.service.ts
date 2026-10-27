import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { Producto } from '../../model/producto';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ProductoService extends GenericService<Producto> {
  private dataChange: Subject<Producto[]> = new Subject<Producto[]>();

  constructor(protected override http:HttpClient) { 
    super(http, `${environment.HOST}/producto`);
  }

  setDataChange(data :Producto[]){ 
    this.dataChange.next(data)
  }

  getDataChange(){
    return this.dataChange.asObservable();
  }

  list(data?: any) {
    return this.findAllList(data);
  }

  saveFile(obj :FormData){
    return this.http.post<any>(`${this.url}/saveFile`, obj );
  }
  cambioEstado(data: any) {
    return this.http.post<any>(`${this.url}/cambioEstado`,data );
  }
  productoCbo(data: any) {
    return this.http.post<any>(`${this.url}/productoCbo`, data);
  }
  productoInfo(data: any) {
    return this.http.post<any>(`${this.url}/productoInfo`, data);
  }
  
}
