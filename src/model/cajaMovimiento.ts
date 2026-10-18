export interface CajaMovimiento {
    id?: number;
    idCajaMovimiento?: number;
    idCaja: number;
    idCajaDetalle: number;
    tipo: string; // 'I' | 'E'
    monto: number;
    descripcion: string;
    metodoPago: string; // 'EF' | 'TA' | 'TR'
    created_at?: string;
    usuarioNombre?: string;
}
