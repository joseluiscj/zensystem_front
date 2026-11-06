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
  
  /** Tiempo máximo de inactividad permitido: 10 horas continuas (en milisegundos) */
  readonly INACTIVITY_LIMIT_MS: number = 10 * 60 * 60 * 1000;
  private readonly LAST_ACTIVITY_KEY: string = 'zensystem_last_activity';

  private lastActivityTime: number = Date.now();
  private checkInterval?: any;
  private activityListenersAttached: boolean = false;
  private visibilityHandler?: () => void;
  private readonly jwtHelper = new JwtHelperService();

  // Eventos de usuario que denotan que el sistema está en uso activo
  private readonly activityEvents: string[] = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
    'click'
  ];

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
   * Almacena el token y activa el monitoreo de inactividad (10 horas).
   */
  setToken(token: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(environment.TOKEN_NAME, token);
    }
    this.recordActivity();
    this.startInactivityMonitor();
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
   * Registra actividad del usuario (resetea el contador de inactividad de 10 horas).
   */
  recordActivity(): void {
    const now = Date.now();
    this.lastActivityTime = now;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.LAST_ACTIVITY_KEY, String(now));
    }
  }

  /**
   * Obtiene la marca de tiempo de la última actividad del usuario.
   */
  getLastActivityTime(): number {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(this.LAST_ACTIVITY_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    return this.lastActivityTime;
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
   * Obtiene la información del usuario autenticado a partir del token JWT.
   */
  getCurrentUser(): { id: number; name: string } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded: any = this.jwtHelper.decodeToken(token);
      if (decoded && decoded.sub) {
        return {
          id: Number(decoded.sub),
          name: decoded.subn || ''
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Cierra la sesión, limpia los datos de sesión y redirige a la pantalla de login.
   * Si registrarEnBd es true, envía al backend la notificación para registrar la salida en la tabla usuario_sesion.
   * Si notify es verdadero, muestra un mensaje de aviso al usuario.
   */
  logout(
    notify: boolean = false, 
    message: string = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
    descripcion: string = 'Salió del sistema',
    registrarEnBd: boolean = true
  ): void {
    const currentUser = this.getCurrentUser();
    const token = this.getToken();

    // Notificar al backend para registrar en usuario_sesion
    if (registrarEnBd && (token || currentUser)) {
      const payload = {
        idUser: currentUser?.id,
        username: currentUser?.name,
        descripcion: descripcion
      };
      this.http.post(`${environment.HOST}/logout`, payload).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    this.stopInactivityMonitor();

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    if (notify) {
      this.snackBar.open(message, 'Cerrar', {
        duration: 7000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }

    this.router.navigate(['/login']);
  }

  /**
   * Inicia el monitoreo de inactividad al arrancar la aplicación o recargar la página.
   */
  initSessionMonitor(): void {
    const token = this.getToken();
    if (token) {
      if (this.jwtHelper.isTokenExpired(token)) {
        this.logout(true, 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.', 'Salió del sistema (Sesión expirada)', true);
      } else {
        // Verificar si antes de recargar ya habían transcurrido 10 horas de inactividad
        const lastAct = this.getLastActivityTime();
        if (Date.now() - lastAct >= this.INACTIVITY_LIMIT_MS) {
          this.logout(true, 'Su sesión se ha cerrado automáticamente por inactividad prolongada (10 horas sin uso). Por favor, inicie sesión nuevamente.', 'Salió del sistema (Inactividad 10 horas)', true);
          return;
        }
        // Si el usuario recargó la página mientras está activo, refrescar actividad y arrancar monitor
        this.recordActivity();
        this.startInactivityMonitor();
      }
    }
  }

  /**
   * Inicia los observadores de eventos de usuario y el intervalo de verificación de inactividad.
   */
  private startInactivityMonitor(): void {
    this.stopInactivityMonitor();
    this.attachActivityListeners();

    // Verificación periódica cada 30 segundos fuera de NgZone para óptimo rendimiento
    this.ngZone.runOutsideAngular(() => {
      this.checkInterval = setInterval(() => {
        this.checkInactivity();
      }, 30000);
    });
  }

  /**
   * Detiene los observadores y temporizadores de inactividad.
   */
  private stopInactivityMonitor(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    this.detachActivityListeners();
  }

  /**
   * Evalúa si han transcurrido 10 horas continuas sin uso del sistema.
   */
  private checkInactivity(): void {
    const token = this.getToken();
    if (!token) {
      this.stopInactivityMonitor();
      return;
    }

    const lastAct = this.getLastActivityTime();
    const idleMs = Date.now() - lastAct;

    // Solo se cierra la sesión si han pasado 10 horas continuas sin ninguna interacción
    if (idleMs >= this.INACTIVITY_LIMIT_MS) {
      this.ngZone.run(() => {
        this.logout(true, 'Su sesión se ha cerrado automáticamente por inactividad prolongada (10 horas sin uso). Por favor, inicie sesión nuevamente.', 'Salió del sistema (Inactividad 10 horas)', true);
      });
      return;
    }

    // Como respaldo secundario, verificar si el token JWT expiró
    try {
      if (this.jwtHelper.isTokenExpired(token)) {
        this.ngZone.run(() => {
          this.logout(true, 'Su sesión ha expirado. Por favor, vuelva a iniciar sesión.', 'Salió del sistema (Sesión expirada)', true);
        });
      }
    } catch {
      this.ngZone.run(() => {
        this.logout(true, 'Token inválido. Inicie sesión nuevamente.', 'Salió del sistema (Token inválido)', true);
      });
    }
  }

  /**
   * Manejador de eventos de usuario (mouse, teclado, touch, scroll)
   */
  private handleUserActivity = (): void => {
    const now = Date.now();
    // Limitar escritura a como máximo una vez por segundo para evitar sobrecarga
    if (now - this.lastActivityTime >= 1000) {
      this.recordActivity();
    }
  };

  /**
   * Conecta los listeners en window/document para detectar actividad del usuario.
   */
  private attachActivityListeners(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined' || this.activityListenersAttached) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach(eventType => {
        window.addEventListener(eventType, this.handleUserActivity, { passive: true });
      });
    });

    this.activityListenersAttached = true;
  }

  /**
   * Desconecta los listeners de actividad del usuario.
   */
  private detachActivityListeners(): void {
    if (typeof window === 'undefined' || !this.activityListenersAttached) {
      return;
    }

    this.activityEvents.forEach(eventType => {
      window.removeEventListener(eventType, this.handleUserActivity);
    });

    this.activityListenersAttached = false;
  }

  /**
   * Listener cuando el usuario cambia de pestaña o reactiva la ventana.
   */
  private setupVisibilityListener(): void {
    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (!document.hidden && this.getToken()) {
          this.checkInactivity();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', this.visibilityHandler);
      }
    }
  }
}
