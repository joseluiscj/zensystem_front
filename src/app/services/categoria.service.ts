import { Injectable } from '@angular/core';
import { Categoria } from '../../model/categoria';
import { GenericService } from './generic.service';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService extends GenericService<Categoria> {
  private dataChange: Subject<Categoria[]> = new Subject<Categoria[]>();

  constructor(protected override http:HttpClient) { 
    super(http, `${environment.HOST}/categoria`);
  }

  setDataChange(data :Categoria[]){ 
    this.dataChange.next(data)
  }

  getDataChange(){
    return this.dataChange.asObservable();
  }

  deleteCategoria(data: any) {
    return this.http.post<any>(`${this.url}/cambioEstado`,data );
  }

}
