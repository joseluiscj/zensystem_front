import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MenuService } from '../../services/menu.service';
import { LoginService } from '../../services/login.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { ThemeService } from '../../services/theme.service';
import { MatDialog } from '@angular/material/dialog';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment.development';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [MaterialModule, RouterOutlet, NgIf, RouterLink, RouterLinkActive, MatTooltipModule, NgFor],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  username: string;
  private timeoutId: any;
  private routerSubscription?: Subscription;
  isMenuOpen = true;
  menuItems = [];

  constructor(
    private menuService: MenuService,
    private loginService: LoginService,
    private localStorage: LocalstorageService,
    public themeService: ThemeService,
    private router: Router,
    private _dialog: MatDialog,
  ) {}

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  ngOnInit(): void {
    const helper = new JwtHelperService();
    const token = sessionStorage.getItem(environment.TOKEN_NAME);
    const decodeToken = helper.decodeToken(token);

    this.username = decodeToken.subn;
    this.localStorage.setItem("user_storage", this.username);

    this.menuService.getMenusByUser(this.username).subscribe(data => {
      this.menuItems = data;
    });

    this.startInactivityTimer();

    // En modo celular/móvil, cerrar automáticamente el menú lateral al cambiar de ruta
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cerrarMenuMobile();
    });
  }

  ngOnDestroy(): void {
    this.clearInactivityTimer();
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  /**
   * Cierra automáticamente el menú lateral cuando se selecciona una opción en modo celular (< 992px)
   */
  cerrarMenuMobile(): void {
    // Solo aplica cuando la pantalla está en modo celular / móvil (< 992px)
    // o cuando el menú lateral está abierto en modo flotante (sidebar-open)
    const isMobile = window.innerWidth < 992 || document.body.classList.contains('sidebar-open');

    if (!isMobile) {
      return; // En pantallas de escritorio no se altera el menú lateral
    }

    // 1. Invocar API de AdminLTE PushMenu si jQuery está disponible
    try {
      const $ = (window as any).$;
      if ($ && typeof $.fn?.PushMenu !== 'undefined') {
        $('[data-widget="pushmenu"]').PushMenu('collapse');
      }
    } catch (e) {
      // Ignorar si jQuery o PushMenu no están cargados
    }

    // 2. Manipular clases de document.body para asegurar el cierre inmediato
    const body = document.body;
    if (body) {
      body.classList.remove('sidebar-open');
      body.classList.remove('sidebar-is-opening');
      body.classList.add('sidebar-closed');
      body.classList.add('sidebar-collapse');
    }

    // 3. Ocultar el overlay oscuro de AdminLTE si está presente en el DOM
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      try {
        overlay.click();
      } catch (e) {}
    }
  }

  logout(): void {
    this.cerrarMenuMobile();
    this.loginService.logout();
  }

  dataUser(): void {
    // this._dialog.open(LayoutUserComponent, {
    //   disableClose: true,
    //   panelClass: 'modal-dialog-right', 
    // })
  }

  clickMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  startInactivityTimer(): void {
    // const timeoutDuration = 15 * 60 * 1000;
  }

  clearInactivityTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  } 
}
