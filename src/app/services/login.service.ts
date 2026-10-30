import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../environments/environment.development';

interface ILoginRequest {
  name: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private url: string = `${environment.HOST}/login`;
  private tokenTimer?: any;
  private checkInterval?: any;
  private visibilityHandler?: () => void;
  private readonly jwtHelper = new JwtHelperService();

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {
    this.setupVisibilityListener();
  }

  login(name: string, password: string) {
    const body: ILoginRequest = { name, password };
    return this.http.post<any>(this.url, body);
  }

  /**
   * Almacena el token y activa el monitoreo de expiración automática.
   */
  setToken(token: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(environment.TOKEN_NAME, token);
    }
    this.startTokenMonitor();
  }

  /**
   * Obtiene el token de sessionStorage.
   */
  getToken(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(environment.TOKEN_NAME);
    }
    return null;
  }

  /**
   * Verifica si el usuario cuenta con un token válido y no expirado.
   */
  isLogged(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    try {
      return !this.jwtHelper.isTokenExpired(token);
    } catch {
      return false;
    }
  }

  /**
   * Cierra la sesión, limpia los datos de sesión y redirige a la pantalla de login.
   * Si notify es verdadero, muestra un mensaje de aviso al usuario.
   */
  logout(notify: boolean = false, message: string = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'): void {
    this.clearTimers();

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    if (notify) {
      this.snackBar.open(message, 'Cerrar', {
        duration: 6000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }

    this.router.navigate(['/login']);
  }

  /**
   * Inicia el monitoreo de sesión al arrancar la aplicación o recargar la página.
   */
  initSessionMonitor(): void {
    const token = this.getToken();
    if (token) {
      if (this.jwtHelper.isTokenExpired(token)) {
        this.logout(true, 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      } else {
        this.startTokenMonitor();
      }
    }
  }

  /**
   * Configura los temporizadores para cerrar la sesión de forma automática cuando el token expire.
   */
  private startTokenMonitor(): void {
    this.clearTimers();

    const token = this.getToken();
    if (!token) return;

    try {
      if (this.jwtHelper.isTokenExpired(token)) {
        this.ngZone.run(() => {
          this.logout(true, 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        });
        return;
      }

      const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
      if (expirationDate) {
        const msUntilExpiration = expirationDate.getTime() - Date.now();

        if (msUntilExpiration <= 0) {
          this.ngZone.run(() => {
            this.logout(true, 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
          });
          return;
        }

        // Temporizador exacto que expira cuando se agota el tiempo de vida del JWT
        this.tokenTimer = setTimeout(() => {
          this.ngZone.run(() => {
            this.logout(true, 'Su sesión ha expirado automáticamente. Por favor, vuelva a ingresar.');
          });
        }, msUntilExpiration);
      }

      // Verificación periódica cada 15 segundos en segundo plano (útil si el equipo fue suspendido o hibernó)
      this.checkInterval = setInterval(() => {
        this.checkTokenExpiration();
      }, 15000);

    } catch (e) {
      console.error('Error al verificar tiempo del token:', e);
      this.logout(true, 'Error de autenticación. Inicie sesión nuevamente.');
    }
  }

  private checkTokenExpiration(): void {
    const token = this.getToken();
    if (!token) {
      this.clearTimers();
      return;
    }

    try {
      if (this.jwtHelper.isTokenExpired(token)) {
        this.ngZone.run(() => {
          this.logout(true, 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        });
      }
    } catch {
      this.ngZone.run(() => {
        this.logout(true, 'Token inválido. Inicie sesión nuevamente.');
      });
    }
  }

  private setupVisibilityListener(): void {
    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (!document.hidden && this.getToken()) {
          this.checkTokenExpiration();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', this.visibilityHandler);
      }
    }
  }

  private clearTimers(): void {
    if (this.tokenTimer) {
      clearTimeout(this.tokenTimer);
      this.tokenTimer = undefined;
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }
}
