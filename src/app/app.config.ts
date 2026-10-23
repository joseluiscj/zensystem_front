import { ApplicationConfig,LOCALE_ID, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ServerErrorsInterceptor } from './interceptor/server-errors.interceptor';
import { JwtModule } from '@auth0/angular-jwt';
import { environment } from '../environments/environment.development';

export function tokenGetter(){
  return sessionStorage.getItem(environment.TOKEN_NAME);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideAnimationsAsync(),
    importProvidersFrom(
      JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
          // disallowedRoutes: ["http://198.211.96.221:8080/moviza/login/forget"], //no envía tokens ejmp 'olvide contraseña'
          // allowedDomains: ["localhost:8080"],
          // allowedDomains: ["http://127.0.0.1:8000/api"],
          // allowedDomains: ["https://siadeback.csjla.pe/api"],
          // disallowedRoutes: ["http://localhost:8080/login/forget"],
        },
      }),
    ),
    {
    provide: LOCALE_ID,
      useValue: 'es-ES'
    },
    provideHttpClient(withInterceptorsFromDi()), //para petición http forma cuando viaje al token jwt
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ServerErrorsInterceptor,
      multi: true
    }
  ]
};
