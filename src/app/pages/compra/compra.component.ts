import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../material/material.module';
import {
  AlmacenCatalogo,
  CompraItem,
  CompraService,
  KpisCompra
} from '../../services/compra.service';
import { CompraDialogComponent } from './compra-dialog/compra-dialog.component';
import { CompraDetalleDialogComponent } from './compra-detalle-dialog/compra-detalle-dialog.component';
import { CompraRegistroComponent } from './compra-registro/compra-registro.component';

@Component({
  selector: 'app-compra',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
    CompraRegistroComponent
  ],
  templateUrl: './compra.component.html',
  styleUrls: ['./compra.component.scss']
})
export class CompraComponent implements OnInit {
  modo: 'lista' | 'nuevo' = 'lista';
  cargando: boolean = false;
  compras: CompraItem[] = [];
  almacenes: AlmacenCatalogo[] = [];

  kpis: KpisCompra = {
    totalCompras: 0,
    montoTotal: 0,
    totalUnidades: 0,
    comprasActivas: 0,
    comprasAnuladas: 0
  };

  filtros = {
    fechaInicio: '',
    fechaFin: '',
    idAlmacen: 'todos',
    estado: 'todos',
    metodoPago: 'todos',
    search: ''
  };

  // Paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 10;

  constructor(
    private compraService: CompraService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.cargarCatalogos();
    this.aplicarFiltroEsteMes();
  }

  cargarCatalogos(): void {
    this.compraService.getCatalogoApoyo().subscribe({
      next: (res) => {
        if (res.code === 200 && res.data) {
          this.almacenes = res.data.almacenes || [];
        }
      }
    });
  }

  cargarCompras(): void {
    this.cargando = true;
    this.compraService.getCompras(this.filtros).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.code === 200) {
          this.compras = res.data || [];
          this.kpis = res.kpis || this.kpis;
          this.paginaActual = 1;
        }
      },
      error: (err) => {
        this.cargando = false;
        this.snackBar.open('Error al cargar historial de compras', 'Cerrar', { duration: 3000 });
      }
    });
  }

  aplicarFiltroHoy(): void {
    const hoy = new Date().toISOString().substring(0, 10);
    this.filtros.fechaInicio = hoy;
    this.filtros.fechaFin = hoy;
    this.cargarCompras();
  }

  aplicarFiltroEsteMes(): void {
    const now = new Date();
    const primerDia = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
    const hoy = now.toISOString().substring(0, 10);
    this.filtros.fechaInicio = primerDia;
    this.filtros.fechaFin = hoy;
    this.cargarCompras();
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: '',
      fechaFin: '',
      idAlmacen: 'todos',
      estado: 'todos',
      metodoPago: 'todos',
      search: ''
    };
    this.cargarCompras();
  }

  abrirNuevaCompra(): void {
    this.modo = 'nuevo';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  cerrarRegistro(guardado: boolean): void {
    this.modo = 'lista';
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (guardado) {
      this.cargarCompras();
    }
  }

  verDetalle(compra: CompraItem): void {
    this.dialog.open(CompraDetalleDialogComponent, {
      width: '850px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { idCompra: compra.idCompra, compra }
    });
  }

  anularCompra(compra: CompraItem): void {
    if (compra.estado === 'ANULADO') {
      return;
    }

    const confirmar = confirm(`¿Está seguro de anular la compra ${compra.codigo} de ${compra.proveedorNombre} por S/ ${compra.montoTotal}?\n\nEsta acción revertirá las existencias ingresadas al almacén y el egreso registrado en caja.`);
    if (!confirmar) return;

    this.cargando = true;
    this.compraService.anularCompra(compra.idCompra).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.code === 200) {
          this.snackBar.open(res.message || 'Compra anulada con éxito', 'Cerrar', { duration: 4000 });
          this.cargarCompras();
        } else {
          this.snackBar.open(res.message || 'No se pudo anular la compra', 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        this.cargando = false;
        const msg = err?.error?.message || 'Error al conectar con el servidor para anular la compra.';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  // Paginación
  get comprasPaginadas(): CompraItem[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.compras.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.compras.length / this.registrosPorPagina) || 1;
  }

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas) {
      this.paginaActual = nueva;
    }
  }
}
