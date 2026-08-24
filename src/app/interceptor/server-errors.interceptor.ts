import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { EMPTY, Observable, catchError, retry, tap } from "rxjs";
import { environment } from "../../environments/environment.development";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class ServerErrorsInterceptor implements HttpInterceptor{
    
    constructor(
        private snackBar: MatSnackBar,
        private router: Router
    ){}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const loginUrl = `${environment.HOST}/login`;  // Define aquí la URL de inicio de sesión
        // Verifica si la URL es la de inicio de sesión
        const isLoginRequest = req.url === loginUrl;

        // Clona la solicitud y añade el encabezado de autorización solo si no es una solicitud de login
        const authToken = sessionStorage.getItem(environment.TOKEN_NAME);
        const authReq = authToken && !isLoginRequest
            ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${authToken}`) })
            : req;

        return next.handle(authReq).pipe(
            retry(environment.RETRY), // Reintentos configurados en el environment
            tap(event => {
                if (event instanceof HttpResponse) { 
                    // if (event.body && event.body.error === true && event.body.errorMessage) {
                    if(event.body && event.body.error == true && event.body.errorMessage){
                        throw new Error(event.body.errorMessage);
                    }
                }
            }),
            catchError((err) => {
                if (err.status === 422) {
                    const msj = JSON.stringify(err.error.errors)
                    this.snackBar.open(err.error?.error || 'Error de registro '+msj, `ERROR ${err.status}`, {
                        duration: 5000
                    });
                }else if (err.status === 401) {
                    // Redirige a la página de inicio de sesión si el error es 401
                    this.router.navigate(['/login']);
                }else{
                    this.snackBar.open(err.error?.error || 'Error desconocido', `ERROR ${err.status}`, {
                        duration: 5000
                    });
                }

                return EMPTY;
            })
        );
    }
}