import { Component, ViewChild } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormControl, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
    MaterialModule,
    MatExpansionModule,  
    ReactiveFormsModule,
    MatPaginatorModule,
    CommonModule,
    MatTooltipModule,
    MatProgressBarModule,
    DecimalPipe
  ],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.css'
})
export class ProductoComponent {
  isPanelOpen = true;
  basicForm: UntypedFormGroup;
  cargaContenido: boolean = true;

  // Categoria
  ValueCategoria = new FormControl();
  filterCategoria = new FormControl();
  filteredCategoria: Observable<any[]>;
  lst_categoria: Categoria[];

  // Table
  dataSource: MatTableDataSource<Producto>;
  dataMovil: Producto[] = [];
  paginatedItems = [];
  pageSize = 10;
  pageIndex = 0;
  displayedColumns: string[] = [
    '#',
    'codigo',
    'imgId',
    'categoria', 
    'nombre', 
    'costo',
    'precio',
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
    this.fnCargaCboCategoria();

    this.productoService.findAllList().subscribe(data => {
      this.createTable(data);
    });

    this.productoService.getDataChange().subscribe(data => {
      this.createTable(data);
    });

    this.basicForm = new UntypedFormGroup({
      nombres: new FormControl(''),
    });
  }

  createTable(data: Producto[]) {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.cargaContenido = false;
    this.dataMovil = data;
    this.updatePaginatedItems();
  }

  private _filterCategoria(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.lst_categoria.filter(option => option.nombre.toLowerCase().includes(filterValue));
  }

  fnCargaCboCategoria() {
    this.globalService.getCategoria().subscribe((data) => {
      this.lst_categoria = data;
      this.filteredCategoria = this.filterCategoria.valueChanges.pipe(
        startWith(''),
        map(value => this._filterCategoria(value))
      );
    });
  }

  openDialog(id?: number) {
    this._dialog.open(ProductoDialogComponent, {
      data: id,
      disableClose: true,
      panelClass: 'modal-dialog-right',
    });
  }

  deletDialog(id: number) {
    const dialogRef = this._dialog.open(AlertMsjComponent, {
      width: '350px',
      data: { status: 'confirm' },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.productoService.cambioEstado({ id: id, estado: 0 }).subscribe(data => {
          if (data['code'] == 200) {
            this._snackbar.open("Datos eliminados correctamente", "Aviso!", { duration: 3000, panelClass: 'custom-snackbar' });
            this.productoService.findAll().subscribe((data) => {
              this.productoService.setDataChange(data);
            });
          } else {
            this._snackbar.open(data['message'], "Error!", { duration: 3000, panelClass: 'custom-snackbar' });
          }
        });
      }
    });
  }

  btnBuscar() {
    this.cargaContenido = true;
    const body = {
      nombres: this.basicForm.controls['nombres'].value,
      categoria: this.ValueCategoria.value != null ? this.ValueCategoria.value : '',
    };
    this.productoService.findAllList(body).subscribe(data => {
      this.createTable(data);
    });
  }

  onClear() {
    this.basicForm.reset();
    this.ValueCategoria.reset();
    this.btnBuscar();
  }

  getRowClass(index: number): string {
    return index % 2 === 0 ? 'even-row' : 'odd-row';
  }

  getRowNumber(index: number): number {
    return this.paginator ? (this.paginator.pageIndex * this.paginator.pageSize) + (index + 1) : index + 1;
  }

  updatePaginatedItems(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.dataMovil.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedItems();
  }
}
