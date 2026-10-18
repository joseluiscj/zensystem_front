export interface CajaDetalle {
    id?: number;
    idCajaDetalle?: number;
    idCaja: number;
    cajaNombre?: string;
    moneda?: string;
    idUsuario?: number;
    usuarioNombre?: string;
    sucursalNombre?: string;
    aFecha: string;
    aMonto: number;
    cFecha?: string;
    cMonto?: number;
    state: number; // 1: Abierta, 0: Cerrada
    active?: number;
    status?: number;
}
