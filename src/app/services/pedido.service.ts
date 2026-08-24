import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { Pedido } from '../../model/pedido';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PedidoService extends GenericService<Pedido> {
  private dataChange: Subject<Pedido[]> = new Subject<Pedido[]>();

  constructor(protected override http:HttpClient) { 
    super(http, `${environment.HOST}/pedido`);
  }

  setDataChange(data :Pedido[]){ 
    this.dataChange.next(data)
  }

  getDataChange(){
    return this.dataChange.asObservable();
  }

  listMesas(){
    return this.http.post<any>(`${this.url}/listMesas`,[] );
  }

  
}
