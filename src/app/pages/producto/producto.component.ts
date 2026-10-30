import { Component, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource } from '@angular/material/table';
import { Producto } from '../../../model/producto';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ProductoService } from '../../services/producto.service';
import { ProductoDialogComponent } from './producto-dialog/producto-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertMsjComponent } from '../alert-msj/alert-msj.component';
import { Categoria } from '../../../model/categoria';
import { map, Observable, startWith } from 'rxjs';
import { GlobalService } from '../../services/global.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressBarModule,
    DecimalPipe
  ],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.css'
})
export class ProductoComponent implements OnInit {
  cargaContenido: boolean = true;

  // Filtros
  filtroTextoControl = new FormControl('');
  ValueCategoria = new FormControl(null);
  controlStockFilter = new FormControl('todos');

  // Categorías
  filterCategoria = new FormControl('');
  filteredCategoria: Observable<any[]>;
  lst_categoria: Categoria[] = [];

  // KPIs
  kpis = {
    totalProductos: 0,
    conControlStock: 0,
    sinControlStock: 0,
    totalCategorias: 0
  };
  filtroStockRapido: 'todos' | 'con_stock' | 'sin_stock' = 'todos';

  // Datos
  rawProductos: Producto[] = [];
  dataSource: MatTableDataSource<Producto>;
  displayedColumns: string[] = [
    '#',
    'codigo',
    'imgId',
    'categoria',
    'nombre',
    'costo',
    'precio',
    'controlStock',
    'stockMinimo',
    'unidadMedida',
    'actions',
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private _dialog: MatDialog,
    private productoService: ProductoService,
    private _snackbar: MatSnackBar,
    private globalService: GlobalService,
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.fnCargaCboCategoria();
    this.cargarProductos();

    this.productoService.getDataChange().subscribe(data => {
      this.createTable(data);
    });
  }

  cargarProductos(): void {
    this.cargaContenido = true;
    const body = {
      nombres: this.filtroTextoControl.value || '',
      categoria: this.ValueCategoria.value != null ? this.ValueCategoria.value : '',
    };

    this.productoService.findAllList(body).subscribe({
      next: (data) => {
        this.rawProductos = data || [];
        // this.actualizarKpis(this.rawProductos);
        this.aplicarFiltrosLocales();
      },
      error: () => {
        this.cargaContenido = false;
        this._snackbar.open('Error al cargar catálogo de productos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  createTable(data: Producto[]): void {
    this.rawProductos = data || [];
    // this.actualizarKpis(this.rawProductos);
    this.aplicarFiltrosLocales();
  }

  // actualizarKpis(data: Producto[]): void {
  //   this.kpis.totalProductos = data.length;
  //   this.kpis.conControlStock = data.filter(p => p.controlStock != 0).length;
  //   this.kpis.sinControlStock = data.filter(p => p.controlStock == 0).length;

  //   const cats = new Set(data.map(p => p.categoria).filter(c => !!c));
  //   this.kpis.totalCategorias = cats.size || this.lst_categoria?.length || 0;
  // }

  filtrarPorStockRapido(tipo: 'todos' | 'con_stock' | 'sin_stock'): void {
    this.filtroStockRapido = tipo;
    if (tipo === 'todos') {
      this.controlStockFilter.setValue('todos', { emitEvent: false });
    } else if (tipo === 'con_stock') {
      this.controlStockFilter.setValue('1', { emitEvent: false });
    } else if (tipo === 'sin_stock') {
      this.controlStockFilter.setValue('0', { emitEvent: false });
    }
    this.aplicarFiltrosLocales();
  }

  aplicarFiltroControlStock(): void {
    const val = this.controlStockFilter.value;
    if (val === '1') {
      this.filtroStockRapido = 'con_stock';
    } else if (val === '0') {
      this.filtroStockRapido = 'sin_stock';
    } else {
      this.filtroStockRapido = 'todos';
    }
    this.aplicarFiltrosLocales();
  }

  aplicarFiltrosLocales(): void {
    let filtrados = [...this.rawProductos];
    const stockVal = this.controlStockFilter.value;

    if (stockVal === '1') {
      filtrados = filtrados.filter(p => p.controlStock != 0);
    } else if (stockVal === '0') {
      filtrados = filtrados.filter(p => p.controlStock == 0);
    }

    this.dataSource = new MatTableDataSource(filtrados);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.cargaContenido = false;
  }

  btnBuscar(): void {
    this.cargarProductos();
  }

  onClear(): void {
    this.filtroTextoControl.setValue('');
    this.ValueCategoria.setValue(null);
    this.controlStockFilter.setValue('todos');
    this.filtroStockRapido = 'todos';
    this.cargarProductos();
  }

  fnCargaCboCategoria(): void {
    this.globalService.getCategoria().subscribe((data) => {
      this.lst_categoria = data || [];
      this.filteredCategoria = this.filterCategoria.valueChanges.pipe(
        startWith(''),
        map(value => this._filterCategoria(value || ''))
      );
      if (this.rawProductos.length > 0) {
        // this.actualizarKpis(this.rawProductos);
      }
    });
  }

  private _filterCategoria(value: string): any[] {
    const filterValue = (value || '').toLowerCase();
    return this.lst_categoria.filter(option => option.nombre.toLowerCase().includes(filterValue));
  }

  openDialog(id?: number): void {
    this._dialog.open(ProductoDialogComponent, {
      data: id,
      disableClose: true,
      panelClass: 'modal-dialog-right',
    });
  }

  deletDialog(id: number): void {
    const dialogRef = this._dialog.open(AlertMsjComponent, {
      width: '350px',
      data: { status: 'confirm' },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.productoService.cambioEstado({ id: id, estado: 0 }).subscribe(data => {
          if (data['code'] == 200) {
            this._snackbar.open("Producto eliminado correctamente", "Aviso!", { duration: 3000, panelClass: 'custom-snackbar' });
            this.productoService.findAll().subscribe((data) => {
              this.productoService.setDataChange(data);
            });
          } else {
            this._snackbar.open(data['message'] || 'Error al eliminar producto', "Error!", { duration: 3000, panelClass: 'custom-snackbar' });
          }
        });
      }
    });
  }

  getRowClass(index: number): string {
    return index % 2 === 0 ? 'even-row' : 'odd-row';
  }

  getRowNumber(index: number): number {
    return this.paginator ? (this.paginator.pageIndex * this.paginator.pageSize) + (index + 1) : index + 1;
  }
}
