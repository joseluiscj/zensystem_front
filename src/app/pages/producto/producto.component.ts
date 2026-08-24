import { Component, ViewChild } from '@angular/core';
import { MaterialModule } from '../../material/material.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormControl, ReactiveFormsModule, UntypedFormGroup } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
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
import {MatProgressBarModule} from '@angular/material/progress-bar';

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
    MatProgressBarModule
  ],
  templateUrl: './producto.component.html',
  styleUrl: './producto.component.css'
})
export class ProductoComponent {
  isPanelOpen = true;
  basicForm: UntypedFormGroup;
  cargaContenido:boolean=true;

  //categoria
  ValueCategoria = new FormControl();
  filterCategoria = new FormControl();
  filteredCategoria: Observable<any[]>;
  lst_categoria: Categoria[];
  //
  
  //table
  dataSource: MatTableDataSource<Producto>;
  dataMovil:Producto[] = [];
  paginatedItems = [];
  pageSize = 10;
  pageIndex = 0;
  displayedColumns: string[] = [
    '#',
    // 'img',
    'imgId',
    'categoria', 
    'nombre', 
    'descripcion',
    'precio', 
    'actions',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort:MatSort;

  constructor(
    private _dialog: MatDialog,
    private productoService: ProductoService,
    private _snackbar: MatSnackBar,
    private globalService: GlobalService,
    
  ){}

  ngOnInit(): void {
    this.fnCargaCboCategoria();

    this.productoService.findAllList().subscribe(data =>{
      this.createTable(data);
    })

    this.productoService.getDataChange().subscribe((data)=>{
      this.createTable(data)
    })

    this.basicForm = new UntypedFormGroup({
      nombres: new FormControl(''),
      categoria: new FormControl(''),
    });
  }
  fnCargaCboCategoria(){
    this.globalService.getCategoria().subscribe((data) => {
      this.lst_categoria = data;
      this.filteredCategoria = this.filterCategoria.valueChanges.pipe(
        startWith(''),
        map(value => this._filterCategoria(value))
      );
    })
  }
  private _filterCategoria(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.lst_categoria.filter(option => option.nombre.toLowerCase().includes(filterValue));
  } 
  openDialog(id?: number) {
    this._dialog.open(ProductoDialogComponent, {
      data: id,
      disableClose: true,
      panelClass: 'modal-dialog-right',
    })
  }
  btnBuscar(): void {
    // const formValues = this.basicForm.value;
    this.basicForm.controls["categoria"].setValue(this.ValueCategoria.value);

    this.productoService.findAllList(this.basicForm.value).subscribe((data)=>{
      this.createTable(data);
    })
  }
  onClear(){
    this.ValueCategoria.setValue('');
    this.basicForm.controls["categoria"].setValue("");
    this.basicForm.reset();
  }
  openHistorial(id?: number) {

  }
  deletDialog(idProducto?: number){
    let dialogRef = this._dialog.open(AlertMsjComponent, {
      width: '300px',
      disableClose: true,
      data: { mensaje: '¿Está seguro de eliminar producto?'}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        const datax = {
          id: idProducto,
          estado: '0',
        }
        this.productoService.cambioEstado(datax).subscribe(data => {
          if(data['code'] == 200){
            this._snackbar.open('Categoría eliminada correctamente ', 'Correcto!', {
              duration: 3000,
              panelClass: 'custom-snackbar'
            });
            this.productoService.findAllList().subscribe(data =>{
              this.createTable(data);
            }) 
          }else{
            this._snackbar.open(data['message'], "Error!",{duration:6000,panelClass: 'custom-snackbar'});
          }
        }) 
      } 
    });
  }
  //======TABLA WEB Y MOVIL=====
  createTable(data: Producto[]){
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort; 
    this.dataMovil = data; 
    this.cargaContenido=false;
    this.updatePaginatedItems();
  }
  updatePaginatedItems(){
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.dataMovil.slice(startIndex, endIndex);
  }
  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePaginatedItems();
  }
  applyFilter(e: any){ 
    this.dataSource.filter = e.target.value.trim();
  } 
  applyFilterMov(e: any){ 
    this.dataSource.filter = e.target.value.trim();
    this.paginatedItems =this.dataSource['_renderData']['_value'];
  }
  getRowNumber(index: number): number {
    return (this.paginator.pageIndex * this.paginator.pageSize) + index + 1;
  }
  // FIN
  getRowClass(index: number): string {
    return index % 2 === 0 ? 'fila-par' : 'fila-impar';
  }

}
