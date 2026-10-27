import { Routes } from "@angular/router";
import { InicioComponent } from "./inicio/inicio.component";
import { certGuard } from "../guard/cert.guard";
import { Not404Component } from "./not-404/not-404.component";
import { CategoriaComponent } from "./categoria/categoria.component";
import { MesaComponent } from "./mesa/mesa.component";
import { VentaComponent } from "./venta/venta.component";
import { CajaComponent } from "./caja/caja.component";
import { AperturaCajaComponent } from "./apertura-caja/apertura-caja.component";
import { ProductoComponent } from "./producto/producto.component";
import { RestauranteComponent } from "./restaurante/restaurante.component";
import { AlmacenComponent } from "./almacen/almacen.component";
import { MovimientoCajaComponent } from "./movimiento-caja/movimiento-caja.component";

export const pagesRoutes: Routes = [
    {path: 'inicio', component:InicioComponent, canActivate: [certGuard]},
    {path: 'producto', component:ProductoComponent, canActivate: [certGuard]},
    {path: 'categoria', component:CategoriaComponent, canActivate: [certGuard]},
    // {path: 'pedido', component:PedidoComponent, canActivate: [certGuard]},
    {path: 'almacen', component:AlmacenComponent, canActivate: [certGuard]},
    {path: 'restaurante', component:RestauranteComponent, canActivate: [certGuard]},
    {path: 'mesa', component:MesaComponent, canActivate: [certGuard]},
    {path: 'venta', component:VentaComponent, canActivate: [certGuard]},
    {path: 'caja', component:CajaComponent, canActivate: [certGuard]},
    {path: 'apertura', component:AperturaCajaComponent, canActivate: [certGuard]},
    {path: 'movimiento-caja', component:MovimientoCajaComponent, canActivate: [certGuard]},
    {path: 'not-404', component:Not404Component}
];
