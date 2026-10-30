import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";
import { LoginService } from "../services/login.service";
import { MenuService } from "../services/menu.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { environment } from "../../environments/environment.development";
import { map } from "rxjs";
import { Menu } from "../../model/menu";

export const certGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const loginService = inject(LoginService);    
    const menuService = inject(MenuService);
    const router = inject(Router);

    // 1) Verificar si existe token en la sesión
    const token = sessionStorage.getItem(environment.TOKEN_NAME);
    if (!token) {
        loginService.logout(false);
        return false;
    }

    // 2) Verificar si el token no ha expirado
    const helper = new JwtHelperService();
    if (helper.isTokenExpired(token)) {
        loginService.logout(true, 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        return false;
    }

    // 3) Verificar permisos y rol para acceder a la página
    const url = state.url;
    const decodedToken = helper.decodeToken(token);
    const username = decodedToken.subn;
    return menuService.getMenusByUser(username).pipe(map((data: Menu[]) => {
        menuService.setMenuChange(data);
        let cont = 0;
        for (let m of data) {
            if (url.startsWith(m.route)) {
                cont++;
                break;
            }
            for (let m2 of m.subItems) {
                if (url.startsWith(m2.route)) {
                    cont++;
                    break;
                }
            }
        }
        if (cont > 0) {
            return true;
        } else {
            router.navigate(['/pages/not-404']);
            return false;
        }
    }));
};
