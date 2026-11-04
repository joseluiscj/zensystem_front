export interface CajaDetalle {
    id?: number;
    idCajaDetalle?: number;
    idCaja: number;
    caja?: string;
    cajaNombre?: string;
    moneda?: string;
    tipoCaja?: string;
    idUsuario?: number;
    usuario?: string;
    usuarioNombre?: string;
    rolNombre?: string;
    sucursalNombre?: string;
    aFecha: string;
    aMonto: number;
    cFecha?: string;
    cMonto?: number;
    state: number; // 1: Abierta, 0: Cerrada
    active?: number;
    status?: number;
}
