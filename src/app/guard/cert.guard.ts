import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";
import { LoginService } from "../services/login.service";
import { MenuService } from "../services/menu.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { environment } from "../../environments/environment.development";
import { catchError, map, of } from "rxjs";
import { Menu } from "../../model/menu";

export const certGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const loginService = inject(LoginService);    
    const menuService = inject(MenuService);
    const router = inject(Router);

    //1)verificar si el usuario esta logeado
    const rpta = loginService.isLogged();
    if(!rpta){
        loginService.logout();
        return false;
    }
    //2)verificar si el token no ha expirado
    const helper = new JwtHelperService();
    const token = sessionStorage.getItem(environment.TOKEN_NAME);
    if(!helper.isTokenExpired(token)){
        //3)verificar si tienes el rol necesario para acceder a ese componente 'página'
        const url = state.url;
        const decodedToken = helper.decodeToken(token);
        const username = decodedToken.subn;
        return menuService.getMenusByUser(username).pipe(map((data:Menu[]) =>{
            menuService.setMenuChange(data)
            let cont = 0
            for(let m of data){
                if(url.startsWith(m.route)){
                    cont++;
                    break;
                }
                for(let m2 of m.subItems){
                    if(url.startsWith(m2.route)){
                        cont++;
                        break;
                    }
                }
            }
            if (cont > 0) {
                return true;
            }else{
                router.navigate(['/pages/not-404']);
                return false;
            }
        }))
    }else{
        loginService.logout();
        return false;
    }

    return true;
}