import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../material/material.module';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PedidoService, VentaItem, ResumenVentas } from '../../services/pedido.service';
import { MesaService } from '../../services/mesa.service';
import { VentaDetalleDialogComponent } from './venta-detalle-dialog/venta-detalle-dialog.component';
import { VentaCobroMesaDialogComponent } from './venta-cobro-mesa-dialog/venta-cobro-mesa-dialog.component';
import { VentaJustificacionDialogComponent } from './venta-justificacion-dialog/venta-justificacion-dialog.component';
import { AlertMsjComponent } from '../alert-msj/alert-msj.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VentaPosComponent } from './venta-pos/venta-pos.component';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    DecimalPipe,
    DatePipe,
    MatProgressBarModule,
    VentaPosComponent
  ],
  templateUrl: './venta.component.html',
  styleUrl: './venta.component.css'
})
export class VentaComponent implements OnInit {
  // Modo de visualización:
  // - 'lista': Listado general de ventas
  // - 'pos': Registro de nueva venta directa
  // - 'editar-mesa': Edición de comanda de mesa (estilo Restaurante)
  // - 'editar-pos': Edición de venta de mostrador (estilo Punto de Venta)
  modo: 'lista' | 'editar-mesa' | 'editar-pos' | 'pos' = 'lista';
  cargando: boolean = false;

  // Listado de ventas
  ventas: VentaItem[] = [];
  resumen: ResumenVentas = {
    totalVentas: 0,
    totalPedidos: 0,
    totalAtendidos: 0,
    totalPendientes: 0
  };

  // Filtros de búsqueda
  filtros = {
    fechaInicio: '',
    fechaFin: '',
    state: 'todos',
    pagoCon: 'todos',
    idMesa: 'todos',
    search: ''
  };

  esFiltroHoy: boolean = false;

  // Catálogo de mesas para el selector de filtros
  mesasCatalogo: any[] = [];

  // Paginación simple
  paginaActual: number = 1;
  registrosPorPagina: number = 10;

  // --- VARIABLES PARA MODO EDICIÓN ---
  idPedidoEditando: number | null = null;
  pedidoEditandoDatos: any = null;
  nombreMesaEditando: string = '';
  nombreClienteEditando: string = 'CONSUMIDOR FINAL';
  pagoConEditando: string = 'EF';
  nroOperacionEditando: string = '';
  idCajaEditando: any = '';
  idCajeroEditando: any = '';
  montoEfectivoEditando: number | null = null;
  estadoServicioEditando: string = 'PENDIENTE';
  stateEditando: number = 0;
  listaDetalle: any[] = [];
  cajasDisponibles: any[] = [];
  cajerosDisponibles: any[] = [];
  mesasDisponibles: any[] = [];
  isSaving: boolean = false;

  // Catálogo interactivo para los editores (tanto Mesa como POS)
  catalogoProductos: any[] = [];
  catalogoCategorias: any[] = [];
  productosFiltrados: any[] = [];
  searchProducto: string = '';
  categoriaSeleccionada: any = 'todas';
  cargandoCatalogo: boolean = false;

  // Sugerencias rápidas de cocina para comanda de mesa
  notasRapidas: string[] = [
    'Sin cebolla',
    'Bien cocido',
    'Término medio',
    'Sin ensalada',
    'Poco picante',
    'Sin sal',
    'Helada',
    'Sin hielo',
    'Para llevar'
  ];

  mediosPago: { codigo: string; nombre: string; icon: string }[] = [
    { codigo: 'EF', nombre: 'Efectivo', icon: 'payments' },
    { codigo: 'TA', nombre: 'Tarjeta Débito/Crédito', icon: 'credit_card' }
  ];

  constructor(
    private pedidoService: PedidoService,
    private mesaService: MesaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.filtrarHoy();
    this.cargarMesasCatalogo();
  }

