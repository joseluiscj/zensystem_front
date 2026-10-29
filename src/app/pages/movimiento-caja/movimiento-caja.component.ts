import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../material/material.module';
import { CajaCatalogo, CajaMovimientoItem, CajaMovimientoService, KpisCajaMovimiento } from '../../services/caja-movimiento.service';
import { MovimientoCajaDialogComponent } from './movimiento-caja-dialog/movimiento-caja-dialog.component';

@Component({
  selector: 'app-movimiento-caja',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    DecimalPipe,
    DatePipe
  ],
  templateUrl: './movimiento-caja.component.html',
  styleUrl: './movimiento-caja.component.css'
})
export class MovimientoCajaComponent implements OnInit {
  cargando: boolean = false;
  movimientos: CajaMovimientoItem[] = [];
  cajas: CajaCatalogo[] = [];
  categoriasGastos: string[] = [];
  categoriasIngresos: string[] = [];

  kpis: KpisCajaMovimiento = {
    totalIngresos: 0,
    totalEgresos: 0,
    balanceNeto: 0,
    totalMovimientos: 0,
    saldoTotalCajas: 0
  };

  filtros = {
    tipo: 'todos',
    idCaja: 'todos',
    metodoPago: 'todos',
    categoria: 'todos',
    search: '',
    fechaInicio: '',
    fechaFin: ''
  };

  esFiltroHoy: boolean = false;

  // Paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 10;

  constructor(
    private cajaMovimientoService: CajaMovimientoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // this.cargarMovimientos();
    this.aplicarFiltroHoy();
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.cajaMovimientoService.getMovimientos(this.filtros).subscribe({
      next: (res) => {
        this.cargando = false;
        this.movimientos = res.data || [];
        this.kpis = res.kpis || this.kpis;
        if (res.catalogos) {
          this.cajas = res.catalogos.cajas || [];
          this.categoriasGastos = res.catalogos.categoriasGastos || [];
          this.categoriasIngresos = res.catalogos.categoriasIngresos || [];
        }
        this.paginaActual = 1;
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar movimientos de caja', 'Cerrar', { duration: 3500 });
      }
    });
  }

  aplicarFiltroHoy(): void {
    this.esFiltroHoy = !this.esFiltroHoy;
    if (this.esFiltroHoy) {
      const hoy = new Date().toISOString().substring(0, 10);
      this.filtros.fechaInicio = hoy;
      this.filtros.fechaFin = hoy;
    } else {
      this.filtros.fechaInicio = '';
      this.filtros.fechaFin = '';
    }
    this.cargarMovimientos();
  }

  filtrarPorTipo(tipo: string): void {
    this.filtros.tipo = tipo;
    this.cargarMovimientos();
  }

  limpiarFiltros(): void {
    this.esFiltroHoy = false;
    this.filtros = {
      tipo: 'todos',
      idCaja: 'todos',
      metodoPago: 'todos',
      categoria: 'todos',
      search: '',
      fechaInicio: '',
      fechaFin: ''
    };
    this.cargarMovimientos();
  }

  get movimientosPaginados(): CajaMovimientoItem[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.movimientos.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.movimientos.length / this.registrosPorPagina) || 1;
  }

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas) {
      this.paginaActual = nueva;
    }
  }

  abrirNuevoMovimiento(tipoInicial: 'I' | 'E' = 'E'): void {
    const ref = this.dialog.open(MovimientoCajaDialogComponent, {
      disableClose: true,
      panelClass: 'modal-dialog-right',
      data: {
        tipoInicial,
        cajas: this.cajas,
        categoriasGastos: this.categoriasGastos,
        categoriasIngresos: this.categoriasIngresos
      }
    });

    ref.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarMovimientos();
      }
    });
  }

  abrirEditarMovimiento(m: CajaMovimientoItem): void {
    const ref = this.dialog.open(MovimientoCajaDialogComponent, {
      disableClose: true,
      panelClass: 'modal-dialog-right',
      data: {
        tipoInicial: m.tipo,
        cajas: this.cajas,
        categoriasGastos: this.categoriasGastos,
        categoriasIngresos: this.categoriasIngresos,
        movimiento: m
      }
    });

    ref.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarMovimientos();
      }
    });
  }

  anularMovimiento(m: CajaMovimientoItem): void {
    const esIngreso = m.tipo === 'I';
    const tipoTexto = esIngreso ? 'Ingreso' : 'Gasto / Egreso';
    const confirmacion = confirm(`¿Está seguro de anular este ${tipoTexto} por $${m.monto}?\n\n"${m.descripcion}"\n\nEl saldo de la caja será recalculado automáticamente.`);

    if (!confirmacion) return;

    this.cargando = true;
    this.cajaMovimientoService.anularMovimiento(m.idCajaMovimiento).subscribe({
      next: (res) => {
        this.cargando = false;
        this.snackBar.open(res.message || 'Movimiento anulado correctamente.', 'Cerrar', { duration: 3500 });
        this.cargarMovimientos();
      },
      error: (err) => {
        this.cargando = false;
        const msg = err.error?.message || 'Error al anular movimiento de caja';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  obtenerNombreMedioPago(codigo: string): string {
    const mapa: { [key: string]: string } = {
      'EF': 'Efectivo',
      'TJ': 'Tarjeta',
      'TA': 'Tarjeta',
      'TR': 'Transferencia',
      'YP': 'Yape',
      'PL': 'Plin'
    };
    return mapa[codigo] || codigo;
  }
}
