import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { MenuService } from '../../services/menu.service';
import { LoginService } from '../../services/login.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { ThemeService } from '../../services/theme.service';
import { NotificacionService } from '../../services/notificacion.service';
import { MatDialog } from '@angular/material/dialog';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment.development';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NotificacionData, ProductoStockBajo } from '../../../model/notificacion';
import { NotificacionStockDialogComponent } from './notificacion-stock-dialog/notificacion-stock-dialog.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    RouterOutlet,
    NgIf,
    NgFor,
    NgClass,
    RouterLink,
    RouterLinkActive,
    MatTooltipModule,
    DecimalPipe
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  username: string;
  private timeoutId: any;
  private routerSubscription?: Subscription;
  isMenuOpen = true;
  menuItems = [];

  // Estado del módulo de notificaciones (alertas de stock bajo)
  notificaciones: NotificacionData | null = null;
  totalNotificaciones: number = 0;
  cargandoNotif: boolean = false;

  private subNotificaciones?: Subscription;
  private subTotalNotificaciones?: Subscription;
  private subCargandoNotif?: Subscription;

  constructor(
    private menuService: MenuService,
    private loginService: LoginService,
    private localStorage: LocalstorageService,
    public themeService: ThemeService,
    public notificacionService: NotificacionService,
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

    this.username = decodeToken?.subn || '';
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

    // Iniciar el monitoreo de alertas de stock bajo
    this.iniciarNotificaciones();
  }

  ngOnDestroy(): void {
    this.clearInactivityTimer();
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.subNotificaciones) {
      this.subNotificaciones.unsubscribe();
    }
    if (this.subTotalNotificaciones) {
      this.subTotalNotificaciones.unsubscribe();
    }
    if (this.subCargandoNotif) {
      this.subCargandoNotif.unsubscribe();
    }
    this.notificacionService.detenerPolling();
  }

  /**
   * Conecta y escucha el servicio reactivo de notificaciones de stock bajo
   */
  private iniciarNotificaciones(): void {
    this.notificacionService.iniciarPolling();

    this.subNotificaciones = this.notificacionService.notificaciones$.subscribe((data) => {
      this.notificaciones = data;
    });

    this.subTotalNotificaciones = this.notificacionService.totalNotificaciones$.subscribe((total) => {
      this.totalNotificaciones = total;
    });

    this.subCargandoNotif = this.notificacionService.cargando$.subscribe((cargando) => {
      this.cargandoNotif = cargando;
    });
  }

  /**
   * Recarga manualmente las alertas de stock bajo desde el menú desplegable
   */
  recargarNotificaciones(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.notificacionService.cargarNotificaciones().subscribe();
  }

  /**
   * Abre el modal detallado de productos con stock bajo o crítico
   */
  abrirModalStockBajo(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this._dialog.open(NotificacionStockDialogComponent, {
      width: '940px',
      maxWidth: '96vw',
      panelClass: 'modal-responsive-clean',
      data: {
        productos: this.notificaciones?.stockBajo || []
      }
    });
  }

  /**
   * Navega a una ruta específica de la aplicación
   */
  irARuta(ruta: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate([ruta]);
  }

  /**
   * Cierra automáticamente el menú lateral cuando se selecciona una opción en modo celular (< 992px)
   */
  cerrarMenuMobile(): void {
    const isMobile = window.innerWidth < 992 || document.body.classList.contains('sidebar-open');

    if (!isMobile) {
      return;
    }

    try {
      const $ = (window as any).$;
      if ($ && typeof $.fn?.PushMenu !== 'undefined') {
        $('[data-widget="pushmenu"]').PushMenu('collapse');
      }
    } catch (e) {
      // Ignorar
    }

    const body = document.body;
    if (body) {
      body.classList.remove('sidebar-open');
      body.classList.remove('sidebar-is-opening');
      body.classList.add('sidebar-closed');
      body.classList.add('sidebar-collapse');
    }

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
    this.loginService.logout(false, '', 'Salió del sistema', true);
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