  obtenerFechaHoy(): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  cargarMesasCatalogo(): void {
    this.mesaService.findAll().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.mesasCatalogo = res;
        } else if (res && res.data) {
          this.mesasCatalogo = res.data;
        }
      },
      error: () => {}
    });
  }

  cargarVentas(): void {
    this.cargando = true;
    const f: any = {};
    if (this.filtros.fechaInicio) f.fechaInicio = this.filtros.fechaInicio;
    if (this.filtros.fechaFin) f.fechaFin = this.filtros.fechaFin;
    if (this.filtros.state !== 'todos') f.state = this.filtros.state;
    if (this.filtros.pagoCon !== 'todos') f.pagoCon = this.filtros.pagoCon;
    if (this.filtros.idMesa !== 'todos') f.idMesa = this.filtros.idMesa;
    if (this.filtros.search.trim()) f.search = this.filtros.search.trim();

    this.pedidoService.listarVentas(f).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && res.code === 200) {
          this.ventas = res.data || [];
          this.resumen = res.resumen || {
            totalVentas: 0,
            totalPedidos: 0,
            totalAtendidos: 0,
            totalPendientes: 0
          };
          this.paginaActual = 1;
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error cargando ventas', err);
        this.snackBar.open('No se pudo cargar el listado de ventas', 'Cerrar', { duration: 3500 });
      }
    });
  }

  filtrarHoy(): void {
    const hoy = this.obtenerFechaHoy();
    this.filtros.fechaInicio = hoy;
    this.filtros.fechaFin = hoy;
    this.esFiltroHoy = true;
    this.cargarVentas();
  }

  aplicarFiltros(): void {
    if (this.filtros.fechaInicio && this.filtros.fechaFin && this.filtros.fechaInicio > this.filtros.fechaFin) {
      this.snackBar.open('La fecha de inicio no puede ser posterior a la fecha fin', 'Cerrar', { duration: 3000 });
      return;
    }
    const hoy = this.obtenerFechaHoy();
    this.esFiltroHoy = (this.filtros.fechaInicio === hoy && this.filtros.fechaFin === hoy);
    this.cargarVentas();
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: '',
      fechaFin: '',
      state: 'todos',
      pagoCon: 'todos',
      idMesa: 'todos',
      search: ''
    };
    this.esFiltroHoy = false;
    this.cargarVentas();
  }

  get ventasPaginadas(): VentaItem[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.ventas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.ventas.length / this.registrosPorPagina) || 1;
  }

  cambiarPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
    }
  }

  // --- ACCIONES DEL LISTADO ---

  abrirNuevaVenta(): void {
    this.modo = 'pos';
  }

  cerrarPos(registrado: boolean): void {
    this.modo = 'lista';
    if (registrado) {
      this.cargarVentas();
    }
  }

  verDetalle(idPedido: number): void {
    const dialogRef = this.dialog.open(VentaDetalleDialogComponent, {
      width: '580px',
      maxWidth: '95vw',
      panelClass: 'modal-dialog-center',
      data: { idPedido }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.accion === 'editar' && res.idPedido) {
        this.iniciarEdicion(res.idPedido);
      } else if (res && res.accion === 'cobrar' && res.idPedido) {
        const venta = this.ventas.find(x => x.idPedido === res.idPedido);
        if (venta) {
          this.abrirCobroMesa(venta);
        } else {
          this.abrirCobroMesa({
            idPedido: res.idPedido,
            idMesa: res.idMesa,
            mesa_nombre: res.mesa_nombre,
            nombreCliente: res.nombreCliente,
            montoTotal: res.montoTotal
          } as any);
        }
      }
    });
  }

  abrirCobroMesa(v: VentaItem): void {
    const dialogRef = this.dialog.open(VentaCobroMesaDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      panelClass: 'modal-dialog-center',
      data: {
        idPedido: v.idPedido,
        idMesa: v.idMesa,
        mesa_nombre: v.mesa_nombre,
        nombreCliente: v.nombreCliente,
        montoTotal: Number(v.montoTotal || 0),
        items_count: v.items_count,
        resumen_productos: v.resumen_productos
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.cobrado) {
        this.cargarVentas();
      }
    });
  }

  // --- INICIAR EDICIÓN SEGÚN ORIGEN (MESA O PUNTO DE VENTA) ---

  iniciarEdicion(idPedido: number): void {
    // 1. Validar en cliente si la venta pertenece a una caja ya cerrada
    const ventaExistente = this.ventas.find(x => x.idPedido === idPedido);
    if (ventaExistente && (ventaExistente.esEditable === 0 || ventaExistente.esEditable === false)) {
      this.snackBar.open(
        ventaExistente.motivoBloqueo || 'No se puede editar: la caja en la que fue registrada esta venta ya ha sido cerrada.',
        'Entendido',
        { duration: 5000 }
      );
      return;
    }

    this.cargando = true;
    this.idPedidoEditando = idPedido;

    this.pedidoService.obtenerPedidoCompleto(idPedido).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && res.code === 200 && res.data) {
          const p = res.data;

          // Doble verificación con respuesta del backend
          if (p.esEditable === 0 || p.esEditable === false) {
            this.snackBar.open(
              p.motivoBloqueo || 'No se puede editar: la caja de esta venta ya fue cerrada.',
              'Entendido',
              { duration: 5000 }
            );
            return;
          }

          this.pedidoEditandoDatos = p;
          this.nombreMesaEditando = p.mesa_nombre || 'Sin Mesa';
          this.nombreClienteEditando = p.f_nombreCliente || 'CONSUMIDOR FINAL';
          this.pagoConEditando = p.f_pagoCon || 'EF';
          this.nroOperacionEditando = p.f_nroOperacion || '';
          this.idCajaEditando = p.f_caja || '';
          this.idCajeroEditando = p.f_cajero || '';
          this.estadoServicioEditando = p.f_estadoServicio || 'PENDIENTE';
          this.stateEditando = p.f_state !== undefined ? Number(p.f_state) : 0;
          this.montoEfectivoEditando = p.f_montoEfectivo !== null && p.f_montoEfectivo !== undefined ? Number(p.f_montoEfectivo) : null;

          this.cajasDisponibles = res.cajas || [];
          this.cajerosDisponibles = res.cajeros || [];
          this.mesasDisponibles = res.mesas || [];

          // Detalle de productos normalizado
          this.listaDetalle = (res.detalle || []).map((item: any) => {
            const precio = Number(item.precio || item.f_precio || 0);
            const cant = Number(item.cantidad || item.f_cantidad || 1);
            return {
              f_producto: item.idProducto || item.f_producto,
              idProducto: item.idProducto || item.f_producto,
              f_txtProducto: item.nombre || item.f_txtProducto,
              nombre: item.nombre || item.f_txtProducto,
              codigo: item.codigo || '',
              f_categoria: item.f_categoria,
              f_txtCategoria: item.f_txtCategoria || 'General',
              f_precio: precio,
              precio: precio,
              f_cantidad: cant,
              cantidad: cant,
              f_subTotal: Number((precio * cant).toFixed(2)),
              subtotal: Number((precio * cant).toFixed(2)),
              f_observacion: item.observacion || item.f_observacion || '',
              observacion: item.observacion || item.f_observacion || '',
              f_download_link: item.imgId || item.f_download_link || '',
              imgId: item.imgId || item.f_download_link || '',
              unidadMedida: item.unidadMedida || 'UNIDAD',
              stock: Number(item.stock || 0),
              controlStock: item.controlStock
            };
          });

          if (this.pagoConEditando === 'EF' && (this.montoEfectivoEditando === null || this.montoEfectivoEditando < this.totalEdicion)) {
            this.montoEfectivoEditando = this.totalEdicion;
          }

          // DECIDIR MODO DE EDICIÓN:
          // Si proviene de mesa: mostrar interfaz Restaurante (menú a la izquierda, comanda a la derecha)
          // Si proviene de POS directo: mostrar interfaz Punto de Venta (catálogo POS y ticket)
          const esDeMesa = Boolean(p.f_idMesa && Number(p.f_idMesa) > 0 && p.mesa_nombre !== 'Sin Mesa');
          if (esDeMesa) {
            this.modo = 'editar-mesa';
          } else {
            this.modo = 'editar-pos';
          }

          this.cargarCatalogoEdicion();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          this.snackBar.open('No se pudo cargar la comanda para editar', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        const msg = err.error?.message || 'Error al cargar datos del pedido';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  cargarCatalogoEdicion(): void {
    this.cargandoCatalogo = true;
    this.pedidoService.getPosCatalogo().subscribe({
      next: (res) => {
        this.cargandoCatalogo = false;
        if (res && res.code === 200 && res.data) {
          this.catalogoProductos = res.data.productos || [];
          this.catalogoCategorias = res.data.categorias || [];
          this.filtrarProductos();
        }
      },
      error: () => {
        this.cargandoCatalogo = false;
        this.snackBar.open('Error al cargar catálogo de productos para edición', 'Cerrar', { duration: 3000 });
      }
    });
  }

  filtrarProductos(): void {
    const term = (this.searchProducto || '').toLowerCase().trim();
    const cat = this.categoriaSeleccionada;

    this.productosFiltrados = this.catalogoProductos.filter((p: any) => {
      const matchCat = cat === 'todas' || p.idCategoria === Number(cat);
      const matchText = !term ||
        (p.nombre && p.nombre.toLowerCase().includes(term)) ||
        (p.codigo && p.codigo.toLowerCase().includes(term));
      return matchCat && matchText;
    });
  }

  setCategoria(catId: any): void {
    this.categoriaSeleccionada = catId;
    this.filtrarProductos();
  }

  cancelarEdicion(): void {
    this.modo = 'lista';
    this.idPedidoEditando = null;
    this.pedidoEditandoDatos = null;
    this.listaDetalle = [];
    this.searchProducto = '';
    this.categoriaSeleccionada = 'todas';
  }

  // --- OPERACIONES EN DETALLE DE EDICIÓN ---

  get totalEdicion(): number {
    const total = this.listaDetalle.reduce((acc, it) => acc + Number(it.f_subTotal || 0), 0);
    return Number(total.toFixed(2));
  }

  get totalItemsEdicion(): number {
    return this.listaDetalle.reduce((acc, it) => acc + Number(it.f_cantidad || 0), 0);
  }

  get vueltoEdicion(): number {
    if (this.pagoConEditando !== 'EF' || this.montoEfectivoEditando === null) return 0;
    const diff = Number(this.montoEfectivoEditando) - this.totalEdicion;
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
  }

  agregarProductoAEdicion(prod: any): void {
    const idx = this.listaDetalle.findIndex(item => Number(item.f_producto) === Number(prod.id));
    if (idx >= 0) {
      this.incrementarCantidad(idx);
    } else {
      const precio = Number(prod.precio || 0);
      this.listaDetalle.push({
        f_producto: prod.id,
        idProducto: prod.id,
        f_txtProducto: prod.nombre,
        nombre: prod.nombre,
        codigo: prod.codigo,
        f_categoria: prod.idCategoria,
        f_txtCategoria: prod.categoria_nombre || 'General',
        f_precio: precio,
        precio: precio,
        f_cantidad: 1,
        cantidad: 1,
        f_subTotal: precio,
        subtotal: precio,
        f_observacion: '',
        observacion: '',
        f_download_link: prod.imgId || '',
        imgId: prod.imgId || '',
        unidadMedida: prod.unidadMedida || 'UNIDAD',
        stock: Number(prod.stock || 0),
        controlStock: prod.controlStock
      });
    }

    if (this.pagoConEditando === 'EF') {
      this.montoEfectivoEditando = this.totalEdicion;
    }
  }

  incrementarCantidad(index: number): void {
    if (this.listaDetalle[index]) {
      const cant = Number(this.listaDetalle[index].f_cantidad || 0) + 1;
      this.listaDetalle[index].f_cantidad = cant;
      this.listaDetalle[index].cantidad = cant;
      this.listaDetalle[index].f_subTotal = Number((cant * Number(this.listaDetalle[index].f_precio || 0)).toFixed(2));
      this.listaDetalle[index].subtotal = this.listaDetalle[index].f_subTotal;

      if (this.pagoConEditando === 'EF') {
        this.montoEfectivoEditando = this.totalEdicion;
      }
    }
  }

  decrementarCantidad(index: number): void {
    if (this.listaDetalle[index]) {
      const actual = Number(this.listaDetalle[index].f_cantidad || 0);
      if (actual > 1) {
        const cant = actual - 1;
        this.listaDetalle[index].f_cantidad = cant;
        this.listaDetalle[index].cantidad = cant;
        this.listaDetalle[index].f_subTotal = Number((cant * Number(this.listaDetalle[index].f_precio || 0)).toFixed(2));
        this.listaDetalle[index].subtotal = this.listaDetalle[index].f_subTotal;
      } else {
        this.eliminarProducto(index);
      }

      if (this.pagoConEditando === 'EF') {
        this.montoEfectivoEditando = this.totalEdicion;
      }
    }
  }

  actualizarCantidadInput(index: number, event: any): void {
    const val = parseFloat(event.target.value);
    const cant = isNaN(val) || val <= 0 ? 1 : val;
    this.listaDetalle[index].f_cantidad = cant;
    this.listaDetalle[index].cantidad = cant;
    this.listaDetalle[index].f_subTotal = Number((cant * Number(this.listaDetalle[index].f_precio || 0)).toFixed(2));
    this.listaDetalle[index].subtotal = this.listaDetalle[index].f_subTotal;

    if (this.pagoConEditando === 'EF') {
      this.montoEfectivoEditando = this.totalEdicion;
    }
  }

  eliminarProducto(index: number): void {
    this.listaDetalle.splice(index, 1);
    if (this.pagoConEditando === 'EF') {
      this.montoEfectivoEditando = this.totalEdicion;
    }
  }

  agregarNotaRapida(item: any, nota: string): void {
    const obs = item.f_observacion || '';
    if (!obs || obs.trim() === '') {
      item.f_observacion = nota;
      item.observacion = nota;
    } else if (!obs.includes(nota)) {
      item.f_observacion = `${obs.trim()}, ${nota}`;
      item.observacion = item.f_observacion;
    } else {
      const parts = obs.split(',').map((p: string) => p.trim()).filter((p: string) => p && p !== nota);
      item.f_observacion = parts.join(', ');
      item.observacion = item.f_observacion;
    }
  }

  limpiarNota(item: any): void {
    item.f_observacion = '';
    item.observacion = '';
  }

  setMedioPago(codigo: string): void {
    this.pagoConEditando = codigo;
    if (codigo === 'EF') {
      this.montoEfectivoEditando = this.totalEdicion;
    } else {
      this.montoEfectivoEditando = null;
    }
  }

  setMontoSugerido(monto: number): void {
    this.montoEfectivoEditando = monto;
  }

  // --- GUARDAR CAMBIOS CON VALIDACIÓN DE JUSTIFICACIÓN SI YA FUE COBRADA ---

  guardarCambiosEdicion(): void {
    if (!this.listaDetalle || this.listaDetalle.length === 0) {
      this.snackBar.open('La orden debe contener al menos un producto', 'Aviso', { duration: 3000 });
      return;
    }

    if (!this.idPedidoEditando) return;

    const esVentaCobrada = (Number(this.pedidoEditandoDatos?.f_state) === 1);

    if (esVentaCobrada) {
      // Si ya fue cobrada, el sistema exige obligatoriamente justificación
      const dialogRef = this.dialog.open(VentaJustificacionDialogComponent, {
        width: '540px',
        maxWidth: '95vw',
        disableClose: true,
        panelClass: 'modal-dialog-center',
        data: {
          idPedido: this.idPedidoEditando,
          montoTotal: this.totalEdicion,
          nombreCliente: this.nombreClienteEditando,
          itemsCount: this.totalItemsEdicion
        }
      });

      dialogRef.afterClosed().subscribe((res) => {
        if (res && res.confirmado && res.motivo) {
          this.ejecutarActualizacion(res.motivo);
        }
      });
    } else {
      // Venta pendiente de cobro: guardar directamente
      this.ejecutarActualizacion();
    }
  }

  private ejecutarActualizacion(motivo?: string): void {
    this.isSaving = true;

    const payload = {
      id: this.idPedidoEditando,
      f_idMesa: this.pedidoEditandoDatos?.f_idMesa || null,
      idMesa: this.pedidoEditandoDatos?.f_idMesa || null,
      f_nombreCliente: (this.nombreClienteEditando || '').trim() || 'CONSUMIDOR FINAL',
      nombreCliente: (this.nombreClienteEditando || '').trim() || 'CONSUMIDOR FINAL',
      f_pagoCon: this.pagoConEditando,
      pagoCon: this.pagoConEditando,
      f_nroOperacion: this.pagoConEditando === 'TA' ? (this.nroOperacionEditando?.trim() || null) : null,
      nroOperacion: this.pagoConEditando === 'TA' ? (this.nroOperacionEditando?.trim() || null) : null,
      f_caja: this.idCajaEditando || this.pedidoEditandoDatos?.f_caja || null,
      idCaja: this.idCajaEditando || this.pedidoEditandoDatos?.f_caja || null,
      f_cajero: this.idCajeroEditando || this.pedidoEditandoDatos?.f_cajero || null,
      idCajero: this.idCajeroEditando || this.pedidoEditandoDatos?.f_cajero || null,
      f_state: this.stateEditando,
      state: this.stateEditando,
      f_estadoServicio: this.estadoServicioEditando,
      estadoServicio: this.estadoServicioEditando,
      f_montoTotal: this.totalEdicion,
      montoTotal: this.totalEdicion,
      f_montoEfectivo: this.pagoConEditando === 'EF' ? (this.montoEfectivoEditando || this.totalEdicion) : this.totalEdicion,
      montoEfectivo: this.pagoConEditando === 'EF' ? (this.montoEfectivoEditando || this.totalEdicion) : this.totalEdicion,
      f_vuelto: this.pagoConEditando === 'EF' ? this.vueltoEdicion : 0,
      vuelto: this.pagoConEditando === 'EF' ? this.vueltoEdicion : 0,
      motivoActualizacion: motivo || null,
      f_detalle: this.listaDetalle.map(item => ({
        f_producto: item.f_producto || item.idProducto,
        idProducto: item.f_producto || item.idProducto,
        f_precio: item.f_precio || item.precio,
        monto: item.f_precio || item.precio,
        precio: item.f_precio || item.precio,
        f_cantidad: item.f_cantidad || item.cantidad,
        cantidad: item.f_cantidad || item.cantidad,
        f_observacion: item.f_observacion || item.observacion || '',
        observacion: item.f_observacion || item.observacion || ''
      }))
    };

    this.pedidoService.update(this.idPedidoEditando!, payload as any).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res && res.code === 200) {
          this.snackBar.open('¡Venta / Comanda actualizada exitosamente! (Stock y Kardex ajustados)', 'Cerrar', { duration: 4500 });
          this.modo = 'lista';
          this.idPedidoEditando = null;
          this.pedidoEditandoDatos = null;
          this.cargarVentas();
        } else {
          this.snackBar.open(res.message || 'Error al actualizar', 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || 'Error al actualizar la venta';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
      }
    });
  }

  anularVenta(idPedido: number): void {
    const dialogRef = this.dialog.open(AlertMsjComponent, {
      width: '400px',
      data: {
        mensaje: `¿Está seguro de que desea anular la orden #${idPedido}? Esta acción no se puede deshacer.`
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res === 'yes') {
        this.cargando = true;
        this.pedidoService.anularPedido(idPedido).subscribe({
          next: (resp) => {
            this.cargando = false;
            if (resp && resp.code === 200) {
              this.snackBar.open('Comanda anulada correctamente', 'Cerrar', { duration: 3500 });
              this.cargarVentas();
            } else {
              this.snackBar.open(resp.message || 'Error al anular comanda', 'Cerrar', { duration: 3500 });
            }
          },
          error: (err) => {
            this.cargando = false;
            console.error(err);
            this.snackBar.open('No se pudo anular la comanda', 'Cerrar', { duration: 3500 });
          }
        });
      }
    });
  }

  irRestaurante(): void {
    this.router.navigate(['/pages/restaurante']);
  }
}
