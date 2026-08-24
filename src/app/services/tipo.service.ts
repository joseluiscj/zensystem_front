import { Injectable } from '@angular/core';
import { Tipo } from '../../model/tipo';
import { GenericService } from './generic.service';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class TipoService  extends GenericService<Tipo> {
  private dataChange: Subject<Tipo[]> = new Subject<Tipo[]>();

  constructor(protected override http:HttpClient) { 
    super(http, `${environment.HOST}/tipo`);
  }
  
  setDataChange(data :Tipo[]){ 
    this.dataChange.next(data)
  }

  getDataChange(){
    return this.dataChange.asObservable();
  }

}
