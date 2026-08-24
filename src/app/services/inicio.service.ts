import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { Inicio } from '../../model/inicio';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InicioService extends GenericService<Inicio> {
  private inicioChange: Subject<Inicio[]> = new Subject<Inicio[]>();

  constructor(protected override http:HttpClient) { 
    super(http, `${environment.HOST}/inicio`);
  }

  setInicioChange(data :Inicio[]){
    this.inicioChange.next(data)
  }

  getInicioChange(){
    return this.inicioChange.asObservable();
  }


}
