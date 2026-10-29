import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MaterialModule } from '../../material/material.module';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PedidoService, VentaItem, ResumenVentas } from '../../services/pedido.service';
import { MesaService } from '../../services/mesa.service';
import { VentaDetalleDialogComponent } from './venta-detalle-dialog/venta-detalle-dialog.component';
import { RestauranteDialogDetalleComponent } from '../restaurante/restaurante-pedido/restaurante-dialog-detalle/restaurante-dialog-detalle.component';
import { AlertMsjComponent } from '../alert-msj/alert-msj.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    MatProgressBarModule
  ],
  templateUrl: './venta.component.html',
  styleUrl: './venta.component.css'
})
export class VentaComponent implements OnInit {
  // Modo de visualización: 'lista' o 'editar'
  modo: 'lista' | 'editar' = 'lista';
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
  editForm: UntypedFormGroup;
  listaDetalle: any[] = [];
  cajasDisponibles: any[] = [];
  cajerosDisponibles: any[] = [];
  mesasDisponibles: any[] = [];
  isSaving: boolean = false;

  constructor(
    private pedidoService: PedidoService,
    private mesaService: MesaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.filtrarHoy();
    // this.cargarMesasCatalogo();
    // this.cargarVentas();
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
      }
    });
  }

  iniciarEdicion(idPedido: number): void {
    this.cargando = true;
    this.idPedidoEditando = idPedido;

    this.pedidoService.obtenerPedidoCompleto(idPedido).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res && res.code === 200 && res.data) {
          const p = res.data;
          this.listaDetalle = (res.detalle || []).map((item: any) => ({
            ...item,
            f_subTotal: Number(item.f_precio || 0) * Number(item.f_cantidad || 0)
          }));
          this.cajasDisponibles = res.cajas || [];
          this.cajerosDisponibles = res.cajeros || [];
          this.mesasDisponibles = res.mesas || [];

          this.editForm = new UntypedFormGroup({
            id: new UntypedFormControl(p.id),
            idMesa: new UntypedFormControl(p.f_idMesa || ''),
            nombreCliente: new UntypedFormControl(p.f_nombreCliente || ''),
            pagoCon: new UntypedFormControl(p.f_pagoCon || 'EF'),
            caja: new UntypedFormControl(p.f_caja || (this.cajasDisponibles[0]?.id || '')),
            cajero: new UntypedFormControl(p.f_cajero || (this.cajerosDisponibles[0]?.id || '')),
            state: new UntypedFormControl(p.f_state !== undefined ? p.f_state : 0),
            montoTotal: new UntypedFormControl(p.f_montoTotal || '0.00'),
            montoEfectivo: new UntypedFormControl(p.f_montoEfectivo || ''),
            vuelto: new UntypedFormControl(p.f_vuelto || '0.00')
          });

          this.modo = 'editar';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          this.snackBar.open('No se pudo cargar la comanda para editar', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        this.snackBar.open('Error al cargar datos del pedido', 'Cerrar', { duration: 3500 });
      }
    });
  }

  cancelarEdicion(): void {
    this.modo = 'lista';
    this.idPedidoEditando = null;
    this.listaDetalle = [];
  }

  // --- MÉTODOS DEL EDITOR DE PEDIDO ---

  openDialogDetalle(): void {
    const dialogRef = this.dialog.open(RestauranteDialogDetalleComponent, {
      width: '430px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'modal-dialog-right'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.listaDetalle.push(result);
        this.calcularTotalesEdicion();
      }
    });
  }

  actualizarProducto(index: number): void {
    const dialogRef = this.dialog.open(RestauranteDialogDetalleComponent, {
      width: '430px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'modal-dialog-right',
      data: {
        producto: this.listaDetalle[index]
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.listaDetalle[index] = result;
        this.calcularTotalesEdicion();
      }
    });
  }

  eliminarProducto(index: number): void {
    this.listaDetalle.splice(index, 1);
    this.calcularTotalesEdicion();
  }

  incrementarCantidad(index: number): void {
    if (this.listaDetalle[index]) {
      this.listaDetalle[index].f_cantidad = Number(this.listaDetalle[index].f_cantidad || 0) + 1;
      this.listaDetalle[index].f_subTotal = Number(this.listaDetalle[index].f_cantidad) * Number(this.listaDetalle[index].f_precio || 0);
      this.calcularTotalesEdicion();
    }
  }

  decrementarCantidad(index: number): void {
    if (this.listaDetalle[index]) {
      const actual = Number(this.listaDetalle[index].f_cantidad || 0);
      if (actual > 1) {
        this.listaDetalle[index].f_cantidad = actual - 1;
        this.listaDetalle[index].f_subTotal = Number(this.listaDetalle[index].f_cantidad) * Number(this.listaDetalle[index].f_precio || 0);
        this.calcularTotalesEdicion();
      } else {
        this.eliminarProducto(index);
      }
    }
  }

  calcularTotalesEdicion(): void {
    let total = 0;
    for (const item of this.listaDetalle) {
      item.f_subTotal = Number(item.f_precio || 0) * Number(item.f_cantidad || 0);
      total += item.f_subTotal;
    }
    this.editForm.controls['montoTotal'].setValue(total.toFixed(2));
    this.calcularVueltoEdicion();
  }

  calcularVueltoEdicion(): void {
    const total = Number(this.editForm.controls['montoTotal'].value || 0);
    const efectivo = Number(this.editForm.controls['montoEfectivo'].value || 0);
    const vuelto = efectivo > total ? efectivo - total : 0;
    this.editForm.controls['vuelto'].setValue(vuelto.toFixed(2));
  }

  guardarCambiosEdicion(): void {
    if (this.listaDetalle.length === 0) {
      this.snackBar.open('El pedido debe tener al menos un producto', 'Aviso', { duration: 3000 });
      return;
    }

    if (!this.idPedidoEditando) return;

    this.isSaving = true;
    const formVals = this.editForm.value;

    const payload = {
      id: this.idPedidoEditando,
      f_idMesa: formVals.idMesa,
      f_nombreCliente: formVals.nombreCliente,
      f_pagoCon: formVals.pagoCon,
      f_caja: formVals.caja,
      f_cajero: formVals.cajero,
      f_state: formVals.state,
      f_montoTotal: formVals.montoTotal,
      f_montoEfectivo: formVals.montoEfectivo,
      f_vuelto: formVals.vuelto,
      f_detalle: this.listaDetalle
    };

    this.pedidoService.update(this.idPedidoEditando, payload as any).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res && res.code === 200) {
          this.snackBar.open('¡Pedido actualizado con éxito!', 'Cerrar', { duration: 3500 });
          this.modo = 'lista';
          this.idPedidoEditando = null;
          this.cargarVentas();
        } else {
          this.snackBar.open(res.message || 'Error al actualizar pedido', 'Cerrar', { duration: 3500 });
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error(err);
        this.snackBar.open('Error al comunicarse con el servidor', 'Cerrar', { duration: 3500 });
      }
    });
  }

  anularVenta(idPedido: number): void {
    const dialogRef = this.dialog.open(AlertMsjComponent, {
      width: '400px',
      data: {
        mensaje: `¿Está seguro de que desea anular la comanda #${idPedido}? Esta acción no se puede deshacer.`
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
