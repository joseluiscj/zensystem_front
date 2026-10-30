import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../../material/material.module';
import { AlmacenService, MovimientoAlmacen, ProductoAlmacen } from '../../../services/almacen.service';

export interface KardexDialogData {
  producto?: ProductoAlmacen;
  productosList?: ProductoAlmacen[];
}

@Component({
  selector: 'app-almacen-kardex-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './almacen-kardex-dialog.component.html',
  styleUrl: './almacen-kardex-dialog.component.css'
})
export class AlmacenKardexDialogComponent implements OnInit {
  cargando: boolean = false;
  movimientos: MovimientoAlmacen[] = [];
  productos: ProductoAlmacen[] = [];
  productoFiltro: any = 'todos';

  filtros = {
    tipo: 'todos',
    fechaInicio: '',
    fechaFin: ''
  };

  // Paginación local
  paginaActual: number = 1;
  registrosPorPagina: number = 8;

  constructor(
    private dialogRef: MatDialogRef<AlmacenKardexDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KardexDialogData,
    private almacenService: AlmacenService
  ) {
    this.productos = data?.productosList || [];
    if (data?.producto) {
      this.productoFiltro = data.producto.idProducto;
    }
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.cargarMovimientos();
  }

  cargarMovimientos(): void {
    this.cargando = true;
    const query = {
      idProducto: this.productoFiltro,
      tipo: this.filtros.tipo,
      fechaInicio: this.filtros.fechaInicio,
      fechaFin: this.filtros.fechaFin
    };

    this.almacenService.getMovimientos(query).subscribe({
      next: (res) => {
        this.cargando = false;
        this.movimientos = res.data || [];
        this.paginaActual = 1;
      },
      error: () => {
        this.cargando = false;
        this.movimientos = [];
      }
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      tipo: 'todos',
      fechaInicio: '',
      fechaFin: ''
    };
    if (!this.data?.producto) {
      this.productoFiltro = 'todos';
    }
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

  cerrar(): void {
    this.dialogRef.close();
  }
}
