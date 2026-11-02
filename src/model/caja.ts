export class Caja {
    id: number;
    nombre: string;
    sucursal: string;
    tipoCaja: string;
    saldo: number;
    moneda: string;
    state: string;
    principal?: number;
    idCajaDestinoEfectivo?: number;
    idCajaDestinoTarjeta?: number;
    nombreCajaDestinoEfectivo?: string;
    nombreCajaDestinoTarjeta?: string;

    f_nombre: string;
    f_saldo: string;
    f_moneda: string;
    f_medioPago: string;
    f_sucursal: string;
    f_cajaTipo: string;
    f_principal: number;
    f_idCajaDestinoEfectivo?: number | null;
    f_idCajaDestinoTarjeta?: number | null;
}
