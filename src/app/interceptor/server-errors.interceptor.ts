import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { EMPTY, Observable, catchError, retry, tap, throwError, timer } from "rxjs";
import { environment } from "../../environments/environment.development";
import { Injectable, Injector } from "@angular/core";
import { LoginService } from "../services/login.service";

@Injectable({
    providedIn: 'root'
})
export class ServerErrorsInterceptor implements HttpInterceptor {
    
    constructor(
        private snackBar: MatSnackBar,
        private router: Router,
        private injector: Injector
    ){}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const loginUrl = `${environment.HOST}/login`;
        const isLoginRequest = req.url === loginUrl;

        // Clona la solicitud y añade el encabezado de autorización solo si no es una solicitud de login
        const authToken = sessionStorage.getItem(environment.TOKEN_NAME);
        const authReq = authToken && !isLoginRequest
            ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${authToken}`) })
            : req;

        return next.handle(authReq).pipe(
            retry({
                count: environment.RETRY,
                delay: (err: any) => {
                    // No reintentar en caso de token expirado (401), prohibido (403) o error de formulario (422)
                    if (err.status === 401 || err.status === 403 || err.status === 422) {
                        return throwError(() => err);
                    }
                    return timer(1000);
                }
            }),
            tap(event => {
                if (event instanceof HttpResponse) { 
                    if (event.body && event.body.error == true && event.body.errorMessage) {
                        throw new Error(event.body.errorMessage);
                    }

                    // Manejo de respuestas legacy de backend que devuelvan 200 con status de token expirado
                    if (event.body && typeof event.body === 'object') {
                        const status = event.body.status;
                        if (status === 'expired token' || status === 'invalid token' || status === 'token not fount' || status === 'token not found') {
                            throw new HttpErrorResponse({
                                status: 401,
                                statusText: 'Unauthorized',
                                error: { error: 'Sesión expirada o token inválido' }
                            });
                        }
                    }
                }
            }),
            catchError((err: any) => {
                if (err.status === 422) {
                    const msj = err.error?.errors ? JSON.stringify(err.error.errors) : '';
                    this.snackBar.open(err.error?.error || 'Error de validación ' + msj, `ERROR ${err.status}`, {
                        duration: 5000
                    });
                } else if (err.status === 401) {
                    // Token o sesión expirada: cerrar sesión automáticamente y redirigir
                    try {
                        const loginService = this.injector.get(LoginService);
                        loginService.logout(true, 'Su sesión ha expirado. Por favor, vuelva a iniciar sesión.');
                    } catch {
                        sessionStorage.clear();
                        this.snackBar.open('Su sesión ha expirado. Por favor, vuelva a iniciar sesión.', 'Cerrar', {
                            duration: 5000
                        });
                        this.router.navigate(['/login']);
                    }
                } else {
                    this.snackBar.open(err.error?.error || err.message || 'Error desconocido', `ERROR ${err.status || 500}`, {
                        duration: 5000
                    });
                }

                return EMPTY;
            })
        );
    }
}
