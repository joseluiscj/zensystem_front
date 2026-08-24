import { PedidoDetalle } from "./pedidoDetalle"
import { Producto } from "./producto"

export class Pedido{
    id: number;

    f_idMesa:number;
    f_nombreCliente:string;
    f_pagoCon:number;
    f_caja:number;
    f_cajero:number;
    f_montoTotal:number;
    f_montoEfectivo:number;
    f_vuelto:number;
    f_detalle:Producto[];
    f_state:number;
    
    f_txtCaja:number;
    f_txtCajero:number;
}