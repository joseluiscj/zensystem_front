import { Injectable } from '@angular/core';
import { GenericService } from './generic.service';
import { Menu } from '../../model/menu';
import { Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class MenuService extends GenericService<Menu> {
  private menuChange = new Subject<Menu[]>();

  constructor(http: HttpClient) { 
    super(http, `${environment.HOST}/menus`);
  }

  getMenusByUser(username: string){
    const headers = new HttpHeaders().set('Authorization', `Bearer ${sessionStorage.getItem(environment.TOKEN_NAME)}`);
    return this.http.post<Menu[]>(`${this.url}/user/${username}`, {}, { headers });
  }

  getMenuChange(){
    return this.menuChange.asObservable();
  }
 
  setMenuChange(menus :Menu[]){
    this.menuChange.next(menus)
  }
}
