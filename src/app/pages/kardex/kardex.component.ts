import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../material/material.module';
import { AlmacenService, KpisKardex, MovimientoAlmacen } from '../../services/almacen.service';
import { AlmacenMovimientoDialogComponent } from '../almacen/almacen-movimiento-dialog/almacen-movimiento-dialog.component';
import { AlmacenTraspasoDialogComponent } from '../almacen/almacen-traspaso-dialog/almacen-traspaso-dialog.component';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './kardex.component.html',
  styleUrl: './kardex.component.css'
})
export class KardexComponent implements OnInit {
  cargando: boolean = false;
  movimientos: MovimientoAlmacen[] = [];
  almacenes: { id: number; nombre: string; codigo: string }[] = [];
  productos: { idProducto: number; nombre: string; codigo: string; unidadMedida: string }[] = [];

  kpis: KpisKardex = {
    totalMovimientos: 0,
    totalEntradas: 0,
    totalSalidas: 0,
    totalAjustes: 0,
    valorTotalEntradas: 0
  };

  filtros = {
    search: '',
    idAlmacen: 'todos',
    idProducto: 'todos',
    tipo: 'todos',
    fechaInicio: '',
    fechaFin: ''
  };

  esFiltroHoy: boolean = false;

  // Paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 12;

  constructor(
    private almacenService: AlmacenService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Si viene con queryParams (ej: ?idProducto=5)
    // this.aplicarFiltroHoy();
    this.route.queryParams.subscribe(params => {
      if (params['idProducto']) {
        this.filtros.idProducto = params['idProducto'];
      }
      if (params['idAlmacen']) {
        this.filtros.idAlmacen = params['idAlmacen'];
      }
      this.cargarMovimientos();
    });
  }

  cargarMovimientos(): void {
    this.cargando = true;
    this.almacenService.getMovimientos(this.filtros).subscribe({
      next: (res) => {
        this.cargando = false;
        this.movimientos = res.data || [];
        if (res.kpis) {
          this.kpis = res.kpis;
        }
        if (res.catalogos) {
          this.almacenes = res.catalogos.almacenes || [];
          this.productos = res.catalogos.productos || [];
        }
        this.paginaActual = 1;
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar movimientos de Kardex', 'Cerrar', { duration: 3500 });
      }
    });
  }

  filtrarPorTipo(tipo: string): void {
    this.filtros.tipo = tipo;
    this.cargarMovimientos();
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

  limpiarFiltros(): void {
    this.esFiltroHoy = false;
    this.filtros = {
      search: '',
      idAlmacen: 'todos',
      idProducto: 'todos',
      tipo: 'todos',
      fechaInicio: '',
      fechaFin: ''
    };
    this.cargarMovimientos();
  }

  get movimientosPaginados(): MovimientoAlmacen[] {
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

  abrirNuevoMovimiento(tipoInicial: 'E' | 'S' | 'A' = 'E'): void {
    const ref = this.dialog.open(AlmacenMovimientoDialogComponent, {
      width: '650px',
      disableClose: true,
      data: {
        productosList: this.productos,
        almacenes: this.almacenes,
        tipoInicial
      }
    });

    ref.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarMovimientos();
      }
    });
  }

  abrirTraspaso(): void {
    const ref = this.dialog.open(AlmacenTraspasoDialogComponent, {
      width: '660px',
      disableClose: true,
      data: {
        productosList: this.productos,
        almacenes: this.almacenes
      }
    });

    ref.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarMovimientos();
      }
    });
  }

  irAlmacenStock(): void {
    this.router.navigate(['/pages/almacen']);
  }
}
