import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MaterialModule } from '../../material/material.module';
import { AlmacenService, KpisAlmacen, ProductoAlmacen } from '../../services/almacen.service';
import { AlmacenMovimientoDialogComponent } from './almacen-movimiento-dialog/almacen-movimiento-dialog.component';
import { AlmacenKardexDialogComponent } from './almacen-kardex-dialog/almacen-kardex-dialog.component';
import { AlmacenTraspasoDialogComponent } from './almacen-traspaso-dialog/almacen-traspaso-dialog.component';
import { AlmacenGestionDialogComponent } from './almacen-gestion-dialog/almacen-gestion-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-almacen',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatProgressBarModule,
    FormsModule,
    DecimalPipe
  ],
  templateUrl: './almacen.component.html',
  styleUrl: './almacen.component.css'
})
export class AlmacenComponent implements OnInit {
  cargando: boolean = false;
  productos: ProductoAlmacen[] = [];
  categorias: { id: number; f_nombre: string }[] = [];
  almacenes: any[] = [];

  kpis: KpisAlmacen = {
    totalProductos: 0,
    valorTotalInventario: 0,
    totalUnidadesStock: 0,
    totalAgotados: 0,
    totalStockBajo: 0,
    totalStockNormal: 0,
    resumenPorAlmacen: []
  };

  filtros = {
    search: '',
    idCategoria: 'todos',
    estadoStock: 'todos',
    idAlmacen: 'todos'
  };

  // Paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 10;

  constructor(
    private almacenService: AlmacenService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.cargarInventario();
  }

  cargarInventario(): void {
    this.cargando = true;
    this.almacenService.getProductos(this.filtros).subscribe({
      next: (res) => {
        this.cargando = false;
        this.productos = res.data || [];
        this.kpis = res.kpis || this.kpis;
        if (res.catalogos) {
          this.categorias = res.catalogos.categorias || [];
          this.almacenes = res.catalogos.almacenes || [];
        }
        this.paginaActual = 1;
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar datos del almacén', 'Cerrar', { duration: 3500 });
      }
    });
  }

  filtrarPorEstado(estado: string): void {
    this.filtros.estadoStock = estado;
    this.cargarInventario();
  }

  filtrarPorAlmacen(idAlm: any): void {
    this.filtros.idAlmacen = idAlm;
    this.cargarInventario();
  }

  limpiarFiltros(): void {
    this.filtros = {
      search: '',
      idCategoria: 'todos',
      estadoStock: 'todos',
      idAlmacen: 'todos'
    };
    this.cargarInventario();
  }

  get productosPaginados(): ProductoAlmacen[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.productos.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.productos.length / this.registrosPorPagina) || 1;
  }

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas) {
      this.paginaActual = nueva;
    }
  }

  // DIÁLOGOS
  abrirNuevoMovimiento(producto?: ProductoAlmacen, tipoInicial: 'E' | 'S' | 'A' = 'E'): void {
    const ref = this.dialog.open(AlmacenMovimientoDialogComponent, {
      width: '680px',
      disableClose: true,
      data: {
        producto,
        productosList: this.productos,
        almacenes: this.almacenes,
        tipoInicial
      }
    });

    ref.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarInventario();
      }
    });
  }

  abrirTraspaso(producto?: ProductoAlmacen): void {
    const ref = this.dialog.open(AlmacenTraspasoDialogComponent, {
      width: '660px',
      disableClose: true,
      data: {
        producto,
        productosList: this.productos,
        almacenes: this.almacenes
      }
    });

    ref.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargarInventario();
      }
    });
  }

  abrirGestionAlmacenes(): void {
    const ref = this.dialog.open(AlmacenGestionDialogComponent, {
      width: '900px',
      maxWidth: '92vw',
      disableClose: false
    });

    ref.afterClosed().subscribe(() => {
      this.cargarInventario();
    });
  }

  abrirKardex(producto?: ProductoAlmacen): void {
    if (producto) {
      this.router.navigate(['/pages/kardex'], { queryParams: { idProducto: producto.idProducto } });
    } else {
      this.router.navigate(['/pages/kardex']);
    }
  }

  irAdministracionProducto(): void {
    this.router.navigate(['/pages/producto']);
  }

  getStockAlmacen(prod: ProductoAlmacen, idAlmacen: number): number {
    if (!prod || !prod.stocks_almacenes) return 0;
    const item = prod.stocks_almacenes.find((sa: any) => sa.idAlmacen === idAlmacen);
    return item ? Number(item.stock) : 0;
  }

  getStockAlmacenTooltip(prod: ProductoAlmacen, alm: any): string {
    const stock = this.getStockAlmacen(prod, alm.id);
    return `${alm.nombre} (${alm.codigo}): ${stock.toFixed(2)} ${prod.unidadMedida || 'UND'}`;
  }
}
