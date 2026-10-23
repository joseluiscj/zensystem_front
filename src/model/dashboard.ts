export interface DashboardKPIs {
  ventasTotales: number;
  ventasHoy: number;
  pedidosTotales: number;
  pedidosHoy: number;
  pedidosAtendidos: number;
  pedidosPendientes: number;
  mesasTotales: number;
  mesasOcupadas: number;
  mesasDisponibles: number;
  tasaOcupacion: number;
  cajasAbiertas: number;
  cajaActiva: {
    idCajaDetalle: number;
    idCaja: number;
    caja_nombre: string;
    aFecha: string;
    aMonto: string;
    saldo: string;
    cajero_user: string;
    cajero_nombre: string;
  } | null;
  totalProductos: number;
  totalCategorias: number;
}

export interface DashboardMesaOcupada {
  idMesa: number;
  nombre: string;
  disponible: number;
  idUltimoPedido: number;
  cliente: string;
  montoTotal: string | number;
  pedido_state: number;
  pedido_fecha: string;
  items_count: number;
}

export interface DashboardTopProducto {
  idProducto: number;
  nombre: string;
  precio: string | number;
  categoria: string;
  total_vendido: number;
  total_recaudado: number;
  imagen?: string;
}

export interface DashboardMetodoPago {
  pagoCon: string;
  cantidad: number;
  total: string | number;
}

export interface DashboardMovimiento {
  idCajaMovimiento: number;
  idCaja: number;
  tipo: 'I' | 'E';
  monto: string | number;
  descripcion: string;
  metodoPago: string;
  created_at: string;
  caja_nombre: string;
  usuario_nombre: string;
}

export interface DashboardPedidoReciente {
  idPedido: number;
  idMesa: number;
  mesa_nombre: string;
  cliente: string;
  montoTotal: string | number;
  pagoCon: string;
  state: number;
  created_at: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  mesasOcupadas: DashboardMesaOcupada[];
  topProductos: DashboardTopProducto[];
  metodosPago: DashboardMetodoPago[];
  ultimosMovimientos: DashboardMovimiento[];
  ultimosPedidos: DashboardPedidoReciente[];
  usuario: {
    username: string;
    nombreCompleto: string;
    rol: string;
  };
}
