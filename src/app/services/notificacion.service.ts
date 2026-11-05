import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, of, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { NotificacionData, NotificacionResponse } from '../../model/notificacion';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService implements OnDestroy {
  private url = `${environment.HOST}/notificaciones`;

  private notificacionesSubject = new BehaviorSubject<NotificacionData | null>(null);
  public notificaciones$ = this.notificacionesSubject.asObservable();

  private totalNotificacionesSubject = new BehaviorSubject<number>(0);
  public totalNotificaciones$ = this.totalNotificacionesSubject.asObservable();

  private cargandoSubject = new BehaviorSubject<boolean>(false);
  public cargando$ = this.cargandoSubject.asObservable();

  private pollInterval?: any;
  private readonly POLL_MS = 45000; // 45 segundos

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {}

  /**
   * Carga las notificaciones desde el backend y actualiza los observables.
   */
  cargarNotificaciones(): Observable<NotificacionResponse | null> {
    this.cargandoSubject.next(true);
    return this.http.get<NotificacionResponse>(this.url).pipe(
      tap((res) => {
        this.cargandoSubject.next(false);
        if (res && res.code === 200 && res.data) {
          this.notificacionesSubject.next(res.data);
          this.totalNotificacionesSubject.next(res.data.totales?.totalNotificaciones || 0);
        }
      }),
      catchError((err) => {
        this.cargandoSubject.next(false);
        console.error('Error al cargar notificaciones:', err);
        return of(null);
      })
    );
  }

  /**
   * Inicia el sondeo (polling) periódico en segundo plano.
   */
  iniciarPolling(): void {
    this.detenerPolling();
    // Ejecución inicial
    this.cargarNotificaciones().subscribe();

    this.ngZone.runOutsideAngular(() => {
      this.pollInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.cargarNotificaciones().subscribe();
        });
      }, this.POLL_MS);
    });
  }

  /**
   * Detiene el sondeo periódico.
   */
  detenerPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  /**
   * Obtiene el valor actual de notificaciones sincronizadas.
   */
  obtenerDatosActuales(): NotificacionData | null {
    return this.notificacionesSubject.getValue();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }
}
