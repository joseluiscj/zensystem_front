import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { User } from '../../model/user';
// import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class UserService extends GenericService<User> {
  private userChange: Subject<User[]> = new Subject<User[]>();

  constructor(protected override http:HttpClient) { 
    super(http, `${environment.HOST}/users`);
  }

  setUserChange(data: User[]){
    this.userChange.next(data);
  }

  getUserChange(){
    return this.userChange.asObservable();
  }
  getDataByUserName(data: { user: string; edad: number }){
    return this.http.post<any>(`${this.url}/datauser`, data );
  }
  anularU(id :number){
    return this.http.post<any>(`${this.url}/anular/${id}`, []);
  }
  deleteU(id :number){
    return this.http.post<any>(`${this.url}/delete/${id}`, []);
  }
  activeU(id :number){
    return this.http.post<any>(`${this.url}/active/${id}`, []);
  }
  searchNro(nro :string){
    return this.http.post<any>(`${this.url}/document/${nro}`, []);
  }
  password(data :any){
    return this.http.post<any>(`${this.url}/password`, data);
  }
  passworduser(data :any){
    return this.http.post<any>(`${this.url}/passworduser`, data);
  }
  saveUser(data :any){
    return this.http.post<any>(`${this.url}/saveUser`, data);
  }
  sendEmail(data :any){
    return this.http.post<any>(`${this.url}/sendEmail`, data);
  }
  importExcel(data :any){
    return this.http.post<any>(`${this.url}/importExcel`, data);
  }
  getNamePerson(data :any){
    return this.http.post<any>(`${this.url}/getNamePerson`, data);
  }
  getNamePersonIdsExpositores(data :any){
    return this.http.post<any>(`${this.url}/getNamePersonIdsExpositores`, data);
  }



}
