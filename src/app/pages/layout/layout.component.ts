import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MenuService } from '../../services/menu.service';
import { LoginService } from '../../services/login.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { MatDialog } from '@angular/material/dialog';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [MaterialModule, RouterOutlet, NgIf, RouterLink, RouterLinkActive,  MatTooltipModule,NgFor],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit,OnDestroy  {
  username:string;
  private timeoutId: any;
  isMenuOpen = true;
  // menuItems = [
  //   {
  //     title: 'Inicio',
  //     route: '/pages/inicio' // Esta opción NO tiene submenús, pero sí una ruta directa
  //   }, 
  //   {
  //     title: 'Gestión de Menú',
  //     subItems: [
  //       { title: 'Platos', route: '/pages/plato' },
  //       { title: 'Categorías', route: '/pages/categoria' },
  //     ]
  //   },
  //   {
  //     title: 'Pedidos',
  //     route: '/pages/pedido' // Esta opción NO tiene submenús, pero sí una ruta directa
  //   }, 
  // ];
  menuItems = []

  // constructor(private eRef: ElementRef) {}
  constructor(
    private menuService: MenuService,
    private loginService: LoginService,
    private localStorage: LocalstorageService,
    private router: Router,
    private _dialog: MatDialog,
  ){}

  ngOnInit(): void{
    const helper = new JwtHelperService();
    const token = sessionStorage.getItem(environment.TOKEN_NAME);
    const decodeToken = helper.decodeToken(token);

    this.username = decodeToken.subn;
    this.localStorage.setItem("user_storage",this.username);

    this.menuService.getMenusByUser(this.username).subscribe(data => {
      // this.menuService.setMenuChange(data)
      this.menuItems = data;
      // this.localstorage.setItem("menu_storage",data);
    })

    this.startInactivityTimer();
  }
  ngOnDestroy(): void {
    this.clearInactivityTimer();
  }

  logout(){
    this.loginService.logout();
  }

  dataUser(){
    // this._dialog.open(LayoutUserComponent, {
    //   // data: id,
    //   disableClose: true,
    //   panelClass: 'modal-dialog-right', 
    // })
  }
  clickMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
     console.log('clickMenu', this.isMenuOpen);
  }
  startInactivityTimer(): void {
    // 15 minutos en milisegundos
    // const timeoutDuration = 15 * 60 * 1000;
    // const timeoutDuration = 15 * 60 * 1000;

    // this.timeoutId = setTimeout(() => {
    //   this.router.navigate(['login']); // Cambia '/login' por la ruta de tu página de login
    // }, timeoutDuration);
  }
  clearInactivityTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  } 
}
